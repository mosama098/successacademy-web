import "server-only";
import type { CustomerRecord } from "../../customers/types";
import type { Order } from "../types";

export type MetaPurchaseEvent = {
  eventName: "Purchase";
  eventId: string;
  orderId: string;
  locale: Order["locale"];
  occurredAt: string;
  currency: "EGP";
  valueEgp: number;
  transactionId: string | null;
  packageId: string;
  programType: Order["programType"];
  startLevel: Order["packageSnapshot"]["startLevel"];
  targetLevel: Order["packageSnapshot"]["targetLevel"];
  customer: Pick<CustomerRecord, "phone" | "email">;
};

export type MetaPurchaseSink = (event: MetaPurchaseEvent) => Promise<void>;

export function metaPurchaseEventId(orderId: string) {
  return `meta:purchase:${orderId}`;
}

export function buildMetaPurchaseEvent(
  order: Order,
  customer: CustomerRecord,
  trackingValueEgp: number,
  occurredAt = order.updatedAt,
): MetaPurchaseEvent {
  const finalPriceEgp = order.pricing?.finalPrice;
  const automatedProvider = (order.payment.method === "card" && order.payment.provider === "paytabs")
    || (order.payment.method === "installments" && order.payment.provider === "easykash");
  const approvedManualPayment = ["instapay", "wallet", "branch"].includes(order.payment.method ?? "")
    && (order.payment.provider === null || order.payment.provider === "manual");
  if (
    order.status !== "paid" ||
    order.payment.status !== "paid" ||
    (!automatedProvider && !approvedManualPayment) ||
    (automatedProvider && !order.payment.transactionId) ||
    order.payment.currency !== "EGP" ||
    typeof finalPriceEgp !== "number" ||
    !Number.isFinite(finalPriceEgp) ||
    Math.round(finalPriceEgp * 100) !== order.payment.amountMinor ||
    customer.orderId !== order.id ||
    trackingValueEgp !== 1000 ||
    !Number.isFinite(Date.parse(occurredAt))
  ) {
    throw new Error("meta_purchase_not_authoritative");
  }

  return {
    eventName: "Purchase",
    eventId: metaPurchaseEventId(order.id),
    orderId: order.id,
    locale: order.locale,
    occurredAt,
    currency: "EGP",
    valueEgp: trackingValueEgp,
    transactionId: order.payment.transactionId,
    packageId: order.packageSnapshot.packageId,
    programType: order.programType,
    startLevel: order.packageSnapshot.startLevel,
    targetLevel: order.packageSnapshot.targetLevel,
    customer: { phone: customer.phone, email: customer.email },
  };
}
