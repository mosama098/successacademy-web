import "server-only";
import type { NextResponse } from "next/server";

export const LEAD_REGISTRATION_COOKIE = "sa_lead_registered";
export const LEAD_REGISTRATION_COOKIE_VALUE = "v1";
export const LEAD_REGISTRATION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function isLeadRegistrationAcknowledged(value: string | undefined) {
  return value === LEAD_REGISTRATION_COOKIE_VALUE;
}

export function setLeadRegistrationCookie(response: NextResponse) {
  response.cookies.set(LEAD_REGISTRATION_COOKIE, LEAD_REGISTRATION_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LEAD_REGISTRATION_MAX_AGE_SECONDS,
  });
}
