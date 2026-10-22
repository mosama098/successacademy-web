import { createOrderHandler } from "@/features/payments/server/create-order-handler";
import { resolveOrderCustomer } from "@/features/payments/server/customer-context";
import { createConfiguredOrderService, getOrderAccessSecret } from "@/features/payments/server/service-factory";
import { emitConfiguredNotificationEvent } from "@/features/payments/server/notification-webhook";

export const runtime = "nodejs";

export const POST = createOrderHandler({
  createService: createConfiguredOrderService,
  getSecret: getOrderAccessSecret,
  resolveCustomer: resolveOrderCustomer,
  emitNotification: emitConfiguredNotificationEvent,
});
