import "server-only";
import { createHash } from "node:crypto";
import type { MetaPurchaseEvent } from "./meta-purchase";

export const META_GRAPH_API_VERSION = "v26.0";
const META_TIMEOUT_MS = 5_000;

export type MetaDeliveryResult = {
  outcome: "delivered" | "retryable" | "permanent";
  diagnosticCode: string;
  httpStatus: number | null;
};

type MetaCapiConfig = {
  accessToken: string;
  datasetId: string;
  siteUrl: string;
  trackingValueEgp: number;
  testEventCode?: string;
};

export class MetaCapiConfigurationError extends Error {
  constructor() {
    super("meta_capi_configuration_invalid");
    this.name = "MetaCapiConfigurationError";
  }
}

export class MetaCapiClient {
  constructor(
    private readonly config: MetaCapiConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async sendPurchase(event: MetaPurchaseEvent): Promise<MetaDeliveryResult> {
    if (event.valueEgp !== this.config.trackingValueEgp || event.valueEgp !== 1000) {
      return { outcome: "permanent", diagnosticCode: "tracking_value_invalid", httpStatus: null };
    }
    const userData: Record<string, string[]> = {};
    const email = normalizeEmail(event.customer.email);
    const phone = normalizePhone(event.customer.phone);
    if (email) userData.em = [sha256(email)];
    if (phone) userData.ph = [sha256(phone)];
    if (!userData.em && !userData.ph) {
      return { outcome: "permanent", diagnosticCode: "customer_identity_missing", httpStatus: null };
    }

    const payload: Record<string, unknown> = {
      data: [{
        event_name: event.eventName,
        event_time: Math.floor(Date.parse(event.occurredAt) / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: `${this.config.siteUrl}/${event.locale}/plans/payment/success?order=${encodeURIComponent(event.orderId)}`,
        user_data: userData,
        custom_data: {
          currency: event.currency,
          value: event.valueEgp,
          order_id: event.orderId,
          content_ids: [event.packageId],
          content_type: "product",
          contents: [{ id: event.packageId, quantity: 1 }],
          package_id: event.packageId,
          program_type: event.programType,
          start_level: event.startLevel,
          target_level: event.targetLevel,
        },
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
          signal: AbortSignal.timeout(META_TIMEOUT_MS),
        },
      );
    } catch (failure) {
      return {
        outcome: "retryable",
        diagnosticCode: failure instanceof DOMException && failure.name === "TimeoutError" ? "timeout" : "network_error",
        httpStatus: null,
      };
    }

    let body: unknown = null;
    try { body = await response.json(); } catch {
      // Classification below uses status even when Meta returns a malformed body.
    }
    if (response.ok && isRecord(body) && Number(body.events_received) >= 1) {
      return { outcome: "delivered", diagnosticCode: "accepted", httpStatus: response.status };
    }
    if (response.status === 408 || response.status === 429 || response.status >= 500 || response.ok) {
      return { outcome: "retryable", diagnosticCode: response.ok ? "response_invalid" : `http_${response.status}`, httpStatus: response.status };
    }
    return { outcome: "permanent", diagnosticCode: `http_${response.status}`, httpStatus: response.status };
  }
}

export function readMetaCapiConfig(env: NodeJS.ProcessEnv = process.env): MetaCapiConfig {
  const accessToken = env.META_CAPI_ACCESS_TOKEN?.trim() ?? "";
  const datasetId = env.META_CAPI_DATASET_ID?.trim() || env.META_CAPI_PIXEL_ID?.trim() || "";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";
  const trackingValueEgp = Number(env.META_PURCHASE_VALUE_EGP);
  const testEventCode = env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined;
  if (!accessToken || !/^\d{5,32}$/.test(datasetId) || !isHttpsOrigin(siteUrl) || trackingValueEgp !== 1000) {
    throw new MetaCapiConfigurationError();
  }
  return { accessToken, datasetId, siteUrl, trackingValueEgp, testEventCode };
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

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isHttpsOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && !url.username && !url.password;
  } catch { return false; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
