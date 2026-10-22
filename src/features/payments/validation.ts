import { normalizeEgyptianMobile } from "../../lib/phone";
import { plannedPaymentMethods, type PaymentMethodId } from "../plans/config";

export type CustomerContact = { name: string; phone: string; email: string };
export type CustomerField = keyof CustomerContact;
export type CustomerErrors = Partial<Record<CustomerField, "required" | "invalid">>;

export const paymentMethodPreferences = plannedPaymentMethods.map(({ id }) => id);

export function isPaymentMethodPreference(value: unknown): value is PaymentMethodId {
  return typeof value === "string" && paymentMethodPreferences.some((id) => id === value);
}

export function isManualPaymentMethod(value: unknown): value is "instapay" | "wallet" | "branch" {
  return value === "instapay" || value === "wallet" || value === "branch";
}

export function requiresPaymentProof(value: unknown): value is "instapay" | "wallet" {
  return value === "instapay" || value === "wallet";
}

export function validatePaymentProof(value: unknown, method: unknown):
  | { valid: true; proofLink: string | null }
  | { valid: false } {
  if (value === undefined || value === null || value === "") return { valid: true, proofLink: null };
  if (typeof value !== "string" || value.length > 2048 || /[\u0000-\u0020\u007f]/.test(value.trim())) return { valid: false };
  const link = value.trim();
  if (!link) return { valid: true, proofLink: null };
  if (!requiresPaymentProof(method)) return { valid: false };
  try {
    const url = new URL(link);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || (url.hostname !== "drive.google.com" && url.hostname !== "docs.google.com")) return { valid: false };
    // Store a reference only. Never fetch, inspect or treat this URL as proof of payment.
    return { valid: true, proofLink: url.href };
  } catch { return { valid: false }; }
}

export function validateCustomerContact(value: unknown):
  | { valid: true; contact: CustomerContact; errors: CustomerErrors }
  | { valid: false; errors: CustomerErrors } {
  const input = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = rawPhone.length <= 32 ? normalizeEgyptianMobile(rawPhone) : null;
  const errors: CustomerErrors = {};
  if (!name) errors.name = "required";
  else if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) errors.name = "invalid";
  if (!rawPhone) errors.phone = "required";
  else if (!phone || !/^\+201[0125]\d{8}$/.test(phone)) errors.phone = "invalid";
  if (!email) errors.email = "required";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "invalid";
  if (Object.keys(errors).length || !phone) return { valid: false, errors };
  return { valid: true, contact: { name, phone, email }, errors };
}
