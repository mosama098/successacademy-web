import "server-only";
import type { CustomerRepository } from "../../customers/customer-repository";
import type { CustomerRecord } from "../../customers/types";
import type { PaymentProvider } from "./contracts";
import { EasyKashError } from "./easykash-provider";
import { buildMetaPurchaseEvent, type MetaPurchaseSink } from "./meta-purchase";
import { buildProviderPaymentEvent, type NotificationEvent } from "./notification-events";
import { OrderRepositoryConflictError, OrderRepositoryUnavailableError } from "./order-repository";
import { OrderNotFoundError, type OrderService } from "./order-service";

type Dependencies = {
  createService: () => OrderService;
  createProvider: () => PaymentProvider;
  createCustomerRepository: () => CustomerRepository;
  emitNotification?: (event: NotificationEvent) => Promise<void>;
  emitMetaPurchase?: MetaPurchaseSink;
  drainMetaPurchase?: (orderId: string) => Promise<unknown>;
};

export function createEasyKashCallbackHandler(dependencies: Dependencies) {
  return async function POST(request: Request) {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > 64 * 1024) return response("invalid_callback", 400);
    try {
      const verification = await dependencies.createProvider().handleCallback({ rawBody, headers: {} });
      const service = dependencies.createService();
      const order = await service.getOrder(verification.orderId);
      if (order.payment.method !== "installments" || order.payment.provider !== "easykash") return response("payment_mismatch", 409);
      if (order.payment.currency !== verification.currency || order.payment.amountMinor !== verification.amountMinor) {
        return response("payment_amount_mismatch", 409);
      }
      if (order.payment.transactionId && order.payment.transactionId !== verification.transactionId) {
        return response("payment_transaction_mismatch", 409);
      }
      if (order.status === "paid") {
        await drainMetaFailOpen(dependencies, order.id);
        return Response.json({ ok: true, duplicate: true }, noStore(200));
      }
      if (verification.status === "waiting_payment") return Response.json({ ok: true, pending: true }, noStore(200));
      if (order.status === "failed" && verification.status === "failed") {
        return Response.json({ ok: true, duplicate: true }, noStore(200));
      }
      if (order.status !== "waiting_payment") return response("payment_state_mismatch", 409);
      const targetStatus = verification.status === "paid" ? "paid" : "failed";
      let updated;
      try {
        updated = await service.transitionOrder(order.id, {
          status: targetStatus,
          provider: "easykash",
          transactionId: verification.transactionId,
        });
      } catch (failure) {
        if (failure instanceof OrderRepositoryConflictError) {
          const current = await service.getOrder(order.id);
          if (current.status === "paid" || current.status === targetStatus) {
            if (current.status === "paid") await drainMetaFailOpen(dependencies, current.id);
            return Response.json({ ok: true, duplicate: true }, noStore(200));
          }
        }
        throw failure;
      }
      let customer: CustomerRecord | null = null;
      try { customer = await dependencies.createCustomerRepository().getByOrderId(updated.id); } catch {
        // Provider state is authoritative; downstream side effects are fail-open.
      }
      if (targetStatus === "paid") {
        try {
          if (dependencies.drainMetaPurchase) await drainMetaFailOpen(dependencies, updated.id);
          else if (customer) await dependencies.emitMetaPurchase?.(buildMetaPurchaseEvent(updated, customer, 1000));
        } catch {
          // Meta tracking must never change the committed payment result.
        }
      }
      if (customer) {
        try {
          await dependencies.emitNotification?.(buildProviderPaymentEvent(
            updated,
            customer,
            targetStatus === "paid" ? "payment.approved" : "payment.rejected",
          ));
        } catch {
          // The authenticated provider state is authoritative; notification delivery is fail-open.
        }
      }
      return Response.json({ ok: true }, noStore(200));
    } catch (failure) {
      if (failure instanceof EasyKashError) {
        const retryable = failure.code === "easykash_request_failed" || failure.code === "easykash_response_invalid";
        return response(failure.code, failure.code === "easykash_signature_invalid" ? 401 : retryable ? 503 : 400);
      }
      if (failure instanceof OrderNotFoundError) return response("order_not_found", 404);
      if (failure instanceof OrderRepositoryUnavailableError) return response("order_storage_unavailable", 503);
      return response("callback_processing_failed", 500);
    }
  };
}

async function drainMetaFailOpen(dependencies: Dependencies, orderId: string) {
  if (!dependencies.drainMetaPurchase) return;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      dependencies.drainMetaPurchase(orderId),
      new Promise<void>((resolve) => { timeout = setTimeout(resolve, 7_000); }),
    ]);
  } catch {
    // Duplicate provider callbacks may wake delivery, but never affect payment acknowledgement.
  } finally { if (timeout) clearTimeout(timeout); }
}

function noStore(status: number) { return { status, headers: { "Cache-Control": "no-store" } }; }
function response(error: string, status: number) { return Response.json({ ok: false, error }, noStore(status)); }
