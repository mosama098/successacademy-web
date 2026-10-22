import { createConfiguredEasyKashCustomerRepository, createConfiguredEasyKashProvider } from "@/features/payments/server/easykash-factory";
import { createEasyKashCallbackHandler } from "@/features/payments/server/easykash-callback-handler";
import { emitConfiguredNotificationEvent } from "@/features/payments/server/notification-webhook";
import { createConfiguredOrderService } from "@/features/payments/server/service-factory";
import { drainMetaPurchaseForOrder } from "@/features/payments/server/meta-purchase-delivery";

export const runtime = "nodejs";

export const POST = createEasyKashCallbackHandler({
  createService: createConfiguredOrderService,
  createProvider: createConfiguredEasyKashProvider,
  createCustomerRepository: createConfiguredEasyKashCustomerRepository,
  emitNotification: emitConfiguredNotificationEvent,
  drainMetaPurchase: drainMetaPurchaseForOrder,
});
