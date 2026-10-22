import "server-only";
import type { EnrollmentDetails } from "../../customers/types";
import type { Order } from "../types";
import { manualPaymentConfig } from "../manual-payment-config";
import { bookingDisplayReference } from "../success-presentation";

export const notificationEventVersion = 1 as const;
export const notificationEventTypes = ["booking.created", "payment.approved", "payment.rejected"] as const;
export type NotificationEventType = typeof notificationEventTypes[number];
export type NotificationEventSource = "checkout" | "payment_admin";

export type NotificationEvent = {
  version: typeof notificationEventVersion;
  eventId: string;
  eventType: NotificationEventType;
  occurredAt: string;
  source: NotificationEventSource;
  booking: {
    bookingId: string;
    reference: string;
    locale: "ar" | "en";
    createdAt: string;
    package: string;
    startLevel: string;
    targetLevel: string;
    hours: number;
    sessions: number;
    attendanceType: string;
    originalPriceEgp: number;
    promoCode: string | null;
    discountAmountEgp: number;
    finalPriceEgp: number;
    paymentMethod: string;
    paymentStatus: "Pending" | "Paid" | "Rejected";
    paymentVerification: "Not Required" | "Waiting Review" | "Approved" | "Rejected";
    paymentContext: {
      kind: "payment_preference" | "manual_transfer" | "branch";
      proofReceived: boolean;
      reservationHours: number | null;
      branchAddress: string | null;
      branchMapsUrl: string | null;
      branchWorkingHours: { daily: string; friday: string } | null;
    };
  };
  customer: {
    fullName: string;
    phone: string;
    whatsapp: string;
    email: string;
  };
};

export function notificationEventId(eventType: NotificationEventType, bookingId: string) {
  return `notification:${eventType}:${bookingId}`;
}

export function buildBookingCreatedEvent(order: Order, customer: EnrollmentDetails): NotificationEvent {
  if (!order.pricing || !order.payment.method) throw new Error("invalid_notification_booking");
  const branch = order.payment.method === "branch";
  const manualTransfer = order.payment.method === "instapay" || order.payment.method === "wallet";
  const proofReceived = Boolean(order.payment.proofLink?.trim());
  return {
    version: notificationEventVersion,
    eventId: notificationEventId("booking.created", order.id),
    eventType: "booking.created",
    occurredAt: order.createdAt,
    source: "checkout",
    booking: {
      bookingId: order.id,
      reference: bookingDisplayReference(order.id),
      locale: order.locale,
      createdAt: order.createdAt,
      package: order.packageSnapshot.packageName,
      startLevel: order.packageSnapshot.startLevel,
      targetLevel: order.packageSnapshot.targetLevel,
      hours: order.packageSnapshot.hours,
      sessions: order.packageSnapshot.sessions,
      attendanceType: order.attendance,
      originalPriceEgp: order.pricing.originalPrice,
      promoCode: order.pricing.promoCode,
      discountAmountEgp: order.pricing.discountAmount,
      finalPriceEgp: order.pricing.finalPrice,
      paymentMethod: order.payment.method,
      paymentStatus: "Pending",
      paymentVerification: branch || manualTransfer ? "Waiting Review" : "Not Required",
      paymentContext: {
        kind: branch ? "branch" : manualTransfer ? "manual_transfer" : "payment_preference",
        proofReceived: manualTransfer && proofReceived,
        reservationHours: branch ? manualPaymentConfig.branch.reservationHours : null,
        branchAddress: branch ? manualPaymentConfig.branch.address.ar : null,
        branchMapsUrl: branch ? manualPaymentConfig.branch.mapsUrl : null,
        branchWorkingHours: branch ? {
          daily: manualPaymentConfig.branch.workingHours.en,
          friday: manualPaymentConfig.branch.fridayClosed.en,
        } : null,
      },
    },
    customer: {
      fullName: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      email: customer.email,
    },
  };
}

export function buildProviderPaymentEvent(
  order: Order,
  customer: Pick<EnrollmentDetails, "name" | "phone" | "whatsapp" | "email">,
  eventType: "payment.approved" | "payment.rejected",
): NotificationEvent {
  const supportedProvider = (order.payment.method === "card" && order.payment.provider === "paytabs")
    || (order.payment.method === "installments" && order.payment.provider === "easykash");
  if (!order.pricing || !supportedProvider) {
    throw new Error("invalid_notification_booking");
  }
  const paid = eventType === "payment.approved";
  return {
    version: notificationEventVersion,
    eventId: notificationEventId(eventType, order.id),
    eventType,
    occurredAt: order.updatedAt,
    source: "payment_admin",
    booking: {
      bookingId: order.id,
      reference: bookingDisplayReference(order.id),
      locale: order.locale,
      createdAt: order.createdAt,
      package: order.packageSnapshot.packageName,
      startLevel: order.packageSnapshot.startLevel,
      targetLevel: order.packageSnapshot.targetLevel,
      hours: order.packageSnapshot.hours,
      sessions: order.packageSnapshot.sessions,
      attendanceType: order.attendance,
      originalPriceEgp: order.pricing.originalPrice,
      promoCode: order.pricing.promoCode,
      discountAmountEgp: order.pricing.discountAmount,
      finalPriceEgp: order.pricing.finalPrice,
      paymentMethod: order.payment.method!,
      paymentStatus: paid ? "Paid" : "Rejected",
      paymentVerification: "Not Required",
      paymentContext: {
        kind: "payment_preference",
        proofReceived: false,
        reservationHours: null,
        branchAddress: null,
        branchMapsUrl: null,
        branchWorkingHours: null,
      },
    },
    customer: {
      fullName: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      email: customer.email,
    },
  };
}
