import type { Locale } from "@/lib/i18n";
import type { PricingSnapshot, PromoRedemptionGuard } from "../promos/types";
import type {
  AttendanceMode,
  LearningLevel,
  LearningPackageId,
  PaymentMethodId,
  ProgramType,
} from "@/features/plans/config";

export const orderStatuses = [
  "pending",
  "waiting_payment",
  "waiting_verification",
  "paid",
  "failed",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = [
  "not_started",
  "waiting_payment",
  "waiting_verification",
  "paid",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentProviderId = "paytabs" | "easykash" | "manual";

export type OrderCustomer = {
  id: string;
  leadReference: string | null;
  identitySource: "existing_lead" | "verified_checkout" | "checkout_contact";
  name: string | null;
  phone: string | null;
  email: string | null;
};

export type OrderPackageSnapshot = {
  packageId: LearningPackageId;
  packageName: string;
  startLevel: LearningLevel;
  targetLevel: LearningLevel;
  levelsToStudy: LearningLevel[];
  hours: 15 | 30 | 45 | 60 | 90 | 120;
  sessions: 10 | 20 | 30 | 40;
  sessionDurationHours: 1.5 | 3;
  estimatedWeeks: 5 | 10 | 15 | 20;
  priceEgp: number;
  regularPriceEgp: number | null;
  discountEgp: number;
};

export type OrderMarketing = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  fbclid: string;
};

export type OrderPayment = {
  method: PaymentMethodId | null;
  provider: PaymentProviderId | null;
  status: PaymentStatus;
  currency: "EGP";
  amountMinor: number;
  transactionId: string | null;
  redirectUrl?: string | null;
  proofLink?: string | null;
};

export type LegalConsentSnapshot = {
  accepted: true;
  acceptedAt: string;
  termsVersion: "current";
  privacyVersion: "current";
  trainingTermsVersion: string;
};

export type LegalPolicyLinks = { terms: string; privacy: string; trainingTerms: string | null };

export type Order = {
  id: string;
  locale: Locale;
  createdAt: string;
  updatedAt: string;
  programType: ProgramType;
  customer: OrderCustomer;
  packageSnapshot: OrderPackageSnapshot;
  // Optional only for reading pre-3C orders. Every new order stores both snapshots.
  legalConsent?: LegalConsentSnapshot;
  pricing?: PricingSnapshot;
  // Stored only in the private immutable snapshot so a released reservation can
  // be reacquired without silently changing the customer's quoted price.
  promoRedemption?: PromoRedemptionGuard;
  attendance: AttendanceMode;
  payment: OrderPayment;
  marketing: OrderMarketing;
  status: OrderStatus;
  idempotencyKeyHash: string;
  requestFingerprint: string;
  notes: string | null;
};

export type PaymentEvent = {
  id: string;
  orderId: string;
  eventType:
    | "order_created"
    | "status_changed"
    | "provider_callback"
    | "verification_submitted"
    | "verification_reviewed";
  provider: PaymentProviderId | null;
  occurredAt: string;
  previousStatus: OrderStatus | null;
  status: OrderStatus;
  transactionId: string | null;
};

export type PaymentVerificationStatus = "pending" | "approved" | "rejected";

export type PaymentVerification = {
  id: string;
  orderId: string;
  method: "instapay" | "wallet" | "branch";
  submittedAt: string;
  claimedAmountMinor: number;
  transferReference: string | null;
  proofFileId: string | null;
  status: PaymentVerificationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
};

export type EnrollmentStatus = "pending_payment" | "ready_for_activation" | "active" | "cancelled";

export type EnrollmentDraft = {
  customerId: string;
  orderId: string;
  packageId: LearningPackageId;
  coursePath: LearningLevel[];
  status: EnrollmentStatus;
};

export type PublicOrder = {
  id: string;
  locale: Locale;
  createdAt: string;
  updatedAt: string;
  programType: ProgramType;
  packageSnapshot: OrderPackageSnapshot;
  pricing?: PricingSnapshot;
  attendance: AttendanceMode;
  payment: Pick<OrderPayment, "method" | "provider" | "status" | "currency" | "amountMinor">;
  status: OrderStatus;
};

export function toPublicOrder(order: Order): PublicOrder {
  return {
    id: order.id,
    locale: order.locale,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    programType: order.programType,
    packageSnapshot: order.packageSnapshot,
    pricing: order.pricing,
    attendance: order.attendance,
    payment: {
      method: order.payment.method,
      provider: order.payment.provider,
      status: order.payment.status,
      currency: order.payment.currency,
      amountMinor: order.payment.amountMinor,
    },
    status: order.status,
  };
}
