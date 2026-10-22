import "server-only";
import { GoogleSheetsCustomerRepository } from "../../customers/google-sheets-customer-repository";
import { CustomerRepositoryUnavailableError } from "../../customers/customer-repository";
import { PayTabsError, PayTabsProvider } from "./paytabs-provider";

export function createConfiguredPayTabsProvider() {
  const profileId = process.env.PAYTABS_PROFILE_ID;
  const serverKey = process.env.PAYTABS_SERVER_KEY;
  const baseUrl = process.env.PAYTABS_BASE_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!profileId || !serverKey || !baseUrl || !siteUrl) throw new PayTabsError("paytabs_configuration_invalid");
  return new PayTabsProvider({
    profileId,
    serverKey,
    baseUrl,
    callbackUrl: `${siteUrl}/api/payments/paytabs/callback`,
    returnUrlForOrder: (order) => `${siteUrl}/api/payments/paytabs/return?order=${encodeURIComponent(order.id)}&locale=${order.locale}`,
  });
}

export function createConfiguredPaymentCustomerRepository() {
  const webhookUrl = process.env.PAYMENTS_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.PAYMENTS_SHEETS_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) throw new CustomerRepositoryUnavailableError();
  return new GoogleSheetsCustomerRepository({ webhookUrl, webhookSecret });
}
