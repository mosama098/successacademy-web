import "server-only";
import type { Order, PaymentEvent, PaymentVerification } from "../types";
import { DEFAULT_PROGRAM_TYPE, getLearningPackage, isProgramType } from "../../plans/config";
import type { PromoRedemptionGuard } from "../../promos/types";
import { PromoValidationError } from "../../promos/promo-repository";
import type { AuditRecord, BookingRecords } from "./booking-records";
import { bookingPaymentStatus, toBookingSheetRow, toPromoUsageSheetRow } from "./booking-sheet";
import {
  OrderRepositoryConflictError,
  OrderRepositoryUnavailableError,
  type CreateOrderResult,
  type OrderRepository,
} from "./order-repository";

const REQUEST_TIMEOUT_MS = 30_000;

type FetchLike = typeof fetch;

type GoogleSheetsOrderRepositoryOptions = {
  webhookUrl: string;
  webhookSecret: string;
  fetchImpl?: FetchLike;
};

export class GoogleSheetsOrderRepository implements OrderRepository {
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;
  private readonly fetchImpl: FetchLike;

  constructor({ webhookUrl, webhookSecret, fetchImpl = fetch }: GoogleSheetsOrderRepositoryOptions) {
    this.webhookUrl = webhookUrl;
    this.webhookSecret = webhookSecret;
    this.fetchImpl = fetchImpl;

    if (!webhookUrl.trim() || !webhookSecret.trim()) {
      throw new OrderRepositoryUnavailableError();
    }
  }

  async createIfAbsent(order: Order, event: PaymentEvent, records: BookingRecords, promo?: PromoRedemptionGuard): Promise<CreateOrderResult> {
    if (records.customer.orderId !== order.id || records.customer.customerId !== order.customer.id
      || records.audit.orderId !== order.id || records.notification.orderId !== order.id
      || order.customer.name !== null || order.customer.phone !== null || order.customer.email !== null || order.customer.leadReference !== null
      || Boolean(promo) !== Boolean(records.promoUsage)) throw new OrderRepositoryUnavailableError();
    // One Bookings row plus optional Promo Usage. No separate customer/audit/outbox tabs.
    const data = await this.execute("create_order", {
      contractVersion: 3, order, event, booking: toBookingSheetRow(order, records),
      promoUsage: records.promoUsage ? toPromoUsageSheetRow(records.promoUsage) : null,
      promo: promo ?? null,
      notification: records.notification,
    });
    const storedOrder = readOrder(data.order);
    if (
      typeof data.created !== "boolean" ||
      storedOrder.idempotencyKeyHash !== order.idempotencyKeyHash ||
      (data.created && (storedOrder.id !== order.id || storedOrder.status !== "pending" || storedOrder.payment.status !== "not_started"))
    ) throw new OrderRepositoryUnavailableError();
    const commit = data.bookingCommit;
    if (!isPlainObject(commit) || commit.version !== 3 || commit.orderId !== storedOrder.id
      || commit.requestFingerprint !== storedOrder.requestFingerprint || commit.bookingSaved !== true
      || commit.promoUsageBookingId !== (promo ? storedOrder.id : null)) {
      throw new OrderRepositoryUnavailableError();
    }
    if (storedOrder.requestFingerprint === order.requestFingerprint) {
      for (const key of Object.keys(order.packageSnapshot) as (keyof Order["packageSnapshot"])[]) {
        if (JSON.stringify(storedOrder.packageSnapshot[key]) !== JSON.stringify(order.packageSnapshot[key])) {
          throw new OrderRepositoryUnavailableError();
        }
      }
      if (storedOrder.payment.amountMinor !== order.payment.amountMinor || storedOrder.attendance !== order.attendance || storedOrder.payment.method !== order.payment.method
        || storedOrder.payment.proofLink !== order.payment.proofLink || storedOrder.programType !== order.programType) {
        throw new OrderRepositoryUnavailableError();
      }
      if (!matchesSnapshot(order.pricing, storedOrder.pricing) || !storedOrder.legalConsent?.accepted) {
        throw new OrderRepositoryUnavailableError();
      }
      if (!matchesSnapshot(order.promoRedemption, storedOrder.promoRedemption)) throw new OrderRepositoryUnavailableError();
      if (data.created && !matchesSnapshot(order.legalConsent, storedOrder.legalConsent)) throw new OrderRepositoryUnavailableError();
      if (!matchesSnapshot(order.customer, storedOrder.customer)) throw new OrderRepositoryUnavailableError();
    }
    return { order: storedOrder, created: data.created };
  }

  async findByIdempotencyKeyHash(idempotencyKeyHash: string): Promise<Order | null> {
    const data = await this.execute("find_order_by_idempotency", { idempotencyKeyHash });
    if (data.order === null) return null;
    const order = readOrder(data.order);
    if (order.idempotencyKeyHash !== idempotencyKeyHash) throw new OrderRepositoryUnavailableError();
    return order;
  }

  async getById(orderId: string): Promise<Order | null> {
    const data = await this.execute("get_order", { orderId });
    if (data.order === null) return null;
    const order = readOrder(data.order);
    if (order.id !== orderId) throw new OrderRepositoryUnavailableError();
    return order;
  }

  async ensurePromoReservation(orderId: string): Promise<void> {
    const data = await this.execute("ensure_promo_reservation", { contractVersion: 3, orderId });
    if (data.orderId !== orderId || data.reservationReady !== true) throw new OrderRepositoryUnavailableError();
  }

  async commitTransition(order: Order, event: PaymentEvent, audit: AuditRecord): Promise<Order> {
    const data = await this.execute("commit_booking_transition", { contractVersion: 3, order, event, audit,
      expectedStatus: event.previousStatus, bookingPaymentStatus: bookingPaymentStatus(order.payment.status) });
    const stored = readOrder(data.order);
    if (stored.id !== order.id || stored.status !== order.status || !matchesSnapshot(order.payment, stored.payment)
      || stored.programType !== order.programType
      || !matchesSnapshot(order.pricing, stored.pricing) || !matchesSnapshot(order.promoRedemption, stored.promoRedemption)
      || !matchesSnapshot(order.packageSnapshot, stored.packageSnapshot)
      || !matchesSnapshot(order.legalConsent, stored.legalConsent) || !matchesSnapshot(order.customer, stored.customer)
      || !isPlainObject(data.transitionCommit) || data.transitionCommit.orderId !== order.id
      || data.transitionCommit.statusSaved !== true) throw new OrderRepositoryUnavailableError();
    return stored;
  }

  async createVerification(
    verification: PaymentVerification,
    event: PaymentEvent,
  ): Promise<PaymentVerification> {
    const data = await this.execute("create_payment_verification", { contractVersion: 3, verification, event });
    return readVerification(data.verification);
  }

  async updateVerification(
    verification: PaymentVerification,
    event: PaymentEvent,
  ): Promise<PaymentVerification> {
    const data = await this.execute("update_payment_verification", { contractVersion: 3, verification, event });
    return readVerification(data.verification);
  }

  private async execute(action: string, payload: Record<string, unknown>) {
    let response: Response;

    try {
      response = await this.fetchImpl(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: this.webhookSecret,
          domain: "payments",
          action,
          payload: protectSpreadsheetValue(payload),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new OrderRepositoryUnavailableError();
    }

    if (!response.ok) throw new OrderRepositoryUnavailableError();

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new OrderRepositoryUnavailableError();
    }

    if (isPlainObject(result) && result.success === false) {
      if (result.error === "promo_limit_reached" || result.error === "promo_expired" || result.error === "promo_inactive" || result.error === "promo_not_started" || result.error === "promo_changed" || result.error === "promo_package_ineligible" || result.error === "promo_reservation_expired") {
        throw new PromoValidationError(result.error);
      }
    }
    if (isPlainObject(result) && result.success === false && result.error === "order_conflict") {
      throw new OrderRepositoryConflictError();
    }
    if (!isPlainObject(result) || result.success !== true || !isPlainObject(result.data)) {
      throw new OrderRepositoryUnavailableError();
    }

    return result.data;
  }
}

function readVerification(value: unknown): PaymentVerification {
  if (
    !isPlainObject(value) ||
    typeof value.id !== "string" ||
    typeof value.orderId !== "string" ||
    typeof value.submittedAt !== "string" ||
    typeof value.claimedAmountMinor !== "number" ||
    (value.status !== "pending" && value.status !== "approved" && value.status !== "rejected")
  ) {
    throw new OrderRepositoryUnavailableError();
  }
  return value as PaymentVerification;
}

function matchesSnapshot<T extends object>(expected: T | undefined, actual: T | undefined) {
  if (!expected || !actual) return expected === undefined && actual === undefined;
  return (Object.keys(expected) as (keyof T)[]).every((key) => JSON.stringify(expected[key]) === JSON.stringify(actual[key]));
}

function readOrder(value: unknown): Order {
  if (
    !isPlainObject(value) ||
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    typeof value.idempotencyKeyHash !== "string" ||
    typeof value.requestFingerprint !== "string" ||
    !isPlainObject(value.customer) ||
    !isPlainObject(value.packageSnapshot) ||
    !isPlainObject(value.payment) ||
    !isPlainObject(value.marketing)
  ) {
    throw new OrderRepositoryUnavailableError();
  }

  const packageId = typeof value.packageSnapshot.packageId === "string" ? value.packageSnapshot.packageId : null;
  const learningPackage = getLearningPackage(packageId);
  const programType = value.programType === undefined ? DEFAULT_PROGRAM_TYPE : value.programType;
  if (!isProgramType(typeof programType === "string" ? programType : null)
    || !learningPackage || learningPackage.programType !== programType) {
    throw new OrderRepositoryUnavailableError();
  }
  const sessionDurationHours = value.packageSnapshot.sessionDurationHours === undefined
    ? learningPackage.sessionDurationHours
    : value.packageSnapshot.sessionDurationHours;
  if (sessionDurationHours !== learningPackage.sessionDurationHours) throw new OrderRepositoryUnavailableError();

  return {
    ...value,
    programType,
    packageSnapshot: { ...value.packageSnapshot, sessionDurationHours },
  } as Order;
}

function protectSpreadsheetValue(value: unknown): unknown {
  if (typeof value === "string") {
    return /^[\u0000-\u0020]*[=+\-@]/.test(value) ? `'${value}` : value;
  }
  if (Array.isArray(value)) return value.map(protectSpreadsheetValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, fieldValue]) => [key, protectSpreadsheetValue(fieldValue)]),
    );
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
