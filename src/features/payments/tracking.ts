import type { LearningPackageId, PaymentMethodId } from "../plans/config";

export type PaymentTrackingEvent =
  | { name: "ViewCheckout" | "InitiateCheckout"; packageId: LearningPackageId }
  | { name: "AddPaymentInfo"; packageId: LearningPackageId; method: PaymentMethodId };

export type PaymentTrackingSink = (event: PaymentTrackingEvent) => void;

// Browser tracking is intentionally limited to pre-payment preparation events.
export function trackPaymentPreparation(event: PaymentTrackingEvent, sink?: PaymentTrackingSink) {
  try { sink?.(event); } catch { /* Tracking must never interrupt order creation. */ }
}
