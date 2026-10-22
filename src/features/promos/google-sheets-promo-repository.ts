import "server-only";
import { isLearningPackageId } from "../plans/config";
import type { PromoCode } from "./types";
import { PromoRepositoryUnavailableError, type PromoRepository } from "./promo-repository";

export class GoogleSheetsPromoRepository implements PromoRepository {
  constructor(private readonly options: { webhookUrl: string; webhookSecret: string; fetchImpl?: typeof fetch }) {}

  async findByCode(code: string): Promise<PromoCode | null> {
    if (!this.options.webhookUrl || !this.options.webhookSecret) throw new PromoRepositoryUnavailableError();
    try {
      const response = await (this.options.fetchImpl ?? fetch)(this.options.webhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({ secret: this.options.webhookSecret, domain: "payments", action: "get_promo", payload: { code } }),
      });
      if (!response.ok) throw new PromoRepositoryUnavailableError();
      const result = await response.json();
      if (result?.success !== true || !result.data || !Object.hasOwn(result.data, "promo")) throw new PromoRepositoryUnavailableError();
      if (result.data.promo === null) return null;
      const promo = result.data.promo;
      if (typeof promo.code !== "string" || !["fixed", "percentage"].includes(promo.type) || typeof promo.value !== "number" || typeof promo.active !== "boolean"
        || !(promo.startDate === null || isTimestamp(promo.startDate)) || !(promo.endDate === null || isTimestamp(promo.endDate))
        || !(promo.maxUses === null || Number.isSafeInteger(promo.maxUses)) || !Number.isSafeInteger(promo.usedCount)
        || (promo.allowedPackages !== undefined && (!Array.isArray(promo.allowedPackages) || !promo.allowedPackages.every(isLearningPackageId)))) {
        throw new PromoRepositoryUnavailableError();
      }
      const metadata = {
        ...(typeof promo.promoId === "string" ? { promoId: promo.promoId } : {}),
        ...(isTimestamp(promo.createdAt) ? { createdAt: promo.createdAt as string } : {}),
        ...(typeof promo.createdBy === "string" ? { createdBy: promo.createdBy } : {}),
      };
      return { ...metadata, code: promo.code, type: promo.type, value: promo.value, active: promo.active, startDate: promo.startDate, endDate: promo.endDate, maxUses: promo.maxUses, usedCount: promo.usedCount, allowedPackages: [...(promo.allowedPackages ?? [])] };
    } catch { throw new PromoRepositoryUnavailableError(); }
  }
}

function isTimestamp(value: unknown) {
  return typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}
