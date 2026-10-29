import { normalizeEgyptianMobile } from "@/lib/phone";

export type CheckoutContactPrefill = {
  name: string;
  phone: string;
  email: string;
};

const STORAGE_KEY = "sa_checkout_contact_v1";
const MAX_AGE_MS = 8 * 60 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const unsafeTextPattern = /[\u0000-\u001f\u007f]/;

export function readCheckoutContactPrefill(): CheckoutContactPrefill | null {
  if (typeof window === "undefined") return null;
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
    const record = stored as Record<string, unknown>;
    if (record.version !== 1 || typeof record.savedAt !== "number"
      || !Number.isFinite(record.savedAt) || record.savedAt > Date.now()
      || Date.now() - record.savedAt > MAX_AGE_MS) {
      clearCheckoutContactPrefill();
      return null;
    }
    return sanitizeContact(record.contact);
  } catch {
    return null;
  }
}

export function writeCheckoutContactPrefill(contact: CheckoutContactPrefill): void {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeContact(contact);
  if (!sanitized) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      contact: sanitized,
    }));
  } catch {
    // Checkout remains usable when session storage is unavailable.
  }
}

export function clearCheckoutContactPrefill(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Optional continuity only. */ }
}

function sanitizeContact(value: unknown): CheckoutContactPrefill | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? normalizeEgyptianMobile(input.phone) : null;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (name.length < 2 || name.length > 120 || unsafeTextPattern.test(name)) return null;
  if (!phone || !/^\+201[0125]\d{8}$/.test(phone)) return null;
  if (email.length > 254 || unsafeTextPattern.test(email) || (email && !emailPattern.test(email))) return null;
  return { name, phone, email };
}
