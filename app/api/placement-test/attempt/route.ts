import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { applyAttemptAction, getPublicAttemptState, PlacementAttemptError } from "@/features/placement-test/server/attempt-service";
import { readAttemptToken } from "@/features/placement-test/server/cookie";
import type { AssessmentSection, PlacementAttemptAction } from "@/features/placement-test/types";

const MAX_BODY_BYTES = 4 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_REQUESTS = 120;
const RATE_MAX_ENTRIES = 10_000;
const rateEntries = new Map<string, { count: number; resetAt: number; lastSeenAt: number }>();

export async function GET(request: Request) {
  const token = readAttemptToken(request.headers.get("cookie"));
  if (!token) return error("invalid_attempt", 401);

  try {
    const state = await getPublicAttemptState(token);
    return state ? NextResponse.json({ ok: true, state }) : error("invalid_attempt", 401);
  } catch {
    return error("attempt_unavailable", 500);
  }
}

export async function POST(request: Request) {
  if (!isAllowedBrowserRequest(request)) return error("forbidden", 403);
  if (!hasJsonContentType(request)) return error("invalid_json", 400);
  if (!checkRateLimit(clientIp(request))) return error("rate_limited", 429);

  const token = readAttemptToken(request.headers.get("cookie"));
  if (!token) return error("invalid_attempt", 401);
  const body = await readJson(request);
  const action = parseAction(body);
  if (!action) return error("invalid_action", 400);

  try {
    const state = await applyAttemptAction(token, action);
    return NextResponse.json({ ok: true, state });
  } catch (caught) {
    if (caught instanceof PlacementAttemptError) return error(caught.code, caught.status);
    return error("attempt_unavailable", 500);
  }
}

function parseAction(value: unknown): PlacementAttemptAction | null {
  if (!isObject(value) || typeof value.action !== "string") return null;
  const keys = Object.keys(value);

  if (["start", "audio_check_complete", "confirmation_continue"].includes(value.action)) {
    return keys.length === 1 ? { action: value.action } as PlacementAttemptAction : null;
  }
  if (value.action === "section_continue") {
    return keys.length === 2 && isSection(value.section)
      ? { action: value.action, section: value.section }
      : null;
  }
  if (["begin_reading", "begin_question", "audio_start", "audio_complete", "audio_failed"].includes(value.action)) {
    return keys.length === 2 && isQuestionId(value.questionId)
      ? { action: value.action, questionId: value.questionId } as PlacementAttemptAction
      : null;
  }
  if (value.action === "answer") {
    return keys.length === 3 && isQuestionId(value.questionId) && isOption(value.optionId)
      ? { action: value.action, questionId: value.questionId, optionId: value.optionId }
      : null;
  }
  if (value.action === "audio_progress") {
    return keys.length === 3 && isQuestionId(value.questionId) && typeof value.progressSeconds === "number"
      ? { action: value.action, questionId: value.questionId, progressSeconds: value.progressSeconds }
      : null;
  }
  return null;
}

async function readJson(request: Request) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) {
    return null;
  }
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function hasJsonContentType(request: Request) {
  return request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function isAllowedBrowserRequest(request: Request) {
  if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const allowed = configured ? new URL(configured).origin : new URL(request.url).origin;
    return new URL(origin).origin === allowed;
  } catch {
    return false;
  }
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  for (const [key, entry] of rateEntries) {
    if (entry.resetAt <= now) rateEntries.delete(key);
  }
  if (rateEntries.size >= RATE_MAX_ENTRIES && !rateEntries.has(ip)) {
    const oldest = [...rateEntries].sort((left, right) => left[1].lastSeenAt - right[1].lastSeenAt)[0];
    if (oldest) rateEntries.delete(oldest[0]);
  }
  const entry = rateEntries.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateEntries.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS, lastSeenAt: now });
    return true;
  }
  entry.lastSeenAt = now;
  if (entry.count >= RATE_REQUESTS) return false;
  entry.count += 1;
  return true;
}

function clientIp(request: Request) {
  const realIp = normalizeIp(request.headers.get("x-real-ip"));
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && forwarded.length <= 1_024) {
    const rightmost = normalizeIp(forwarded.split(",").at(-1) ?? null);
    if (rightmost) return rightmost;
  }
  return "unknown";
}

function normalizeIp(value: string | null) {
  if (!value) return null;
  let candidate = value.trim().replace(/^"|"$/g, "");
  const bracketed = candidate.match(/^\[([^\]]+)](?::\d+)?$/);
  if (bracketed) candidate = bracketed[1];
  if (candidate.includes(".")) candidate = candidate.replace(/:\d+$/, "");
  if (candidate.startsWith("::ffff:") && isIP(candidate.slice(7)) === 4) candidate = candidate.slice(7);
  return isIP(candidate) ? candidate : null;
}

function isSection(value: unknown): value is AssessmentSection {
  return value === "listening" || value === "reading" || value === "languageUse";
}

function isOption(value: unknown): value is "A" | "B" | "C" | "D" {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function isQuestionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z0-9-]{3,16}$/.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(code: string, status: number) {
  return NextResponse.json({ ok: false, error: code }, { status });
}
