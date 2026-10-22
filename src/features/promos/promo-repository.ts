import "server-only";
import type { PromoCode } from "./types";

export interface PromoRepository {
  findByCode(code: string): Promise<PromoCode | null>;
}

export class PromoRepositoryUnavailableError extends Error {
  constructor() { super("promo_service_unavailable"); }
}

export class PromoValidationError extends Error {
  constructor(readonly code: "promo_invalid" | "promo_inactive" | "promo_not_started" | "promo_expired" | "promo_limit_reached" | "promo_package_ineligible" | "promo_changed" | "promo_reservation_expired") {
    super(code);
  }
}
