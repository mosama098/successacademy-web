import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const RECEIPT_LIFETIME_MS = 20 * 60 * 1000;
const SIGNING_DOMAIN = "payment-proof-receipt:v1:";

type ReceiptPayload = {
  version: 1;
  method: "instapay" | "wallet";
  keyHash: string;
  proofUrl: string;
  issuedAt: number;
  expiresAt: number;
};

export function isTrustedDriveProofUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && (url.hostname === "drive.google.com" || url.hostname === "docs.google.com");
  } catch { return false; }
}

export function createProofReceipt(
  proofUrl: string,
  method: "instapay" | "wallet",
  idempotencyKey: string,
  secret: string,
  now = Date.now(),
) {
  if (secret.length < 32 || !isTrustedDriveProofUrl(proofUrl)) throw new Error("proof_receipt_unavailable");
  const payload: ReceiptPayload = {
    version: 1,
    method,
    keyHash: createHash("sha256").update(idempotencyKey).digest("hex"),
    proofUrl,
    issuedAt: now,
    expiresAt: now + RECEIPT_LIFETIME_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body, secret)}`;
}

export function verifyProofReceipt(
  receipt: unknown,
  method: string,
  idempotencyKey: string,
  secret: string,
  now = Date.now(),
): string | null {
  if (typeof receipt !== "string" || receipt.length > 4096 || secret.length < 32) return null;
  const parts = receipt.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;
  const expected = Buffer.from(signature(parts[0], secret));
  const received = Buffer.from(parts[1]);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload: ReceiptPayload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (payload.version !== 1 || payload.method !== method || !isTrustedDriveProofUrl(payload.proofUrl)
      || payload.keyHash !== createHash("sha256").update(idempotencyKey).digest("hex")
      || !Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.expiresAt)
      || payload.issuedAt > now || payload.expiresAt <= now
      || payload.expiresAt - payload.issuedAt !== RECEIPT_LIFETIME_MS) return null;
    return payload.proofUrl;
  } catch { return null; }
}

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(`${SIGNING_DOMAIN}${body}`).digest("base64url");
}
