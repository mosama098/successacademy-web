import type { LearningPackageId, PaymentMethodId } from "../plans/config";
import { trackFunnelEvent, type TrackingPayload } from "../../lib/tracking";

type PaymentTrackingContext = TrackingPayload & {
  locale: "ar" | "en";
  programType: "group" | "private";
  startLevel: string;
  targetLevel: string;
};

export type PaymentTrackingEvent =
  | ({ name: "ViewCheckout" | "InitiateCheckout"; packageId: LearningPackageId } & PaymentTrackingContext)
  | ({ name: "AddPaymentInfo"; packageId: LearningPackageId; method: PaymentMethodId } & PaymentTrackingContext);

export type PaymentTrackingSink = (event: PaymentTrackingEvent) => void;

// Browser tracking is intentionally limited to pre-payment preparation events.
export function trackPaymentPreparation(event: PaymentTrackingEvent, sink?: PaymentTrackingSink) {
  try {
    if (sink) {
      sink(event);
      return;
    }
    const payload = {
      locale: event.locale,
      source: "payment",
      programType: event.programType,
      packageId: event.packageId,
      startLevel: event.startLevel,
      targetLevel: event.targetLevel,
      ...(event.name === "AddPaymentInfo" ? { paymentMethod: event.method } : {}),
    };
    if (event.name === "ViewCheckout") trackFunnelEvent("payment_view", payload);
    else if (event.name === "AddPaymentInfo") trackFunnelEvent("payment_method_select", payload);
    else trackFunnelEvent("payment_initiated", payload);
  } catch { /* Tracking must never interrupt order creation. */ }
}
