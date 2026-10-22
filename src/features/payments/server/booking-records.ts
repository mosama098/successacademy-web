import "server-only";
import type { CustomerRecord } from "../../customers/types";
import type { PromoUsage } from "../../promos/types";
import type { Order, PaymentProviderId, PaymentStatus } from "../types";
import type { PaymentMethodId } from "../../plans/config";

export type AuditRecord = {
  eventId: string; orderId: string; eventType: "booking_created" | "order_status_changed";
  oldValue: string | null; newValue: string; timestamp: string; actor: "order_service";
};
export type NotificationIntent = {
  eventId: string; orderId: string; customerId: string;
  eventType: "booking.created" | "payment.confirmed" | "enrollment.activated";
  channel: "email" | "whatsapp" | "calendar"; template: string;
  createdAt: string; status: "prepared";
};
export type BookingRecords = {
  customer: CustomerRecord;
  promoUsage: PromoUsage | null;
  audit: AuditRecord;
  notification: NotificationIntent;
};

// A transaction is created only when a real payment operation exists, never on booking.
export type PaymentTransaction = {
  transactionId: string; orderId: string; provider: PaymentProviderId;
  paymentMethod: PaymentMethodId; amountMinor: number; currency: "EGP";
  status: PaymentStatus; providerTransactionId: string | null;
  createdAt: string; updatedAt: string; failureReason: string | null;
};

export function prepareAudit(order: Order, previousStatus: Order["status"] | null, eventId: string): AuditRecord {
  return {
    eventId: `audit:${eventId}`, orderId: order.id,
    eventType: previousStatus === null ? "booking_created" : "order_status_changed",
    oldValue: previousStatus, newValue: order.status, timestamp: order.updatedAt, actor: "order_service",
  };
}

export function prepareBookingNotification(order: Order): NotificationIntent {
  return { eventId: `notification:booking.created:${order.id}`, orderId: order.id, customerId: order.customer.id,
    eventType: "booking.created", channel: "email", template: "admin_booking_created",
    createdAt: order.createdAt, status: "prepared" };
}

// Prepared from the saved booking contact. No notification is sent by this function.
export function prepareAdminBookingEmail(order: Order, customer: CustomerRecord) {
  if (order.id !== customer.orderId || order.customer.id !== customer.customerId) throw new Error("booking_customer_mismatch");
  return {
    subject: `New booking ${order.id}`,
    text: [
      `Customer: ${customer.name}`, `Phone: ${customer.phone}`, `Email: ${customer.email}`,
      `Package: ${order.packageSnapshot.packageName}`,
      `Amount: ${(order.payment.amountMinor / 100).toFixed(2)} EGP`,
      `Payment method: ${order.payment.method ?? "not_selected"}`,
      `Levels: ${order.packageSnapshot.startLevel} -> ${order.packageSnapshot.targetLevel}`,
      `Attendance: ${order.attendance}`, `Payment status: ${order.payment.status}`,
      `Order ID: ${order.id}`, `Created: ${order.createdAt}`,
    ].join("\n"),
  };
}
