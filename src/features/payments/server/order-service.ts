import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  getPlanRecommendation,
  isAttendanceMode,
  isLearningLevel,
  isLearningPackageId,
  resolveProgramType,
  type AttendanceMode,
  type LearningPackageId,
  type PaymentMethodId,
} from "../../plans/config";
import type { Locale } from "../../../lib/i18n";
import type {
  Order,
  LegalPolicyLinks,
  OrderCustomer,
  OrderMarketing,
  OrderStatus,
  PaymentEvent,
  PaymentProviderId,
  PaymentStatus,
} from "../types";
import type { OrderRepository } from "./order-repository";
import { isPaymentMethodPreference, requiresPaymentProof, validateCustomerContact, validatePaymentProof } from "../validation";
import { normalizePromoCode, toMinorUnits, type PromoService } from "../../promos/promo-service";
import { PromoRepositoryUnavailableError } from "../../promos/promo-repository";
import { createLegalConsentSnapshot, getLegalPolicyLinks, requireLegalConsent } from "./legal-consent";
import { validateEnrollment } from "../../customers/validation";
import { CustomerService } from "../../customers/customer-service";
import { prepareAudit, prepareBookingNotification, type BookingRecords } from "./booking-records";

const IDEMPOTENCY_KEY_MIN_LENGTH = 16;
const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
const PROMO_RESERVATION_MS: Readonly<Partial<Record<PaymentMethodId, number>>> = {
  branch: 72 * 60 * 60 * 1000,
  card: 60 * 60 * 1000,
  installments: 60 * 60 * 1000,
};

const allowedTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["waiting_payment", "waiting_verification", "cancelled"],
  waiting_payment: ["paid", "failed", "cancelled"],
  waiting_verification: ["paid", "failed", "cancelled"],
  paid: [],
  failed: ["waiting_payment", "waiting_verification", "cancelled"],
  cancelled: [],
};

export type CreateOrderInput = {
  enrollment: unknown;
  locale: Locale;
  startLevel: string;
  targetLevel: string;
  packageId: string;
  programType?: string;
  attendance: string;
  quotedPriceEgp: number;
  quotedFinalPriceEgp?: number;
  promoCode?: string;
  legalConsent?: { accepted: boolean };
  paymentMethod: string;
  proofLink?: unknown;
  marketing?: Partial<OrderMarketing>;
};

export type CreateOrderContext = {
  customer: OrderCustomer;
  idempotencyKey: string;
};

export type OrderTransitionInput = {
  status: OrderStatus;
  method?: PaymentMethodId | null;
  provider?: PaymentProviderId | null;
  transactionId?: string | null;
  redirectUrl?: string | null;
};

type OrderServiceDependencies = {
  repository: OrderRepository;
  now?: () => Date;
  createId?: () => string;
  promoService?: PromoService;
  legalPolicies?: (locale: Locale) => LegalPolicyLinks;
};

export class OrderValidationError extends Error {
  constructor(
    readonly code:
      | "invalid_customer"
      | "invalid_payment_method"
      | "invalid_payment_proof"
      | "invalid_idempotency_key"
      | "invalid_plan"
      | "invalid_attendance"
      | "price_mismatch"
      | "invalid_transition"
      | "missing_transaction_reference",
  ) {
    super(code);
    this.name = "OrderValidationError";
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super("order_not_found");
    this.name = "OrderNotFoundError";
  }
}

export class OrderIdempotencyConflictError extends Error {
  constructor() {
    super("idempotency_conflict");
    this.name = "OrderIdempotencyConflictError";
  }
}

export class OrderService {
  private readonly repository: OrderRepository;
  private readonly now: () => Date;
  private readonly createId: () => string;
  private readonly promoService?: PromoService;
  private readonly legalPolicies: (locale: Locale) => LegalPolicyLinks;

  constructor({ repository, now = () => new Date(), createId = randomUUID, promoService, legalPolicies = getLegalPolicyLinks }: OrderServiceDependencies) {
    this.repository = repository;
    this.now = now;
    this.createId = createId;
    this.promoService = promoService;
    this.legalPolicies = legalPolicies;
  }

  async createOrder(input: CreateOrderInput, context: CreateOrderContext) {
    requireLegalConsent(input.legalConsent);
    validateCustomer(context.customer);
    validateIdempotencyKey(context.idempotencyKey);
    const contact = validateCustomerContact(context.customer);
    if (!contact.valid) throw new OrderValidationError("invalid_customer");
    if (!isPaymentMethodPreference(input.paymentMethod)) {
      throw new OrderValidationError("invalid_payment_method");
    }
    const proof = validatePaymentProof(input.proofLink, input.paymentMethod);
    if (!proof.valid || (requiresPaymentProof(input.paymentMethod) && !proof.proofLink)) {
      throw new OrderValidationError("invalid_payment_proof");
    }

    if (
      (input.locale !== "ar" && input.locale !== "en") ||
      !isLearningLevel(input.startLevel) ||
      !isLearningLevel(input.targetLevel) ||
      !isLearningPackageId(input.packageId)
    ) {
      throw new OrderValidationError("invalid_plan");
    }
    const programType = resolveProgramType(input.programType);
    if (!programType) throw new OrderValidationError("invalid_plan");

    if (!isAttendanceMode(input.attendance)) {
      throw new OrderValidationError("invalid_attendance");
    }
    const enrollment = validateEnrollment(input.enrollment, input.attendance);
    if (!enrollment.valid || enrollment.details.name !== contact.contact.name || enrollment.details.phone !== contact.contact.phone || enrollment.details.email !== contact.contact.email) {
      throw new OrderValidationError("invalid_customer");
    }

    const promoCode = input.promoCode === undefined || input.promoCode === "" ? null : normalizePromoCode(input.promoCode);
    const idempotencyKeyHash = hash(`${context.customer.id}:${context.idempotencyKey}`);
    const requestFingerprint = hash(JSON.stringify({
      customerId: context.customer.id,
      contact: contact.contact,
      enrollment: enrollment.details,
      paymentMethod: input.paymentMethod,
      proofLink: proof.proofLink,
      locale: input.locale,
      startLevel: input.startLevel,
      targetLevel: input.targetLevel,
      packageId: input.packageId,
      ...(programType === "private" ? { programType } : {}),
      attendance: input.attendance,
      priceEgp: input.quotedPriceEgp,
      finalPriceEgp: input.quotedFinalPriceEgp ?? input.quotedPriceEgp,
      promoCode,
      legalConsentAccepted: true,
    }));
    // A retry returns the saved snapshot even if the promo was edited or expired afterward.
    const existing = await this.repository.findByIdempotencyKeyHash(idempotencyKeyHash);
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new OrderIdempotencyConflictError();
      return { order: existing, created: false };
    }
    const recommendation = getPlanRecommendation(programType, input.startLevel, input.targetLevel);
    if (!recommendation || recommendation.package.id !== input.packageId) throw new OrderValidationError("invalid_plan");
    if (!Number.isSafeInteger(input.quotedPriceEgp) || input.quotedPriceEgp !== recommendation.package.priceEgp) {
      throw new OrderValidationError("price_mismatch");
    }
    const timestamp = this.now().toISOString();
    const legalConsent = createLegalConsentSnapshot(timestamp, this.legalPolicies(input.locale));
    if (promoCode && !this.promoService) throw new PromoRepositoryUnavailableError();
    const quote = promoCode ? await this.promoService!.quote(promoCode, recommendation.package.id) : null;
    const pricing = quote?.pricing ?? { originalPrice: recommendation.package.priceEgp, promoCode: null, discountAmount: 0, finalPrice: recommendation.package.priceEgp };
    if ((promoCode && input.quotedFinalPriceEgp === undefined) || (input.quotedFinalPriceEgp !== undefined && input.quotedFinalPriceEgp !== pricing.finalPrice)) {
      throw new OrderValidationError("price_mismatch");
    }
    const orderId = this.createId();

    const order: Order = {
      id: orderId,
      locale: input.locale,
      createdAt: timestamp,
      updatedAt: timestamp,
      programType,
      customer: { id: context.customer.id, identitySource: context.customer.identitySource, leadReference: null, name: null, phone: null, email: null },
      legalConsent,
      pricing,
      promoRedemption: quote?.redemption,
      packageSnapshot: {
        packageId: recommendation.package.id,
        packageName: recommendation.package.name[input.locale],
        startLevel: recommendation.startLevel,
        targetLevel: recommendation.targetLevel,
        levelsToStudy: [...recommendation.levelsToStudy],
        hours: recommendation.requiredHours,
        sessions: recommendation.package.sessions,
        sessionDurationHours: recommendation.package.sessionDurationHours,
        estimatedWeeks: recommendation.package.estimatedWeeks,
        priceEgp: recommendation.package.priceEgp,
        regularPriceEgp: recommendation.package.regularPriceEgp,
        discountEgp: recommendation.package.savingEgp,
      },
      attendance: input.attendance,
      payment: {
        method: input.paymentMethod,
        provider: null,
        status: "not_started",
        currency: "EGP",
        amountMinor: toMinorUnits(pricing.finalPrice),
        transactionId: null,
        proofLink: proof.proofLink,
      },
      marketing: normalizeMarketing(input.marketing),
      status: "pending",
      idempotencyKeyHash,
      requestFingerprint,
      notes: null,
    };
    const event = createEvent(this.createId(), order, "order_created", null, timestamp);
    const records: BookingRecords = {
      customer: CustomerService.prepareRegistration(enrollment.details, order),
      promoUsage: promoCode ? { usageId: `promo-use:${orderId}`, promoCode, orderId,
        customerId: order.customer.id, customerName: enrollment.details.name,
        customerPhone: enrollment.details.phone, discountAmount: pricing.discountAmount, usedAt: timestamp,
        status: input.paymentMethod === "instapay" || input.paymentMethod === "wallet" ? "pending_review" : "reserved",
        reservedUntil: promoReservationDeadline(timestamp, input.paymentMethod),
        finalizedAt: null, releasedAt: null, releaseReason: null } : null,
      audit: prepareAudit(order, null, event.id),
      notification: prepareBookingNotification(order),
    };
    const result = await this.repository.createIfAbsent(order, event, records, quote?.redemption);

    if (result.order.requestFingerprint !== requestFingerprint) {
      throw new OrderIdempotencyConflictError();
    }

    return result;
  }

  async getOrder(orderId: string) {
    const order = await this.repository.getById(orderId);
    if (!order) throw new OrderNotFoundError();
    return order;
  }

  async ensurePromoReservation(orderId: string) {
    return this.repository.ensurePromoReservation(orderId);
  }

  async transitionOrder(orderId: string, input: OrderTransitionInput) {
    const existing = await this.getOrder(orderId);
    if (!allowedTransitions[existing.status].includes(input.status)) {
      throw new OrderValidationError("invalid_transition");
    }

    const transactionId = input.transactionId === undefined
      ? existing.payment.transactionId
      : normalizeTransactionId(input.transactionId);
    const redirectUrl = input.redirectUrl === undefined
      ? existing.payment.redirectUrl ?? null
      : normalizeRedirectUrl(input.redirectUrl);
    if (input.status === "paid" && !transactionId) {
      throw new OrderValidationError("missing_transaction_reference");
    }

    const timestamp = this.now().toISOString();
    const updated: Order = {
      ...existing,
      updatedAt: timestamp,
      status: input.status,
      payment: {
        ...existing.payment,
        method: input.method === undefined ? existing.payment.method : input.method,
        provider: input.provider === undefined ? existing.payment.provider : input.provider,
        status: paymentStatusForOrderStatus(input.status),
        transactionId,
        redirectUrl,
      },
    };
    const event = createEvent(
      this.createId(),
      updated,
      "status_changed",
      existing.status,
      timestamp,
    );

    return this.repository.commitTransition(updated, event, prepareAudit(updated, existing.status, event.id));
  }
}

export function promoReservationDeadline(createdAt: string, method: PaymentMethodId) {
  const duration = PROMO_RESERVATION_MS[method];
  if (duration === undefined) return null;
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) throw new OrderValidationError("invalid_transition");
  return new Date(timestamp + duration).toISOString();
}

function createEvent(
  id: string,
  order: Order,
  eventType: PaymentEvent["eventType"],
  previousStatus: OrderStatus | null,
  occurredAt: string,
): PaymentEvent {
  return {
    id,
    orderId: order.id,
    eventType,
    provider: order.payment.provider,
    occurredAt,
    previousStatus,
    status: order.status,
    transactionId: order.payment.transactionId,
  };
}

function validateCustomer(customer: OrderCustomer) {
  if (
    !customer.id.trim() ||
    (customer.identitySource === "existing_lead" && !customer.leadReference?.trim()) ||
    (customer.identitySource === "verified_checkout" && !customer.phone?.trim() && !customer.email?.trim())
  ) {
    throw new OrderValidationError("invalid_customer");
  }
}

export function validateIdempotencyKey(value: string) {
  if (
    value.length < IDEMPOTENCY_KEY_MIN_LENGTH ||
    value.length > IDEMPOTENCY_KEY_MAX_LENGTH ||
    !/^[A-Za-z0-9._:-]+$/.test(value)
  ) {
    throw new OrderValidationError("invalid_idempotency_key");
  }
}

function normalizeMarketing(value: Partial<OrderMarketing> | undefined): OrderMarketing {
  return {
    utm_source: normalizeMarketingValue(value?.utm_source, 256),
    utm_medium: normalizeMarketingValue(value?.utm_medium, 256),
    utm_campaign: normalizeMarketingValue(value?.utm_campaign, 256),
    utm_content: normalizeMarketingValue(value?.utm_content, 512),
    fbclid: normalizeMarketingValue(value?.fbclid, 512),
  };
}

function normalizeMarketingValue(value: string | undefined, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeTransactionId(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 256) : null;
}

function normalizeRedirectUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) {
      throw new Error("invalid_redirect_url");
    }
    return url.href;
  } catch {
    throw new OrderValidationError("invalid_transition");
  }
}

function paymentStatusForOrderStatus(status: OrderStatus): PaymentStatus {
  if (status === "pending") return "not_started";
  return status;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function isSupportedPackageId(value: string): value is LearningPackageId {
  return isLearningPackageId(value);
}

export function isSupportedAttendance(value: string): value is AttendanceMode {
  return isAttendanceMode(value);
}
