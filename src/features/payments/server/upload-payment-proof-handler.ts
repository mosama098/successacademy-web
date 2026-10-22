import "server-only";
import { createHash } from "node:crypto";
import { isSameOrigin } from "./request-safety";
import type { PaymentProofStorage, PaymentProofUpload } from "./payment-proof-storage";
import { PaymentProofStorageUnavailableError } from "./payment-proof-storage";
import { createProofReceipt } from "./proof-receipt";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 7 * 1024 * 1024;

export function createUploadPaymentProofHandler(createStorage: () => PaymentProofStorage, getSecret: () => string) {
  const attempts = new Map<string, { count: number; expiresAt: number }>();

  return async function POST(request: Request) {
    if (!isSameOrigin(request)) return error("forbidden", 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
      return error("invalid_payment_proof", 400);
    }
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) return error("payment_proof_too_large", 413);
    if (!allowRequest(request, attempts)) return error("rate_limited", 429);

    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    if (!/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) return error("invalid_idempotency_key", 400);

    try {
      const form = await request.formData();
      if ([...form.keys()].some((key) => key !== "file" && key !== "method")) return error("invalid_payment_proof", 400);
      const method = form.get("method");
      const file = form.get("file");
      if ((method !== "instapay" && method !== "wallet") || !(file instanceof File)) {
        return error("invalid_payment_proof", 400);
      }
      if (file.size < 1 || file.size > MAX_FILE_BYTES) return error("payment_proof_too_large", 413);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = detectImageType(bytes);
      if (!type || file.type !== type.mimeType) return error("invalid_payment_proof", 400);
      const receiptSecret = getSecret();
      if (receiptSecret.length < 32) return error("payment_proof_storage_unavailable", 503);
      const fileDigest = createHash("sha256").update(bytes).digest("hex");
      const uploadKeyHash = createHash("sha256").update(`${idempotencyKey}:${method}:${fileDigest}`).digest("hex");
      const upload: PaymentProofUpload = {
        uploadKeyHash,
        fileName: `payment-proof-${uploadKeyHash}.${type.extension}`,
        mimeType: type.mimeType,
        bytes,
      };
      const proof = await createStorage().store(upload);
      const proofReceipt = createProofReceipt(proof.url, method, idempotencyKey, receiptSecret);
      return Response.json({ ok: true, proofReceipt }, {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      });
    } catch (failure) {
      if (failure instanceof PaymentProofStorageUnavailableError || failure instanceof Error && failure.message === "proof_receipt_unavailable") {
        return error("payment_proof_storage_unavailable", 503);
      }
      return error("payment_proof_upload_failed", 500);
    }
  };
}

function detectImageType(bytes: Uint8Array): { mimeType: PaymentProofUpload["mimeType"]; extension: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return null;
}

function allowRequest(request: Request, attempts: Map<string, { count: number; expiresAt: number }>) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expiresAt <= now) attempts.delete(key);
  const source = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const key = createHash("sha256").update(source).digest("hex");
  const bucket = attempts.get(key) ?? { count: 0, expiresAt: now + 60_000 };
  if (bucket.count >= 8 || (!attempts.has(key) && attempts.size >= 2_000)) return false;
  bucket.count += 1;
  attempts.set(key, bucket);
  return true;
}

function error(code: string, status: number) {
  return Response.json({ ok: false, error: code }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
