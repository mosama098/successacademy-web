import "server-only";
import type { CustomerRepository } from "../../customers/customer-repository";
import type { PaymentProvider } from "./contracts";
import { verifyOrderAccessToken } from "./order-access";
import { OrderRepositoryConflictError, OrderRepositoryUnavailableError } from "./order-repository";
import { OrderNotFoundError, OrderValidationError, type OrderService } from "./order-service";
import { isSameOrigin, readBody } from "./request-safety";
import { PayTabsError } from "./paytabs-provider";
import { PromoValidationError } from "../../promos/promo-repository";

type Dependencies = {
  createService: () => OrderService;
  createProvider: () => PaymentProvider;
  createCustomerRepository: () => CustomerRepository;
  getAccessSecret: () => string;
};

export function createPayTabsInitiateHandler(dependencies: Dependencies) {
  const inFlight = new Map<string, Promise<string>>();
  return async function POST(request: Request) {
    if (!isSameOrigin(request)) return response("forbidden", 403);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return response("invalid_json", 400);
    }
    const body = await readBody(request);
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    if (!isOrderId(orderId) || Object.keys(body ?? {}).some((key) => key !== "orderId")) return response("invalid_request", 400);
    const token = readBearerToken(request.headers.get("authorization"));
    try {
      if (!token || !verifyOrderAccessToken(orderId, token, dependencies.getAccessSecret())) {
        return response("order_access_denied", 403);
      }
      const service = dependencies.createService();
      const order = await service.getOrder(orderId);
      if (order.payment.method !== "card") return response("invalid_payment_method", 409);
      if (order.status === "paid" || order.status === "cancelled") return response("payment_terminal", 409);
      if (order.status === "waiting_payment") {
        if (order.payment.provider === "paytabs" && order.payment.transactionId && order.payment.redirectUrl) {
          return Response.json({ redirectUrl: order.payment.redirectUrl }, noStore(200));
        }
        return response("payment_session_unavailable", 409);
      }
      if (order.status !== "pending" && order.status !== "failed") return response("payment_state_invalid", 409);
      const customer = await dependencies.createCustomerRepository().getByOrderId(order.id);
      if (!customer) return response("customer_unavailable", 503);
      const existingInitiation = inFlight.get(order.id);
      if (existingInitiation) {
        return Response.json({ redirectUrl: await existingInitiation }, noStore(200));
      }
      const initiationPromise = (async () => {
        await service.ensurePromoReservation(order.id);
        const initiation = await dependencies.createProvider().createPayment(order, {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        });
        const stored = await service.transitionOrder(order.id, {
          status: "waiting_payment",
          method: "card",
          provider: "paytabs",
          transactionId: initiation.transactionId,
          redirectUrl: initiation.redirectUrl,
        });
        if (!stored.payment.redirectUrl) throw new Error("payment_session_unavailable");
        return stored.payment.redirectUrl;
      })();
      inFlight.set(order.id, initiationPromise);
      try {
        return Response.json({ redirectUrl: await initiationPromise }, noStore(200));
      } catch (failure) {
        if (failure instanceof OrderRepositoryConflictError || failure instanceof OrderValidationError) {
          const current = await service.getOrder(order.id);
          if (current.status === "waiting_payment" && current.payment.provider === "paytabs" && current.payment.redirectUrl) {
            return Response.json({ redirectUrl: current.payment.redirectUrl }, noStore(200));
          }
        }
        throw failure;
      } finally {
        if (inFlight.get(order.id) === initiationPromise) inFlight.delete(order.id);
      }
    } catch (failure) {
      if (failure instanceof OrderNotFoundError) return response("order_not_found", 404);
      if (failure instanceof PromoValidationError && failure.code === "promo_reservation_expired") {
        return response(failure.code, 409);
      }
      if (failure instanceof PayTabsError) return response(failure.code, failure.code === "paytabs_configuration_invalid" ? 503 : 502);
      if (failure instanceof OrderRepositoryUnavailableError) return response("order_storage_unavailable", 503);
      return response("payment_initiation_failed", 500);
    }
  };
}

function readBearerToken(value: string | null) {
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice(7).trim();
  return token && token.length <= 256 ? token : null;
}

function isOrderId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function noStore(status: number) { return { status, headers: { "Cache-Control": "no-store" } }; }
function response(error: string, status: number) { return Response.json({ error }, noStore(status)); }
