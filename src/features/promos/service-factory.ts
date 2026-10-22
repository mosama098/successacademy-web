import "server-only";
import { GoogleSheetsPromoRepository } from "./google-sheets-promo-repository";
import { PromoService } from "./promo-service";

export function createConfiguredPromoService() {
  return new PromoService(new GoogleSheetsPromoRepository({
    webhookUrl: process.env.PAYMENTS_SHEETS_WEBHOOK_URL ?? "",
    webhookSecret: process.env.PAYMENTS_SHEETS_WEBHOOK_SECRET ?? "",
  }));
}
