import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { readAttemptToken, setAttemptCookie } from "@/features/placement-test/server/cookie";
import { getExistingAttempt } from "@/features/placement-test/server/attempt-service";
import { createStoredAttempt } from "@/features/placement-test/server/storage";
import { normalizeEgyptianMobile } from "@/lib/phone";

type JsonObject = Record<string, unknown>;
type LeadMetadata = Record<string, string>;
type ValidationFailure = { ok: false; missing: string[] };

const MAX_REQUEST_BODY_BYTES = 32 * 1024;
const WEBHOOK_TIMEOUT_MS = 8_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000;
const RATE_LIMIT_MAX_ENTRIES = 10_000;

const individualFields = new Set([
  "source",
  "fullName",
  "phone",
  "email",
  "learningGoal",
  "currentLevel",
  "preferredLearningMode",
  "preferredAssessmentTime",
  "notes",
  "consent",
  "company",
  "metadata",
]);

const corporateFields = new Set([
  "source",
  "companyName",
  "contactName",
  "phone",
  "email",
  "employeeCount",
  "preferredTrainingMode",
  "trainingGoal",
  "notes",
  "consent",
  "company",
  "metadata",
]);

const placementFields = new Set([
  "source",
  "fullName",
  "phone",
  "email",
  "consent",
  "company",
  "metadata",
]);

const individualGoals = new Set(["work", "university", "travel_everyday", "general"]);
const individualLearningModes = new Set(["online", "dokki"]);
const individualAssessmentTimes = new Set(["earliest", "morning", "evening"]);
const corporateEmployeeCounts = new Set(["1-10", "11-25", "26-50", "51-100", "100+"]);
const corporateTrainingModes = new Set(["online", "on_site", "hybrid"]);

const metadataLimits = {
  locale: 5,
  pagePath: 2_048,
  referrer: 2_048,
  userAgent: 512,
  utm_source: 256,
  utm_medium: 256,
  utm_campaign: 256,
  utm_content: 512,
  utm_term: 256,
  gclid: 512,
  fbclid: 512,
  ttclid: 512,
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RateLimitEntry = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

const rateLimitEntries = new Map<string, RateLimitEntry>();
let lastRateLimitCleanupAt = 0;

export async function POST(request: Request) {
  if (!isAllowedBrowserRequest(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  if (!hasJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const envelopeIssues: string[] = [];
  const source = readOptionalString(body, "source", 32, envelopeIssues);
  const isCorporate = source === "corporate_training";
  const isPlacement = source === "placement_test";

  if (
    Object.hasOwn(body, "source") &&
    source !== "website" &&
    source !== "corporate_training" &&
    source !== "placement_test"
  ) {
    addIssue(envelopeIssues, "source");
  }

  const allowedFields = isCorporate
    ? corporateFields
    : isPlacement
      ? placementFields
      : individualFields;
  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    addIssue(envelopeIssues, "request");
  }

  const company = readOptionalString(body, "company", 200, envelopeIssues);
  if (envelopeIssues.length > 0) return validationError(envelopeIssues);

  if (company.trim()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const result = isCorporate
    ? prepareCorporateLead(body, request)
    : isPlacement
      ? preparePlacementLead(body, request)
      : prepareIndividualLead(body, request);

  if (!result.ok) return validationError(result.missing);

  if (isPlacement) {
    const existingToken = readAttemptToken(request.headers.get("cookie"));
    const existingAttempt = existingToken ? await getExistingAttempt(existingToken) : null;
    if (existingAttempt) {
      return NextResponse.json({ ok: true, placementAttempt: true, existing: true });
    }
  }

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  const webhookSecret = process.env.LEADS_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "submission_unavailable" }, { status: 500 });
  }

  try {
    const spreadsheetSafePayload = protectSpreadsheetPayload(result.payload);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: webhookSecret, ...spreadsheetSafePayload }),
      cache: "no-store",
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    let webhookResult: unknown;

    try {
      webhookResult = await response.json();
    } catch {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    if (!isSuccessfulWebhookResponse(webhookResult)) {
      return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
    }

    if (
      (isPlacement || result.payload.source === "website") &&
      "leadReference" in result.payload
    ) {
      try {
        const { token } = await createStoredAttempt(
          result.payload.metadata.locale === "en" ? "en" : "ar",
          result.payload.leadReference,
        );
        const placementResponse = NextResponse.json({ ok: true, placementAttempt: true });
        setAttemptCookie(placementResponse, token);
        return placementResponse;
      } catch {
        return NextResponse.json(
          { ok: false, error: "submission_unavailable" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "submission_failed" }, { status: 502 });
  }
}

function preparePlacementLead(body: JsonObject, request: Request) {
  const missing: string[] = [];
  const fullName = readRequiredString(body, "fullName", 120, missing);
  const phone = readRequiredString(body, "phone", 32, missing);
  const email = readOptionalString(body, "email", 254, missing);
  const metadata = readMetadata(body.metadata, missing);
  const normalizedPhone = normalizeEgyptianMobile(phone);

  if (!normalizedPhone) addIssue(missing, "phone");
  if (email && !emailPattern.test(email.trim())) addIssue(missing, "email");
  if (body.consent !== true) addIssue(missing, "consent");

  if (missing.length > 0 || !normalizedPhone) {
    return { ok: false as const, missing } satisfies ValidationFailure;
  }

  return {
    ok: true as const,
    payload: {
      status: "registered_not_started",
      source: "placement_test",
      leadReference: randomUUID(),
      locale: metadata?.locale === "en" ? "en" : "ar",
      submittedAt: new Date().toISOString(),
      fullName: fullName.trim(),
      phone: normalizedPhone,
      email: email.trim(),
      metadata: buildMetadata(metadata, request),
    },
  };
}

function prepareIndividualLead(body: JsonObject, request: Request) {
  const missing: string[] = [];
  const fullName = readRequiredString(body, "fullName", 120, missing);
  const phone = readRequiredString(body, "phone", 32, missing);
  const email = readOptionalString(body, "email", 254, missing);
  const learningGoal = readRequiredString(body, "learningGoal", 32, missing);
  const currentLevel = readOptionalString(body, "currentLevel", 64, missing);
  const preferredLearningMode = readRequiredString(body, "preferredLearningMode", 32, missing);
  const preferredAssessmentTime = readRequiredString(body, "preferredAssessmentTime", 32, missing);
  const notes = readOptionalString(body, "notes", 2_000, missing);
  const metadata = readMetadata(body.metadata, missing);
  const normalizedPhone = normalizeEgyptianMobile(phone);

  if (!normalizedPhone) addIssue(missing, "phone");
  if (email && !emailPattern.test(email.trim())) addIssue(missing, "email");
  if (!individualGoals.has(learningGoal)) addIssue(missing, "learningGoal");
  if (!individualLearningModes.has(preferredLearningMode)) addIssue(missing, "preferredLearningMode");
  if (!individualAssessmentTimes.has(preferredAssessmentTime)) addIssue(missing, "preferredAssessmentTime");
  if (body.consent !== true) addIssue(missing, "consent");

  if (missing.length > 0 || !normalizedPhone) {
    return { ok: false as const, missing } satisfies ValidationFailure;
  }

  return {
    ok: true as const,
    payload: {
      status: "new_assessment_lead",
      source: "website",
      leadReference: randomUUID(),
      submittedAt: new Date().toISOString(),
      fullName: fullName.trim(),
      phone: normalizedPhone,
      email: email.trim(),
      learningGoal,
      currentLevel,
      preferredLearningMode,
      preferredAssessmentTime,
      notes: notes.trim(),
      metadata: buildMetadata(metadata, request),
    },
  };
}

function prepareCorporateLead(body: JsonObject, request: Request) {
  const missing: string[] = [];
  const companyName = readRequiredString(body, "companyName", 160, missing);
  const contactName = readRequiredString(body, "contactName", 120, missing);
  const phone = readRequiredString(body, "phone", 32, missing);
  const email = readRequiredString(body, "email", 254, missing);
  const employeeCount = readRequiredString(body, "employeeCount", 16, missing);
  const preferredTrainingMode = readRequiredString(body, "preferredTrainingMode", 32, missing);
  const trainingGoal = readRequiredString(body, "trainingGoal", 2_000, missing);
  const notes = readOptionalString(body, "notes", 2_000, missing);
  const metadata = readMetadata(body.metadata, missing);
  const normalizedPhone = normalizeEgyptianMobile(phone);

  if (!normalizedPhone) addIssue(missing, "phone");
  if (!emailPattern.test(email.trim())) addIssue(missing, "email");
  if (!corporateEmployeeCounts.has(employeeCount)) addIssue(missing, "employeeCount");
  if (!corporateTrainingModes.has(preferredTrainingMode)) addIssue(missing, "preferredTrainingMode");
  if (body.consent !== true) addIssue(missing, "consent");

  if (missing.length > 0 || !normalizedPhone) {
    return { ok: false as const, missing } satisfies ValidationFailure;
  }

  return {
    ok: true as const,
    payload: {
      status: "new_corporate_training_lead",
      source: "corporate_training",
      locale: metadata?.locale ?? "",
      submittedAt: new Date().toISOString(),
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: normalizedPhone,
      email: email.trim(),
      employeeCount,
      preferredTrainingMode,
      trainingGoal: trainingGoal.trim(),
      notes: notes.trim(),
      metadata: buildMetadata(metadata, request),
    },
  };
}

function hasJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function isAllowedBrowserRequest(request: Request) {
  if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") return false;

  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;

  try {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const allowedOrigin = configuredSiteUrl
      ? new URL(configuredSiteUrl).origin
      : new URL(request.url).origin;

    return new URL(originHeader).origin === allowedOrigin;
  } catch {
    return false;
  }
}

async function readJsonObject(request: Request): Promise<JsonObject | null> {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BODY_BYTES)
  ) {
    return null;
  }

  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let totalBytes = 0;
  let source = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel();
        return null;
      }

      source += decoder.decode(value, { stream: true });
    }

    source += decoder.decode();
    const parsed: unknown = JSON.parse(source);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function readRequiredString(
  body: JsonObject,
  field: string,
  maxLength: number,
  issues: string[],
) {
  const value = readOptionalString(body, field, maxLength, issues);
  if (!value.trim()) addIssue(issues, field);
  return value;
}

function readOptionalString(
  body: JsonObject,
  field: string,
  maxLength: number,
  issues: string[],
) {
  const value = body[field];
  if (value === undefined) return "";

  if (typeof value !== "string" || value.length > maxLength) {
    addIssue(issues, field);
    return "";
  }

  return value;
}

function readMetadata(value: unknown, issues: string[]): LeadMetadata | undefined {
  if (value === undefined) return undefined;

  if (!isPlainObject(value)) {
    addIssue(issues, "metadata");
    return undefined;
  }

  const allowedKeys = Object.keys(metadataLimits);
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    addIssue(issues, "metadata");
  }

  const metadata: LeadMetadata = {};

  for (const key of allowedKeys as Array<keyof typeof metadataLimits>) {
    const fieldValue = value[key];
    if (fieldValue === undefined) continue;

    if (typeof fieldValue !== "string" || fieldValue.length > metadataLimits[key]) {
      addIssue(issues, "metadata");
      continue;
    }

    metadata[key] = fieldValue;
  }

  if (metadata.locale && metadata.locale !== "ar" && metadata.locale !== "en") {
    addIssue(issues, "metadata");
  }

  return metadata;
}

function buildMetadata(metadata: LeadMetadata | undefined, request: Request) {
  const headerUserAgent = (request.headers.get("user-agent") ?? "").slice(
    0,
    metadataLimits.userAgent,
  );

  return {
    locale: metadata?.locale ?? "",
    pagePath: metadata?.pagePath ?? "",
    referrer: metadata?.referrer ?? "",
    userAgent: metadata?.userAgent ?? headerUserAgent,
    utm_source: metadata?.utm_source ?? "",
    utm_medium: metadata?.utm_medium ?? "",
    utm_campaign: metadata?.utm_campaign ?? "",
    utm_content: metadata?.utm_content ?? "",
    utm_term: metadata?.utm_term ?? "",
    gclid: metadata?.gclid ?? "",
    fbclid: metadata?.fbclid ?? "",
    ttclid: metadata?.ttclid ?? "",
  };
}

function getClientIp(request: Request) {
  // Nginx Proxy Manager is the trusted public ingress and overwrites X-Real-IP.
  const realIp = normalizeIpAddress(request.headers.get("x-real-ip"));
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor && forwardedFor.length <= 1_024) {
    const rightmostAddress = forwardedFor.split(",").at(-1) ?? null;
    const forwardedIp = normalizeIpAddress(rightmostAddress);
    if (forwardedIp) return forwardedIp;
  }

  return "unknown";
}

function normalizeIpAddress(value: string | null) {
  if (!value) return null;

  let candidate = value.trim().replace(/^"|"$/g, "");
  const bracketedIpv6 = candidate.match(/^\[([^\]]+)](?::\d+)?$/);
  if (bracketedIpv6) candidate = bracketedIpv6[1];
  if (candidate.includes(".")) candidate = candidate.replace(/:\d+$/, "");
  if (candidate.startsWith("::ffff:") && isIP(candidate.slice(7)) === 4) {
    candidate = candidate.slice(7);
  }

  return isIP(candidate) ? candidate : null;
}

function checkRateLimit(clientIp: string) {
  const now = Date.now();
  cleanRateLimitEntries(now);

  const current = rateLimitEntries.get(clientIp);
  if (!current || current.resetAt <= now) {
    ensureRateLimitCapacity();
    rateLimitEntries.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      lastSeenAt: now,
    });
    return { allowed: true as const };
  }

  current.lastSeenAt = now;
  if (current.count >= RATE_LIMIT_REQUESTS) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true as const };
}

function cleanRateLimitEntries(now: number) {
  if (
    now - lastRateLimitCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS &&
    rateLimitEntries.size < RATE_LIMIT_MAX_ENTRIES
  ) {
    return;
  }

  lastRateLimitCleanupAt = now;
  for (const [key, entry] of rateLimitEntries) {
    if (entry.resetAt <= now) rateLimitEntries.delete(key);
  }
}

function ensureRateLimitCapacity() {
  if (rateLimitEntries.size < RATE_LIMIT_MAX_ENTRIES) return;

  let oldestKey: string | undefined;
  let oldestSeenAt = Number.POSITIVE_INFINITY;

  for (const [key, entry] of rateLimitEntries) {
    if (entry.lastSeenAt < oldestSeenAt) {
      oldestKey = key;
      oldestSeenAt = entry.lastSeenAt;
    }
  }

  if (oldestKey) rateLimitEntries.delete(oldestKey);
}

function protectSpreadsheetObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [key, protectSpreadsheetValue(fieldValue)]),
  );
}

function protectSpreadsheetPayload(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      key === "phone" && typeof fieldValue === "string"
        ? fieldValue
        : protectSpreadsheetValue(fieldValue),
    ]),
  );
}

function protectSpreadsheetValue(value: unknown): unknown {
  if (typeof value === "string") {
    return /^[\u0000-\u0020]*[=+\-@]/.test(value) ? `'${value}` : value;
  }

  if (Array.isArray(value)) return value.map(protectSpreadsheetValue);
  if (isPlainObject(value)) return protectSpreadsheetObject(value);
  return value;
}

function validationError(missing: string[]) {
  return NextResponse.json(
    { ok: false, error: "validation_error", missing },
    { status: 400 },
  );
}

function addIssue(issues: string[], field: string) {
  if (!issues.includes(field)) issues.push(field);
}

function isPlainObject(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isSuccessfulWebhookResponse(value: unknown): value is { success: true } {
  return typeof value === "object" && value !== null && "success" in value && value.success === true;
}
