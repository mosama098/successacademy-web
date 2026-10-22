import type { LearningPackageId } from "../plans/config";

export type PromoCode = {
  promoId?: string;
  createdAt?: string;
  createdBy?: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  maxUses: number | null;
  usedCount: number;
  allowedPackages: LearningPackageId[];
};

export type PricingSnapshot = {
  originalPrice: number;
  promoCode: string | null;
  discountAmount: number;
  finalPrice: number;
};

// Storage revalidates this definition and available uses while holding the order lock.
export type PromoRedemptionGuard = Omit<PromoCode, "usedCount">;
export type PromoQuote = { pricing: PricingSnapshot; redemption: PromoRedemptionGuard };

export type PromoUsage = {
  usageId: string;
  promoCode: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  discountAmount: number;
  usedAt: string;
  status: "reserved" | "payment_in_progress" | "pending_review" | "consumed" | "released";
  reservedUntil: string | null;
  finalizedAt: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
};
