import "server-only";
import type { CustomerRecord } from "./types";
import { validateEnrollment } from "./validation";
import { isAttendanceMode, isLearningLevel } from "../plans/config";
import { CustomerRepositoryUnavailableError, type CustomerRepository } from "./customer-repository";

export class GoogleSheetsCustomerRepository implements CustomerRepository {
  constructor(private readonly options: { webhookUrl: string; webhookSecret: string; fetchImpl?: typeof fetch }) {}

  async getByOrderId(orderId: string): Promise<CustomerRecord | null> {
    if (!this.options.webhookUrl || !this.options.webhookSecret || !/^[A-Za-z0-9_-]{1,128}$/.test(orderId)) throw new CustomerRepositoryUnavailableError();
    try {
      const response = await (this.options.fetchImpl ?? fetch)(this.options.webhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({ secret: this.options.webhookSecret, domain: "payments", action: "get_customer_for_order", payload: { orderId } }),
      });
      if (!response.ok) throw new CustomerRepositoryUnavailableError();
      const result = await response.json();
      if (result?.success !== true || !result.data || !Object.hasOwn(result.data, "customer")) throw new CustomerRepositoryUnavailableError();
      if (result.data.customer === null) return null;
      const record = result.data.customer;
      const { customerId, orderId: storedOrderId, createdAt, packageName, startLevel, targetLevel, attendance, paymentStatus, source, marketing } = record;
      // Older snapshots remain readable without collecting or returning old personal fields.
      const details = { name: record.name, phone: record.phone, whatsapp: record.whatsapp, email: record.email, age: record.age, notes: record.notes ?? null };
      const validation = validateEnrollment(details, attendance);
      const legacyWithoutAge = record.age === undefined && typeof record.governorate === "string"
        && Object.keys(validation.errors).length === 1 && validation.errors.age === "required";
      if (storedOrderId !== orderId || typeof customerId !== "string" || !customerId || !Number.isFinite(Date.parse(createdAt))
        || typeof packageName !== "string" || !isLearningLevel(startLevel) || !isLearningLevel(targetLevel) || !isAttendanceMode(attendance)
        || !["not_started", "waiting_payment", "paid", "failed", "cancelled", "waiting_verification"].includes(paymentStatus)
        || !["existing_lead", "verified_checkout", "checkout_contact"].includes(source)
        || !marketing || !["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"].every((key) => typeof marketing[key] === "string")
        || (!validation.valid && !legacyWithoutAge)) throw new CustomerRepositoryUnavailableError();
      return { ...details, age: validation.valid ? validation.details.age : null, customerId, orderId: storedOrderId, createdAt, packageName, startLevel, targetLevel, attendance, paymentStatus, source, marketing } as CustomerRecord;
    } catch { throw new CustomerRepositoryUnavailableError(); }
  }
}
