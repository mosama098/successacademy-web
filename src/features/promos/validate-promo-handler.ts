import "server-only";
import { createRequestLimiter, isSameOrigin, readBody } from "../payments/server/request-safety";
import { PromoRepositoryUnavailableError, PromoValidationError } from "./promo-repository";
import type { PromoService } from "./promo-service";

export function createValidatePromoHandler(createService: () => PromoService) {
  const allowRequest = createRequestLimiter();
  return async function POST(request: Request) {
    if (!isSameOrigin(request)) return respond({ error: "forbidden" }, 403);
    if (!allowRequest(request)) return respond({ error: "rate_limited" }, 429);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return respond({ error: "invalid_request" }, 400);
    const body = await readBody(request);
    if (!body || Object.keys(body).some((key) => !["code", "packageId"].includes(key)) || typeof body.packageId !== "string") {
      return respond({ error: "invalid_request" }, 400);
    }
    try {
      const quote = await createService().quote(body.code, body.packageId);
      return respond({ ok: true, pricing: quote.pricing }, 200);
    } catch (failure) {
      if (failure instanceof PromoValidationError) return respond({ error: failure.code }, 400);
      if (failure instanceof PromoRepositoryUnavailableError) return respond({ error: "promo_service_unavailable" }, 503);
      return respond({ error: "promo_service_unavailable" }, 503);
    }
  };
}

function respond(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
