import { NextResponse } from "next/server";
import { verifyOrderAccessToken } from "@/features/payments/server/order-access";
import { OrderNotFoundError } from "@/features/payments/server/order-service";
import { OrderRepositoryUnavailableError } from "@/features/payments/server/order-repository";
import {
  createConfiguredOrderService,
  getOrderAccessSecret,
} from "@/features/payments/server/service-factory";
import { toPublicOrder } from "@/features/payments/types";

type OrderStatusRouteProps = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, { params }: OrderStatusRouteProps) {
  const { orderId } = await params;
  if (!isOrderId(orderId)) return error("order_not_found", 404);

  const token = readBearerToken(request.headers.get("authorization"));

  try {
    if (!token || !verifyOrderAccessToken(orderId, token, getOrderAccessSecret())) {
      return error("order_access_denied", 403);
    }

    const order = await createConfiguredOrderService().getOrder(orderId);
    return NextResponse.json(
      { ok: true, order: toPublicOrder(order) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (errorValue) {
    if (errorValue instanceof OrderNotFoundError) return error("order_not_found", 404);
    if (errorValue instanceof OrderRepositoryUnavailableError) {
      return error("order_storage_unavailable", 503);
    }
    return error("order_status_unavailable", 500);
  }
}

function readBearerToken(value: string | null) {
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice("Bearer ".length).trim();
  return token && token.length <= 256 ? token : null;
}

function isOrderId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function error(code: string, status: number) {
  return NextResponse.json(
    { ok: false, error: code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
