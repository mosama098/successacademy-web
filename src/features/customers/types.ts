import type { AttendanceMode, LearningLevel } from "../plans/config";
import type { OrderMarketing, PaymentStatus } from "../payments/types";

// Input sanity bounds, not course eligibility rules.
export const MIN_BOOKING_AGE = 1;
export const MAX_BOOKING_AGE = 120;
export const enrollmentFields = ["name", "phone", "whatsapp", "email", "age", "notes"] as const;
export type EnrollmentField = typeof enrollmentFields[number];
export type EnrollmentErrors = Partial<Record<EnrollmentField, "required" | "invalid">>;
export type EnrollmentForm = Record<EnrollmentField, string>;
export type EnrollmentDetails = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  age: number;
  notes: string | null;
};

// Booking contact snapshot, not a CRM profile; customerId is not proof of identity.
export type CustomerRecord = Omit<EnrollmentDetails, "age"> & {
  age: number | null; // Null is reserved for historical records that did not collect age.
  customerId: string;
  orderId: string;
  createdAt: string;
  packageName: string;
  startLevel: LearningLevel;
  targetLevel: LearningLevel;
  attendance: AttendanceMode;
  paymentStatus: PaymentStatus;
  source: "existing_lead" | "verified_checkout" | "checkout_contact";
  marketing: OrderMarketing;
};
