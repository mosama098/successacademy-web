import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

const META_GRAPH_API_VERSION = "v26.0";
const META_LEAD_TIMEOUT_MS = 5_000;
const submissionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const metaCookiePattern = /^fb\.[12]\.\d{10,16}\.[A-Za-z0-9_-]{1,200}$/;

export type MetaLeadSource =
  | "website"
  | "placement_test"
  | "plans_pricing"
  | "corporate_training";

export type MetaLeadInput = {
  submissionId: string;
  source: MetaLeadSource;
  locale: string;
  pagePath: string;
  email: string;
  phone: string;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  occurredAt: string;
};

export type MetaLeadDeliveryResult = {
  outcome: "delivered" | "failed";
  diagnosticCode: string;
  httpStatus: number | null;
};

type MetaLeadConfig = {
  accessToken: string;
  datasetId: string;
  siteUrl: string;
  testEventCode?: string;
};

export function metaLeadEventId(submissionId: string) {
  if (!submissionIdPattern.test(submissionId)) throw new Error("meta_lead_submission_id_invalid");
  return `lead:${submissionId.toLowerCase()}`;
}

export function readMetaLeadCookies(cookieHeader: string | null) {
  const cookies: { fbp?: string; fbc?: string } = {};
  if (!cookieHeader || cookieHeader.length > 8_192) return cookies;

  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 1) continue;
    const name = entry.slice(0, separator).trim();
    if (name !== "_fbp" && name !== "_fbc") continue;
    const value = entry.slice(separator + 1).trim();
    if (!metaCookiePattern.test(value)) continue;
    if (name === "_fbp") cookies.fbp = value;
    if (name === "_fbc") cookies.fbc = value;
  }

  return cookies;
}

export async function deliverMetaLeadFailOpen(
  input: MetaLeadInput,
  options: { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch } = {},
): Promise<MetaLeadDeliveryResult> {
  try {
    const client = new MetaLeadCapiClient(
      readMetaLeadConfig(options.env),
      options.fetchImpl,
    );
    return await client.sendLead(input);
  } catch {
    return { outcome: "failed", diagnosticCode: "configuration_invalid", httpStatus: null };
  }
}

export class MetaLeadCapiClient {
  constructor(
    private readonly config: MetaLeadConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async sendLead(input: MetaLeadInput): Promise<MetaLeadDeliveryResult> {
    const userData: Record<string, string | string[]> = {};
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const clientIp = normalizeClientIp(input.clientIp);
    const clientUserAgent = normalizeUserAgent(input.clientUserAgent);
    const fbp = normalizeMetaCookie(input.fbp);
    const fbc = normalizeMetaCookie(input.fbc);

    if (email) userData.em = [sha256(email)];
    if (phone) userData.ph = [sha256(phone)];
    if (clientIp) userData.client_ip_address = clientIp;
    if (clientUserAgent) userData.client_user_agent = clientUserAgent;
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    if (!userData.em && !userData.ph) {
      return { outcome: "failed", diagnosticCode: "customer_identity_missing", httpStatus: null };
    }

    const occurredAt = Date.parse(input.occurredAt);
    if (!Number.isFinite(occurredAt)) {
      return { outcome: "failed", diagnosticCode: "event_time_invalid", httpStatus: null };
    }

    const payload: Record<string, unknown> = {
      data: [{
        event_name: "Lead",
        event_time: Math.floor(occurredAt / 1_000),
        event_id: metaLeadEventId(input.submissionId),
        action_source: "website",
        event_source_url: resolveEventSourceUrl(
          this.config.siteUrl,
          input.pagePath,
          input.source,
          input.locale,
        ),
        user_data: userData,
      }],
    };
    if (this.config.testEventCode) payload.test_event_code = this.config.testEventCode;

    let response: Response;
    try {
      response = await this.fetchImpl(
        `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(this.config.datasetId)}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify(payload),
          cache: "no-store",
          signal: AbortSignal.timeout(META_LEAD_TIMEOUT_MS),
        },
      );
    } catch (failure) {
      return {
        outcome: "failed",
        diagnosticCode:
          failure instanceof DOMException && failure.name === "TimeoutError"
            ? "timeout"
            : "network_error",
        httpStatus: null,
      };
    }

    let responseBody: unknown = null;
    try {
      responseBody = await response.json();
    } catch {
      // The status still provides a safe delivery diagnostic.
    }

    if (response.ok && isRecord(responseBody) && Number(responseBody.events_received) >= 1) {
      return { outcome: "delivered", diagnosticCode: "accepted", httpStatus: response.status };
    }

    return {
      outcome: "failed",
      diagnosticCode: response.ok ? "response_invalid" : `http_${response.status}`,
      httpStatus: response.status,
    };
  }
}

function readMetaLeadConfig(env: NodeJS.ProcessEnv = process.env): MetaLeadConfig {
  const accessToken = env.META_CAPI_ACCESS_TOKEN?.trim() ?? "";
  const datasetId = env.META_CAPI_DATASET_ID?.trim() || env.META_CAPI_PIXEL_ID?.trim() || "";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";
  const testEventCode = env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined;
  if (!accessToken || !/^\d{5,32}$/.test(datasetId) || !isHttpsOrigin(siteUrl)) {
    throw new Error("meta_lead_configuration_invalid");
  }
  return { accessToken, datasetId, siteUrl, testEventCode };
}

function resolveEventSourceUrl(
  siteUrl: string,
  pagePath: string,
  source: MetaLeadSource,
  locale: string,
) {
  const safeLocale = locale === "en" ? "en" : "ar";
  const fallbackPath = source === "website"
    ? `/${safeLocale}`
    : source === "placement_test"
      ? `/${safeLocale}/placement-test`
      : source === "plans_pricing"
        ? `/${safeLocale}/plans`
        : `/${safeLocale}/business`;
  const candidatePath = pagePath.startsWith("/") && !pagePath.startsWith("//")
    ? pagePath
    : fallbackPath;

  try {
    const site = new URL(siteUrl);
    const candidate = new URL(candidatePath, site);
    return candidate.origin === site.origin
      ? `${site.origin}${candidate.pathname}`
      : `${site.origin}${fallbackPath}`;
  } catch {
    return `${siteUrl}${fallbackPath}`;
  }
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  return /^\d{10,15}$/.test(digits) ? digits : "";
}

function normalizeClientIp(value: string | null | undefined) {
  const candidate = value?.trim() ?? "";
  return candidate && isIP(candidate) ? candidate : "";
}

function normalizeUserAgent(value: string | null | undefined) {
  const candidate = value?.trim() ?? "";
  return candidate && candidate.length <= 512 && !/[\u0000-\u001f\u007f]/.test(candidate)
    ? candidate
    : "";
}

function normalizeMetaCookie(value: string | null | undefined) {
  const candidate = value?.trim() ?? "";
  return metaCookiePattern.test(candidate) ? candidate : "";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isHttpsOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
