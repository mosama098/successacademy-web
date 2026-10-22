const supportedLocales = new Set(["ar", "en"]);

export const runtime = "nodejs";

export async function GET(request: Request) { return redirectToStatus(request); }
export async function POST(request: Request) { return redirectToStatus(request); }

function redirectToStatus(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") ?? "";
  const locale = url.searchParams.get("locale") ?? "";
  if (!supportedLocales.has(locale) || !isOrderId(orderId)) {
    return Response.json({ ok: false, error: "invalid_return" }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const location = `/${locale}/plans/payment/success?order=${encodeURIComponent(orderId)}`;
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

function isOrderId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
