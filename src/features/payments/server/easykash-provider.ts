import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Order } from "../types";
import type {
  PaymentInitiation,
  PaymentProvider,
  PaymentProviderCustomer,
  PaymentVerification,
  ProviderCallbackInput,
} from "./contracts";

const EASYKASH_BASE_URL = "https://back.easykash.net";
const REQUEST_TIMEOUT_MS = 15_000;

export type EasyKashErrorCode =
  | "easykash_configuration_invalid"
  | "easykash_request_failed"
  | "easykash_response_invalid"
  | "easykash_signature_invalid"
  | "easykash_callback_invalid"
  | "easykash_payment_method_invalid";

export class EasyKashError extends Error {
  constructor(readonly code: EasyKashErrorCode) {
    super(code);
    this.name = "EasyKashError";
  }
}

type EasyKashProviderOptions = {
  apiKey: string;
  hmacSecret?: string;
  baseUrl?: string;
  allowedPaymentMethods?: readonly string[];
  returnUrlForOrder: (order: Order) => string;
  fetchImpl?: typeof fetch;
  createAttemptSuffix?: () => string;
};

export class EasyKashProvider implements PaymentProvider {
  readonly id = "easykash" as const;
  private readonly apiKey: string;
  private readonly hmacSecret: string | null;
  private readonly baseUrl: string;
  private readonly allowedPaymentMethods: ReadonlySet<string>;
  private readonly returnUrlForOrder: (order: Order) => string;
  private readonly fetchImpl: typeof fetch;
  private readonly createAttemptSuffix: () => string;

  constructor(options: EasyKashProviderOptions) {
    this.apiKey = options.apiKey;
    this.hmacSecret = options.hmacSecret || null;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? EASYKASH_BASE_URL);
    this.allowedPaymentMethods = new Set((options.allowedPaymentMethods ?? []).map(normalizeMethodName));
    this.returnUrlForOrder = options.returnUrlForOrder;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.createAttemptSuffix = options.createAttemptSuffix ?? (() => randomBytes(8).toString("hex"));
    if (!this.apiKey || this.apiKey.length < 16 || (this.hmacSecret !== null && this.hmacSecret.length < 16)) {
      throw new EasyKashError("easykash_configuration_invalid");
    }
  }

  async createPayment(order: Order, customer: PaymentProviderCustomer): Promise<PaymentInitiation> {
    if (order.payment.method !== "installments" || order.payment.currency !== "EGP"
      || !Number.isSafeInteger(order.payment.amountMinor) || order.payment.amountMinor <= 0) {
      throw new EasyKashError("easykash_request_failed");
    }
    const customerReference = createEasyKashAttemptReference(order.id, this.createAttemptSuffix());
    const response = await this.request("/api/directpayv1/pay", {
      amount: minorToMajor(order.payment.amountMinor),
      currency: "EGP",
      name: customer.name,
      email: customer.email,
      mobile: customer.phone,
      redirectUrl: requireHttpsUrl(this.returnUrlForOrder(order)),
      customerReference,
    }, true);
    const redirectUrl = readHostedRedirectUrl(response.redirectUrl);
    const transactionId = readNonEmptyString(response.easykashRef, 256);
    if (!redirectUrl) {
      logEasyKashDiagnostic("response_rejected", {
        diagnosticCode: hasNonEmptyValue(response.redirectUrl) ? "redirect_url_invalid" : "redirect_url_missing",
        redirectUrlExists: hasNonEmptyValue(response.redirectUrl),
        redirectUrlOrigin: safeUrlOrigin(response.redirectUrl),
      });
      throw new EasyKashError("easykash_response_invalid");
    }
    return { provider: this.id, transactionId, redirectUrl, status: "waiting_payment" };
  }

  async verifyPayment(customerReferenceValue: string): Promise<PaymentVerification> {
    const customerReference = readNonEmptyString(customerReferenceValue, 128);
    if (!customerReference || !readEasyKashAttemptOrderId(customerReference)) {
      throw new EasyKashError("easykash_request_failed");
    }
    const response = await this.request("/api/cash-api/inquire", { customerReference });
    if (readNonEmptyString(response.customerReference, 128) !== customerReference) {
      throw new EasyKashError("easykash_callback_invalid");
    }
    const verification = this.readVerification(response, true);
    return verification;
  }

  async handleCallback(input: ProviderCallbackInput): Promise<PaymentVerification> {
    let payload: unknown;
    try { payload = JSON.parse(input.rawBody); } catch { throw new EasyKashError("easykash_callback_invalid"); }
    if (!isObject(payload)) throw new EasyKashError("easykash_callback_invalid");
    if (!this.hmacSecret) return this.verifyCallbackByInquiry(payload);
    const signedFields = ["ProductCode", "Amount", "ProductType", "PaymentMethod", "status", "easykashRef", "customerReference"] as const;
    if (signedFields.some((field) => payload[field] === undefined || payload[field] === null)) {
      throw new EasyKashError("easykash_callback_invalid");
    }
    const signature = readNonEmptyString(payload.signatureHash, 256);
    if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) throw new EasyKashError("easykash_signature_invalid");
    const signedValue = signedFields.map((field) => String(payload[field])).join("");
    const expected = createHmac("sha512", this.hmacSecret).update(signedValue).digest("hex");
    const providedBytes = Buffer.from(signature, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    if (providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) {
      throw new EasyKashError("easykash_signature_invalid");
    }
    return this.readVerification(payload, true);
  }

  private async verifyCallbackByInquiry(payload: Record<string, unknown>) {
    const customerReference = readNonEmptyString(payload.customerReference, 128);
    if (!customerReference || !readEasyKashAttemptOrderId(customerReference)) {
      throw new EasyKashError("easykash_callback_invalid");
    }
    const callbackReference = payload.easykashRef === undefined || payload.easykashRef === null || payload.easykashRef === ""
      ? null
      : readNonEmptyString(payload.easykashRef, 256);
    if (callbackReference === null && payload.easykashRef !== undefined && payload.easykashRef !== null && payload.easykashRef !== "") {
      throw new EasyKashError("easykash_callback_invalid");
    }
    const verification = await this.verifyPayment(customerReference);
    if (callbackReference && callbackReference !== verification.transactionId) {
      throw new EasyKashError("easykash_callback_invalid");
    }
    return verification;
  }

  private readVerification(value: unknown, requireAllowedMethod: boolean): PaymentVerification {
    if (!isObject(value)) throw new EasyKashError("easykash_callback_invalid");
    const orderId = readEasyKashAttemptOrderId(value.customerReference);
    const transactionId = readNonEmptyString(value.easykashRef, 256);
    const amountMinor = majorToMinor(value.Amount ?? value.amount);
    const status = readStatus(value.status);
    const paymentMethod = readNonEmptyString(value.PaymentMethod ?? value.paymentMethod, 128);
    if (!orderId || !transactionId || amountMinor === null || !status || !paymentMethod) {
      throw new EasyKashError("easykash_callback_invalid");
    }
    if (requireAllowedMethod && !this.isAllowedPaymentMethod(paymentMethod)) {
      throw new EasyKashError("easykash_payment_method_invalid");
    }
    return { orderId, transactionId, amountMinor, currency: "EGP", status };
  }

  private isAllowedPaymentMethod(value: string) {
    const normalized = normalizeMethodName(value);
    return this.allowedPaymentMethods.size === 0 || this.allowedPaymentMethods.has(normalized);
  }

  private async request(path: string, payload: Record<string, unknown>, diagnoseInitiation = false) {
    const startedAt = Date.now();
    if (diagnoseInitiation) {
      logEasyKashDiagnostic("request", {
        ...safeRequestFacts(this.baseUrl, path, payload),
        authorizationHeaderPresent: Boolean(this.apiKey),
      });
    }
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { authorization: this.apiKey, "content-type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (failure) {
      if (diagnoseInitiation) {
        logEasyKashDiagnostic("transport_error", {
          ...safeRequestFacts(this.baseUrl, path, payload),
          upstreamResponseReceived: false,
          diagnosticCode: classifyTransportFailure(failure),
          elapsedMs: Date.now() - startedAt,
        });
      }
      throw new EasyKashError("easykash_request_failed");
    }
    const responseFacts = diagnoseInitiation
      ? await safeResponseFacts(response, [this.apiKey, payload.name, payload.email, payload.mobile])
      : null;
    if (diagnoseInitiation) {
      logEasyKashDiagnostic(response.ok ? "response" : "upstream_error", {
        ...safeRequestFacts(this.baseUrl, path, payload),
        upstreamResponseReceived: true,
        upstreamStatus: response.status,
        upstreamContentType: safeContentType(response.headers.get("content-type")),
        ...responseFacts,
        diagnosticCode: response.ok ? null : "upstream_http_error",
        elapsedMs: Date.now() - startedAt,
      });
    }
    if (!response.ok) throw new EasyKashError("easykash_request_failed");
    try {
      const value: unknown = await response.json();
      if (!isObject(value)) throw new Error("invalid");
      return value;
    } catch {
      if (diagnoseInitiation) {
        logEasyKashDiagnostic("response_invalid", {
          ...safeRequestFacts(this.baseUrl, path, payload),
          upstreamResponseReceived: true,
          upstreamStatus: response.status,
          upstreamContentType: safeContentType(response.headers.get("content-type")),
          ...responseFacts,
          diagnosticCode: "response_json_invalid",
          elapsedMs: Date.now() - startedAt,
        });
      }
      throw new EasyKashError("easykash_response_invalid");
    }
  }
}

function safeRequestFacts(baseUrl: string, path: string, payload: Record<string, unknown>) {
  const endpoint = new URL(path, baseUrl);
  return {
    endpointHost: endpoint.host,
    endpointPath: endpoint.pathname,
    amount: typeof payload.amount === "number" ? payload.amount : null,
    currency: payload.currency === "EGP" ? "EGP" : null,
    paymentOptionsPresent: Object.prototype.hasOwnProperty.call(payload, "paymentOptions"),
    customerReference: readNonEmptyString(payload.customerReference, 128),
    returnUrl: safeUrlLocation(payload.redirectUrl),
    namePresent: hasNonEmptyValue(payload.name),
    emailPresent: hasNonEmptyValue(payload.email),
    mobilePresent: hasNonEmptyValue(payload.mobile),
  };
}

async function safeResponseFacts(response: Response, sensitiveValues: readonly unknown[]) {
  let value: unknown = null;
  try {
    const text = await response.clone().text();
    if (text.length <= 32_768) value = JSON.parse(text);
  } catch {
    // Diagnostics must not affect provider response handling.
  }
  if (!isObject(value)) {
    return { easyKashErrorCode: null, easyKashErrorMessage: null, redirectUrlExists: false, redirectUrlOrigin: null };
  }
  const nestedError = isObject(value.error) ? value.error : null;
  const redirectValue = value.redirectUrl;
  return {
    easyKashErrorCode: sanitizeDiagnosticValue(
      value.errorCode ?? value.code ?? value.ErrorCode ?? nestedError?.code,
      80,
      sensitiveValues,
    ),
    easyKashErrorMessage: sanitizeDiagnosticValue(
      value.errorMessage ?? value.message ?? value.Message ?? nestedError?.message
        ?? (typeof value.error === "string" ? value.error : null),
      200,
      sensitiveValues,
    ),
    redirectUrlExists: hasNonEmptyValue(redirectValue),
    redirectUrlOrigin: safeUrlOrigin(redirectValue),
  };
}

function classifyTransportFailure(failure: unknown) {
  const name = failure instanceof Error ? failure.name : "";
  if (name === "TimeoutError" || name === "AbortError") return "timeout";
  const cause = failure instanceof Error && isObject(failure.cause) ? failure.cause : null;
  const code = typeof cause?.code === "string" ? cause.code.toUpperCase() : "";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "EAI_NODATA"].includes(code)) return "dns_error";
  if (/TLS|SSL|CERT|CERTIFICATE/.test(code)) return "tls_error";
  return "network_error";
}

function sanitizeDiagnosticValue(value: unknown, maxLength: number, sensitiveValues: readonly unknown[]) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  let normalized = String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  for (const sensitiveValue of sensitiveValues) {
    if (typeof sensitiveValue !== "string" || sensitiveValue.length < 3) continue;
    normalized = normalized.split(sensitiveValue).join("[redacted]");
  }
  return normalized
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[redacted-email]")
    .replace(/(?:\+?\d[\s().-]?){7,}/g, "[redacted-number]")
    .replace(/\b(authorization|api[_ -]?key|secret|token)\b\s*[:=]?\s*\S+/gi, "$1=[redacted]")
    .slice(0, maxLength);
}

function safeContentType(value: string | null) {
  const mediaType = value?.split(";", 1)[0].trim().toLowerCase() ?? "";
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mediaType) ? mediaType : null;
}

function safeUrlLocation(value: unknown) {
  try {
    const url = new URL(String(value));
    return { origin: url.origin, path: url.pathname };
  } catch {
    return null;
  }
}

function safeUrlOrigin(value: unknown) {
  try { return new URL(String(value)).origin; } catch { return null; }
}

function hasNonEmptyValue(value: unknown) {
  return (typeof value === "string" || typeof value === "number") && String(value).trim().length > 0;
}

function logEasyKashDiagnostic(stage: string, facts: Record<string, unknown>) {
  const entry = JSON.stringify({ scope: "easykash_initiation", stage, ...facts });
  if (stage === "request" || stage === "response") console.info(entry);
  else console.warn(entry);
}

function normalizeBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/$/, "");
  if (normalized !== EASYKASH_BASE_URL) throw new EasyKashError("easykash_configuration_invalid");
  return normalized;
}

function createEasyKashAttemptReference(orderId: string, suffixValue: string) {
  const normalizedOrderId = orderId.trim().toLowerCase();
  const suffix = suffixValue.trim().toLowerCase();
  if (!isOrderId(normalizedOrderId) || !/^[a-f0-9]{16}$/.test(suffix)) {
    throw new EasyKashError("easykash_request_failed");
  }
  return `${normalizedOrderId}-${suffix}`;
}

function readEasyKashAttemptOrderId(value: unknown) {
  const reference = readNonEmptyString(value, 128)?.toLowerCase();
  const match = reference?.match(/^([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})-[a-f0-9]{16}$/);
  return match?.[1] ?? null;
}

function isOrderId(value: string) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
}

function requireHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("invalid");
    return url.href;
  } catch {
    throw new EasyKashError("easykash_configuration_invalid");
  }
}

function readHostedRedirectUrl(value: unknown) {
  const raw = readNonEmptyString(value, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.toLowerCase() === "easykash.net"
      && !url.port && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function readStatus(value: unknown): PaymentVerification["status"] | null {
  const status = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (status === "PAID") return "paid";
  if (["NEW", "PENDING", "PROCESSING", "DELIVERED"].includes(status)) return "waiting_payment";
  if (["FAILED", "EXPIRED", "CANCELED", "CANCELLED", "REFUNDED"].includes(status)) return "failed";
  return null;
}

function readNonEmptyString(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized && normalized.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : null;
}

function normalizeMethodName(value: string) { return value.trim().toLowerCase(); }
function minorToMajor(amountMinor: number) { return Number((amountMinor / 100).toFixed(2)); }
function majorToMinor(value: unknown) {
  const normalized = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : null;
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
