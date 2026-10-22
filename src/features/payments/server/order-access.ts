import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function createOrderAccessToken(orderId: string, secret: string) {
  validateSecret(secret);
  return createHmac("sha256", secret).update(`order:${orderId}`).digest("base64url");
}

export function verifyOrderAccessToken(orderId: string, token: string, secret: string) {
  const expected = createOrderAccessToken(orderId, secret);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(token);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function validateSecret(secret: string) {
  if (secret.length < 32) throw new Error("PAYMENTS_ORDER_ACCESS_SECRET is unavailable");
}
