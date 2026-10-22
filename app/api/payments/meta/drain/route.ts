import { timingSafeEqual } from "node:crypto";
import {
  drainMetaPurchaseForOrder,
  drainPendingMetaPurchases,
  requeueMetaPurchaseForOrder,
} from "@/features/payments/server/meta-purchase-delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredSecret = process.env.META_CAPI_DRAIN_SECRET ?? "";
  const suppliedSecret = request.headers.get("x-success-academy-meta-drain-secret") ?? "";
  if (configuredSecret.length < 32 || !safeEqual(configuredSecret, suppliedSecret)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: unknown;
  try { body = await request.json(); } catch { return json({ ok: false, error: "invalid_request" }, 400); }
  if (!isRecord(body)) return json({ ok: false, error: "invalid_request" }, 400);
  const orderId = body.orderId === undefined ? undefined : String(body.orderId);
  const retryPermanent = body.retryPermanent === true;
  const limit = body.limit === undefined ? 10 : Number(body.limit);
  if ((orderId !== undefined && !/^[A-Za-z0-9_-]{1,128}$/.test(orderId))
    || !Number.isSafeInteger(limit) || limit < 1 || limit > 10
    || (retryPermanent && !orderId)) return json({ ok: false, error: "invalid_request" }, 400);

  try {
    if (retryPermanent && orderId) await requeueMetaPurchaseForOrder(orderId);
    const results = orderId
      ? [await drainMetaPurchaseForOrder(orderId)]
      : await drainPendingMetaPurchases(limit);
    return json({ ok: true, results }, 200);
  } catch {
    return json({ ok: false, error: "conversion_pipeline_unavailable" }, 503);
  }
}

function safeEqual(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
