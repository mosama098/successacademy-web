import "server-only";
import { createRequestLimiter, isSameOrigin, readBody, isObject } from "./request-safety";
import { validateEnrollment } from "../../customers/validation";
import { enrollmentFields } from "../../customers/types";
import { isAttendanceMode } from "../../plans/config";
import { toPublicOrder } from "../types";
import { createOrderAccessToken } from "./order-access";
import { OrderIdempotencyConflictError, OrderValidationError, validateIdempotencyKey, type OrderService } from "./order-service";
import { OrderRepositoryUnavailableError } from "./order-repository";
import type { resolveOrderCustomer } from "./customer-context";
import { LegalConsentRequiredError, LegalPoliciesUnavailableError, requireLegalConsent } from "./legal-consent";
import { PromoRepositoryUnavailableError, PromoValidationError } from "../../promos/promo-repository";
import { verifyProofReceipt } from "./proof-receipt";
import { requiresPaymentProof } from "../validation";
import { buildBookingCreatedEvent, type NotificationEvent } from "./notification-events";

type Dependencies = {
  createService: () => OrderService;
  getSecret: () => string;
  resolveCustomer: typeof resolveOrderCustomer;
  emitNotification?: (event: NotificationEvent) => Promise<void>;
};
const allowedFields = new Set(["locale", "programType", "startLevel", "targetLevel", "packageId", "attendance", "quotedPriceEgp", "customer", "paymentMethod", "proofReceipt", "marketing", "legalConsent", "promoCode", "quotedFinalPriceEgp"]);

export function createOrderHandler(dependencies: Dependencies) {
  const allowRequest = createRequestLimiter();
  return async function POST(request: Request) {
    if (!isSameOrigin(request)) return error("forbidden", 403);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return error("invalid_json", 400);
    }
    if (!allowRequest(request)) return error("rate_limited", 429);

    const body = await readBody(request);
    if (!body || Object.keys(body).some((field) => !allowedFields.has(field))) return error("invalid_request", 400);
    if (!isObject(body.legalConsent) || body.legalConsent.accepted !== true) return error("legal_consent_required", 400);
    if (Object.keys(body.legalConsent).some((key) => key !== "accepted")) return error("invalid_request", 400);
    if (body.promoCode !== undefined && typeof body.promoCode !== "string") return error("promo_invalid", 400);
    if (body.programType !== undefined && typeof body.programType !== "string") return error("invalid_plan", 400);
    if (typeof body.attendance !== "string" || !isAttendanceMode(body.attendance)) return error("invalid_attendance", 400);
    if (!isObject(body.customer) || Object.keys(body.customer).some((field) => !enrollmentFields.some((allowed) => field === allowed))) return error("invalid_customer", 400);
    const contact = validateEnrollment(body.customer, body.attendance);
    if (!contact.valid) return error("invalid_customer", 400, contact.errors);
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    try {
      requireLegalConsent(body.legalConsent);
      validateIdempotencyKey(idempotencyKey);
      // Validate all runtime configuration before any durable write.
      const secret = dependencies.getSecret();
      const method = string(body.paymentMethod);
      const proofLink = requiresPaymentProof(method)
        ? verifyProofReceipt(body.proofReceipt, method, idempotencyKey, secret)
        : null;
      if (requiresPaymentProof(method) ? !proofLink : body.proofReceipt !== undefined && body.proofReceipt !== null) {
        return error("invalid_payment_proof", 400);
      }
      const service = dependencies.createService();
      const { name, phone, email } = contact.details;
      const context = await dependencies.resolveCustomer(request, { name, phone, email }, idempotencyKey, secret);
      if (context.startLevel && context.startLevel !== body.startLevel) return error("invalid_plan", 400);
      if (body.locale !== "ar" && body.locale !== "en") return error("invalid_request", 400);
      const result = await service.createOrder({
        enrollment: contact.details,
        locale: body.locale,
        programType: body.programType === undefined ? undefined : string(body.programType),
        startLevel: string(body.startLevel),
        targetLevel: string(body.targetLevel),
        packageId: string(body.packageId),
        attendance: string(body.attendance),
        paymentMethod: string(body.paymentMethod),
        proofLink,
        quotedPriceEgp: body.quotedPriceEgp as number,
        quotedFinalPriceEgp: body.quotedFinalPriceEgp as number | undefined,
        promoCode: body.promoCode as string | undefined,
        legalConsent: { accepted: true },
        marketing: isObject(body.marketing) ? {
          utm_source: string(body.marketing.utm_source),
          utm_medium: string(body.marketing.utm_medium),
          utm_campaign: string(body.marketing.utm_campaign),
          utm_content: string(body.marketing.utm_content),
          fbclid: string(body.marketing.fbclid),
        } : undefined,
      }, { customer: context.customer, idempotencyKey });
      const notification = buildBookingCreatedEvent(result.order, contact.details);
      try {
        await dependencies.emitNotification?.(notification);
      } catch {
        // Persistence is authoritative. A retry sends the same stable event ID for downstream deduplication.
      }
      return Response.json({
        ok: true,
        created: result.created,
        order: toPublicOrder(result.order),
        orderAccessToken: createOrderAccessToken(result.order.id, secret),
      }, { status: result.created ? 201 : 200, headers: { "Cache-Control": "no-store" } });
    } catch (failure) {
      if (failure instanceof LegalConsentRequiredError) return error("legal_consent_required", 400);
      if (failure instanceof LegalPoliciesUnavailableError) return error("legal_policies_unavailable", 503);
      if (failure instanceof PromoValidationError) return error(failure.code, 400);
      if (failure instanceof PromoRepositoryUnavailableError) return error("promo_service_unavailable", 503);
      if (failure instanceof OrderValidationError) return error(failure.code, 400);
      if (failure instanceof OrderIdempotencyConflictError) return error("idempotency_conflict", 409);
      if (failure instanceof OrderRepositoryUnavailableError) return error("order_storage_unavailable", 503);
      return error("order_creation_failed", 500);
    }
  };
}

function string(value: unknown) { return typeof value === "string" ? value : ""; }
function error(code: string, status: number, fields?: Record<string, string>) {
  return Response.json({ ok: false, error: code, ...(fields ? { fields } : {}) }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}
