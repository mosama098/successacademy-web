import "server-only";
import type { NextResponse } from "next/server";

export const PLACEMENT_ATTEMPT_COOKIE = "sa_placement_attempt";
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function readAttemptToken(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PLACEMENT_ATTEMPT_COOKIE}=`));
  if (!entry) return null;

  try {
    return decodeURIComponent(entry.slice(PLACEMENT_ATTEMPT_COOKIE.length + 1));
  } catch {
    return null;
  }
}

export function setAttemptCookie(response: NextResponse, token: string) {
  response.cookies.set(PLACEMENT_ATTEMPT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}
