import { createPayTabsCallbackHandler } from "@/features/payments/server/paytabs-callback-handler";
import { emitConfiguredNotificationEvent } from "@/features/payments/server/notification-webhook";
import { createConfiguredOrderService } from "@/features/payments/server/service-factory";
import { createConfiguredPaymentCustomerRepository, createConfiguredPayTabsProvider } from "@/features/payments/server/paytabs-factory";
import { drainMetaPurchaseForOrder } from "@/features/payments/server/meta-purchase-delivery";

export const runtime = "nodejs";

export const POST = createPayTabsCallbackHandler({
  createService: createConfiguredOrderService,
  createProvider: createConfiguredPayTabsProvider,
  createCustomerRepository: createConfiguredPaymentCustomerRepository,
  emitNotification: emitConfiguredNotificationEvent,
  drainMetaPurchase: drainMetaPurchaseForOrder,
});
