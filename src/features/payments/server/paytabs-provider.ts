import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentInitiation,
  PaymentProvider,
  PaymentProviderCustomer,
  PaymentVerification,
  ProviderCallbackInput,
} from "./contracts";
import type { Order } from "../types";

const PAYTABS_EGYPT_BASE_URL = "https://secure-egypt.paytabs.com";
const REQUEST_TIMEOUT_MS = 15_000;

export type PayTabsErrorCode =
  | "paytabs_configuration_invalid"
  | "paytabs_request_failed"
  | "paytabs_response_invalid"
  | "paytabs_signature_invalid"
  | "paytabs_callback_invalid";

export class PayTabsError extends Error {
  constructor(readonly code: PayTabsErrorCode) {
    super(code);
    this.name = "PayTabsError";
  }
}

type PayTabsProviderOptions = {
  profileId: string;
  serverKey: string;
  baseUrl?: string;
  callbackUrl: string;
  returnUrlForOrder: (order: Order) => string;
  fetchImpl?: typeof fetch;
};

export class PayTabsProvider implements PaymentProvider {
  readonly id = "paytabs" as const;
  private readonly profileId: string;
  private readonly serverKey: string;
  private readonly baseUrl: string;
  private readonly callbackUrl: string;
  private readonly returnUrlForOrder: (order: Order) => string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PayTabsProviderOptions) {
    this.profileId = options.profileId.trim();
    this.serverKey = options.serverKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? PAYTABS_EGYPT_BASE_URL);
    this.callbackUrl = requireHttpsUrl(options.callbackUrl);
    this.returnUrlForOrder = options.returnUrlForOrder;
    this.fetchImpl = options.fetchImpl ?? fetch;
    if (!/^\d{1,15}$/.test(this.profileId) || !Number.isSafeInteger(Number(this.profileId))
      || !this.serverKey || this.serverKey.length < 16) {
      throw new PayTabsError("paytabs_configuration_invalid");
    }
  }

  async createPayment(order: Order, customer: PaymentProviderCustomer): Promise<PaymentInitiation> {
    if (order.payment.method !== "card" || order.payment.currency !== "EGP" || !Number.isSafeInteger(order.payment.amountMinor) || order.payment.amountMinor <= 0) {
      throw new PayTabsError("paytabs_request_failed");
    }
    const response = await this.request("/payment/request", {
      profile_id: Number(this.profileId),
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: order.id,
      cart_currency: "EGP",
      cart_amount: minorToMajor(order.payment.amountMinor),
      cart_description: `Success Academy - ${order.packageSnapshot.packageName}`.slice(0, 128),
      payment_methods: ["creditcard"],
      callback: this.callbackUrl,
      return: requireHttpsUrl(this.returnUrlForOrder(order)),
      customer_details: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
    const transactionId = readNonEmptyString(response.tran_ref, 256);
    const redirectUrl = readProviderUrl(response.redirect_url, this.baseUrl);
    if (!transactionId || !redirectUrl) throw new PayTabsError("paytabs_response_invalid");
    return { provider: this.id, transactionId, redirectUrl, status: "waiting_payment" };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    const reference = readNonEmptyString(transactionId, 256);
    if (!reference) throw new PayTabsError("paytabs_request_failed");
    const response = await this.request("/payment/query", {
      profile_id: Number(this.profileId),
      tran_ref: reference,
    });
    return readVerification(response, this.profileId);
  }

  async handleCallback(input: ProviderCallbackInput): Promise<PaymentVerification> {
    const signature = input.headers.signature;
    const expected = createHmac("sha256", this.serverKey).update(input.rawBody).digest("hex");
    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
      throw new PayTabsError("paytabs_signature_invalid");
    }
    const providedBytes = Buffer.from(signature, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    if (providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) {
      throw new PayTabsError("paytabs_signature_invalid");
    }
    let payload: unknown;
    try { payload = JSON.parse(input.rawBody); } catch { throw new PayTabsError("paytabs_callback_invalid"); }
    return readVerification(payload, this.profileId);
  }

  private async request(path: string, payload: Record<string, unknown>) {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          authorization: this.serverKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new PayTabsError("paytabs_request_failed");
    }
    if (!response.ok) throw new PayTabsError("paytabs_request_failed");
    try {
      const value: unknown = await response.json();
      if (!isObject(value)) throw new Error("invalid");
      return value;
    } catch {
      throw new PayTabsError("paytabs_response_invalid");
    }
  }
}

function readVerification(value: unknown, expectedProfileId: string): PaymentVerification {
  if (!isObject(value) || !isObject(value.payment_result)) throw new PayTabsError("paytabs_callback_invalid");
  const profileId = String(value.profile_id ?? "");
  const orderId = readNonEmptyString(value.cart_id, 128);
  const transactionId = readNonEmptyString(value.tran_ref, 256);
  const currency = readNonEmptyString(value.cart_currency, 8);
  const amountMinor = majorToMinor(value.cart_amount);
  const responseStatus = readNonEmptyString(value.payment_result.response_status, 8);
  if (profileId !== expectedProfileId || !orderId || !transactionId || !currency || amountMinor === null || !responseStatus) {
    throw new PayTabsError("paytabs_callback_invalid");
  }
  return {
    orderId,
    profileId,
    transactionId,
    amountMinor,
    currency,
    status: responseStatus === "A" ? "paid" : responseStatus === "P" || responseStatus === "H" ? "waiting_payment" : "failed",
  };
}

function normalizeBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/$/, "");
  if (normalized !== PAYTABS_EGYPT_BASE_URL) throw new PayTabsError("paytabs_configuration_invalid");
  return normalized;
}

function requireHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("invalid");
    return url.href;
  } catch {
    throw new PayTabsError("paytabs_configuration_invalid");
  }
}

function readProviderUrl(value: unknown, baseUrl: string) {
  const raw = readNonEmptyString(value, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.origin === baseUrl ? url.href : null;
  } catch { return null; }
}

function readNonEmptyString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : null;
}

function minorToMajor(amountMinor: number) {
  return Number((amountMinor / 100).toFixed(2));
}

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
