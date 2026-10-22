import "server-only";
import type { Order, PaymentStatus } from "../types";
import type { BookingRecords } from "./booking-records";
import type { PromoUsage } from "../../promos/types";
import { paymentSheetColumns } from "./sheets-schema";

export function bookingPaymentStatus(status: PaymentStatus): "Pending" | "Paid" | "Rejected" {
  if (status === "paid") return "Paid";
  if (status === "failed" || status === "cancelled") return "Rejected";
  return "Pending";
}

export function bookingPaymentVerification(order: Order): "Not Required" | "Waiting Review" | "Approved" | "Rejected" {
  if (order.payment.method !== "instapay" && order.payment.method !== "wallet" && order.payment.method !== "branch") {
    return "Not Required";
  }
  if (order.payment.status === "paid") return "Approved";
  if (order.payment.status === "failed" || order.payment.status === "cancelled") return "Rejected";
  return "Waiting Review";
}

export function toBookingSheetRow(order: Order, records: BookingRecords) {
  if (!order.pricing || !order.legalConsent?.accepted || records.customer.orderId !== order.id
    || records.customer.customerId !== order.customer.id || records.customer.age === null) throw new Error("invalid_booking_snapshot");
  const row: Record<typeof paymentSheetColumns.Bookings[number], string | number> = {
    Booking_ID: order.id, Created_At: order.createdAt,
    Full_Name: records.customer.name, Phone: records.customer.phone,
    WhatsApp: records.customer.whatsapp, Email: records.customer.email, Age: records.customer.age,
    Package: order.packageSnapshot.packageName, Start_Level: order.packageSnapshot.startLevel,
    Target_Level: order.packageSnapshot.targetLevel, Hours: order.packageSnapshot.hours,
    Sessions: order.packageSnapshot.sessions, Attendance_Type: order.attendance,
    Original_Price: order.pricing.originalPrice, Promo_Code: order.pricing.promoCode ?? "",
    Discount_Amount: order.pricing.discountAmount, Final_Price: order.pricing.finalPrice,
    Payment_Method: order.payment.method ?? "", Payment_Status: bookingPaymentStatus(order.payment.status),
    Payment_Verification: bookingPaymentVerification(order), Payment_Proof_URL: order.payment.proofLink ?? "",
    Admin_Notes: order.notes ?? "", Customer_Notes: records.customer.notes ?? "",
    Order_Snapshot: JSON.stringify(order), Idempotency_Key_Hash: order.idempotencyKeyHash,
    Request_Fingerprint: order.requestFingerprint,
    Payment_Provider: order.payment.provider ?? "",
    Provider_Transaction_ID: order.payment.transactionId ?? "",
    Payment_Redirect_URL: order.payment.redirectUrl ?? "",
    Payment_Updated_At: order.updatedAt,
  };
  return row;
}

export function toPromoUsageSheetRow(usage: PromoUsage) {
  const row: Record<typeof paymentSheetColumns["Promo Usage"][number], string | number> = {
    Usage_ID: usage.usageId, Created_At: usage.usedAt, Promo_Code: usage.promoCode,
    Booking_ID: usage.orderId, Customer_Name: usage.customerName,
    Customer_Phone: usage.customerPhone, Discount_Amount: usage.discountAmount,
    Status: usage.status, Reserved_Until: usage.reservedUntil ?? "",
    Finalized_At: usage.finalizedAt ?? "", Released_At: usage.releasedAt ?? "",
    Release_Reason: usage.releaseReason ?? "",
  };
  return row;
}
