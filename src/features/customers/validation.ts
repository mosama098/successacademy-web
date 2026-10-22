import { normalizeEgyptianMobile } from "../../lib/phone";
import { isAttendanceMode } from "../plans/config";
import { validateCustomerContact } from "../payments/validation";
import { enrollmentFields, MIN_BOOKING_AGE, MAX_BOOKING_AGE, type EnrollmentDetails, type EnrollmentErrors } from "./types";

export function validateEnrollment(value: unknown, attendance: string):
  | { valid: true; details: EnrollmentDetails; errors: EnrollmentErrors }
  | { valid: false; errors: EnrollmentErrors } {
  const input = typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const contact = validateCustomerContact(input);
  const errors: EnrollmentErrors = { ...contact.errors };
  const text = (field: string) => typeof input[field] === "string" ? input[field].trim() : "";
  const rawWhatsapp = text("whatsapp");
  const whatsapp = rawWhatsapp.length <= 32 ? normalizeEgyptianMobile(rawWhatsapp) : null;
  if (!rawWhatsapp) errors.whatsapp = "required";
  else if (!whatsapp || !/^\+201[0125]\d{8}$/.test(whatsapp)) errors.whatsapp = "invalid";
  const ageText = (typeof input.age === "number" ? String(input.age) : text("age"))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0));
  const age = Number(ageText);
  if (input.age == null || (typeof input.age === "string" && !input.age.trim())) errors.age = "required";
  else if (!/^\d{1,3}$/.test(ageText) || !Number.isInteger(age) || age < MIN_BOOKING_AGE || age > MAX_BOOKING_AGE) errors.age = "invalid";
  const notes = text("notes");
  if ((input.notes != null && typeof input.notes !== "string") || notes.length > 1000
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(notes)) errors.notes = "invalid";
  if (!isAttendanceMode(attendance)) errors.name = "invalid";
  if (Object.keys(input).some((field) => !enrollmentFields.some((allowed) => field === allowed))) errors.name = "invalid";
  if (!contact.valid || !whatsapp || Object.keys(errors).length) return { valid: false, errors };
  return { valid: true, errors, details: {
    ...contact.contact, whatsapp, age, notes: notes || null,
  } };
}
