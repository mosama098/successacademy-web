import { createConfiguredEasyKashCustomerRepository, createConfiguredEasyKashProvider } from "@/features/payments/server/easykash-factory";
import { createEasyKashInitiateHandler } from "@/features/payments/server/easykash-initiate-handler";
import { createConfiguredOrderService, getOrderAccessSecret } from "@/features/payments/server/service-factory";

export const runtime = "nodejs";

export const POST = createEasyKashInitiateHandler({
  createService: createConfiguredOrderService,
  createProvider: createConfiguredEasyKashProvider,
  createCustomerRepository: createConfiguredEasyKashCustomerRepository,
  getAccessSecret: getOrderAccessSecret,
});
