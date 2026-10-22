import "server-only";
import { GoogleSheetsOrderRepository } from "./google-sheets-order-repository";
import { OrderRepositoryUnavailableError } from "./order-repository";
import { OrderService } from "./order-service";
import { createConfiguredPromoService } from "../../promos/service-factory";
import { GoogleDrivePaymentProofStorage } from "./google-drive-payment-proof-storage";
import { PaymentProofStorageUnavailableError } from "./payment-proof-storage";

export function createConfiguredOrderService() {
  const webhookUrl = process.env.PAYMENTS_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.PAYMENTS_SHEETS_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) throw new OrderRepositoryUnavailableError();

  return new OrderService({
    repository: new GoogleSheetsOrderRepository({ webhookUrl, webhookSecret }),
    promoService: createConfiguredPromoService(),
  });
}

export function getOrderAccessSecret() {
  const secret = process.env.PAYMENTS_ORDER_ACCESS_SECRET;
  if (!secret || secret.length < 32) throw new OrderRepositoryUnavailableError();
  return secret;
}

export function createConfiguredPaymentProofStorage() {
  const webhookUrl = process.env.PAYMENTS_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.PAYMENTS_SHEETS_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) throw new PaymentProofStorageUnavailableError();
  return new GoogleDrivePaymentProofStorage({ webhookUrl, webhookSecret });
}
