import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "payment_provider_not_configured" },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
