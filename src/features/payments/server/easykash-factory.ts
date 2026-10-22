import "server-only";
import { GoogleSheetsCustomerRepository } from "../../customers/google-sheets-customer-repository";
import { CustomerRepositoryUnavailableError } from "../../customers/customer-repository";
import { EasyKashError, EasyKashProvider } from "./easykash-provider";

export function createConfiguredEasyKashProvider() {
  const apiKey = process.env.EASYKASH_API_KEY;
  const hmacSecret = process.env.EASYKASH_HMAC_SECRET;
  const baseUrl = process.env.EASYKASH_BASE_URL;
  const allowedPaymentMethods = parseStringList(process.env.EASYKASH_INSTALLMENT_PAYMENT_METHODS);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!apiKey || !baseUrl || !siteUrl) {
    throw new EasyKashError("easykash_configuration_invalid");
  }
  return new EasyKashProvider({
    apiKey,
    hmacSecret: hmacSecret || undefined,
    baseUrl,
    allowedPaymentMethods,
    returnUrlForOrder: (order) => `${siteUrl}/api/payments/easykash/return?order=${encodeURIComponent(order.id)}&locale=${order.locale}`,
  });
}

export function createConfiguredEasyKashCustomerRepository() {
  const webhookUrl = process.env.PAYMENTS_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.PAYMENTS_SHEETS_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) throw new CustomerRepositoryUnavailableError();
  return new GoogleSheetsCustomerRepository({ webhookUrl, webhookSecret });
}

function parseStringList(value: string | undefined) {
  return value?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
}
