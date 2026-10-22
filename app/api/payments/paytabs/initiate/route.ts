import { createPayTabsInitiateHandler } from "@/features/payments/server/paytabs-initiate-handler";
import { createConfiguredOrderService, getOrderAccessSecret } from "@/features/payments/server/service-factory";
import { createConfiguredPaymentCustomerRepository, createConfiguredPayTabsProvider } from "@/features/payments/server/paytabs-factory";

export const runtime = "nodejs";

export const POST = createPayTabsInitiateHandler({
  createService: createConfiguredOrderService,
  createProvider: createConfiguredPayTabsProvider,
  createCustomerRepository: createConfiguredPaymentCustomerRepository,
  getAccessSecret: getOrderAccessSecret,
});
