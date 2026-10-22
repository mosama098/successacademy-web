import "server-only";
import { getLearningPackage } from "../plans/config";
import type { PromoCode, PromoQuote } from "./types";
import { PromoValidationError, type PromoRepository } from "./promo-repository";

export function normalizePromoCode(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value.trim())) {
    throw new PromoValidationError("promo_invalid");
  }
  return value.trim().toUpperCase();
}

export function toMinorUnits(value: number): number {
  const minor = Math.round(value * 100);
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(minor) || Math.abs(value * 100 - minor) > 0.000001) {
    throw new PromoValidationError("promo_invalid");
  }
  return minor;
}

export class PromoService {
  constructor(private readonly repository: PromoRepository, private readonly now: () => Date = () => new Date()) {}

  async quote(code: unknown, packageId: string): Promise<PromoQuote> {
    const normalized = normalizePromoCode(code);
    const plan = getLearningPackage(packageId);
    if (!plan) throw new PromoValidationError("promo_package_ineligible");
    const promo = await this.repository.findByCode(normalized);
    if (!promo || promo.code !== normalized) throw new PromoValidationError("promo_invalid");
    return evaluatePromo(promo, plan.id, plan.priceEgp, this.now());
  }
}

export function evaluatePromo(promo: PromoCode, packageId: string, originalPrice: number, now: Date): PromoQuote {
  if (!Number.isFinite(now.getTime())) {
    throw new PromoValidationError("promo_invalid");
  }
  if (!promo.active) throw new PromoValidationError("promo_inactive");
  const starts = promo.startDate === null ? null : Date.parse(promo.startDate);
  const ends = promo.endDate === null ? null : Date.parse(promo.endDate);
  if ((starts !== null && !Number.isFinite(starts)) || (ends !== null && !Number.isFinite(ends)) || (starts !== null && ends !== null && starts >= ends)) {
    throw new PromoValidationError("promo_invalid");
  }
  if (starts !== null && now.getTime() < starts) throw new PromoValidationError("promo_not_started");
  if (ends !== null && now.getTime() >= ends) throw new PromoValidationError("promo_expired");
  if (!Number.isSafeInteger(promo.usedCount) || promo.usedCount < 0 || (promo.maxUses !== null && (!Number.isSafeInteger(promo.maxUses) || promo.maxUses < 0))) {
    throw new PromoValidationError("promo_invalid");
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new PromoValidationError("promo_limit_reached");
  if (promo.allowedPackages.length && !promo.allowedPackages.some((id) => id === packageId)) {
    throw new PromoValidationError("promo_package_ineligible");
  }
  const originalMinor = toMinorUnits(originalPrice);
  const valueMinor = toMinorUnits(promo.value);
  if (valueMinor <= 0 || (promo.type === "percentage" && valueMinor > 10000) || !["fixed", "percentage"].includes(promo.type)) {
    throw new PromoValidationError("promo_invalid");
  }
  // Percentage values have at most two decimals. Round once to the nearest piastre.
  const discountMinor = Math.min(originalMinor, promo.type === "fixed" ? valueMinor : Math.floor((originalMinor * valueMinor + 5000) / 10000));
  const { usedCount: _usedCount, ...definition } = promo;
  return {
    pricing: { originalPrice, promoCode: promo.code, discountAmount: discountMinor / 100, finalPrice: (originalMinor - discountMinor) / 100 },
    redemption: { ...definition, allowedPackages: [...definition.allowedPackages] },
  };
}
