import "server-only";
import { createHash } from "node:crypto";
const MAX_BODY_BYTES = 16 * 1024;

export function createRequestLimiter() {
  const attempts = new Map<string, { count: number; expires: number }>();
  return (request: Request): boolean => {
    const now = Date.now();
    for (const [key, bucket] of attempts) if (bucket.expires <= now) attempts.delete(key);
    const key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local").digest("hex");
    const bucket = attempts.get(key) ?? { count: 0, expires: now + 60_000 };
    if (bucket.count >= 20 || (!attempts.has(key) && attempts.size >= 2000)) return false;
    bucket.count += 1;
    attempts.set(key, bucket);
    return true;
  };
}

export function isSameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const requestUrl = new URL(request.url);
    // Next may canonicalize request.url to localhost during development.
    const requestOrigin = new URL(`${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`).origin;
    const expected = process.env.NODE_ENV === "production" && siteUrl ? new URL(siteUrl).origin : requestOrigin;
    return new URL(origin).origin === expected;
  } catch { return false; }
}

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return isObject(body) ? body : null;
  } catch { return null; }
  finally { reader.releaseLock(); }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
