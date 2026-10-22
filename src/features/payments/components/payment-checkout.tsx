"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { getLeadMetadata } from "@/lib/utm";
import type { AttendanceMode, PaymentMethodId, PlanRecommendation } from "../../plans/config";
import { plansCopy } from "../../plans/copy";
import { paymentCopy } from "../copy";
import { trackPaymentPreparation } from "../tracking";
import type { LegalPolicyLinks, PublicOrder } from "../types";
import type { PricingSnapshot } from "../../promos/types";
import { manualPaymentConfig } from "../manual-payment-config";
import { paymentMethodPreferences, requiresPaymentProof } from "../validation";
import { validateEnrollment } from "../../customers/validation";
import { enrollmentFields, type EnrollmentForm, type EnrollmentErrors } from "../../customers/types";
import { CustomerEnrollmentFields } from "./customer-enrollment-fields";
import { installmentProviders } from "../installment-providers";

type Props = { locale: Locale; recommendation: PlanRecommendation; attendance: AttendanceMode; legalLinks: LegalPolicyLinks; initialMethod?: ManualPaymentMethod | null };
type ErrorKind = keyof typeof paymentCopy.en.errors;
type ProofError = "required" | "invalid" | "tooLarge" | "upload" | null;
type ManualPaymentMethod = "instapay" | "wallet" | "branch";
const emptyEnrollment: EnrollmentForm = { name: "", phone: "", whatsapp: "", email: "", age: "", notes: "" };
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const proofTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function PaymentCheckout({ locale, recommendation, attendance, legalLinks, initialMethod = null }: Props) {
  const copy = paymentCopy[locale];
  const planCopy = plansCopy[locale];
  const isArabic = locale === "ar";
  const [contact, setContact] = useState<EnrollmentForm>(emptyEnrollment);
  const [method, setMethod] = useState<PaymentMethodId | null>(initialMethod);
  const [fieldErrors, setFieldErrors] = useState<EnrollmentErrors>({});
  const [methodError, setMethodError] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState<ProofError>(null);
  const [copiedPaymentDetail, setCopiedPaymentDetail] = useState<"instapay" | "wallet" | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoPricing, setPromoPricing] = useState<PricingSnapshot | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const applyingPromoRef = useRef(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<"creating" | "initiating" | "redirecting">("creating");
  const submittingRef = useRef(false);
  const idempotencyRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formatter = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG");
  const routeQuery = new URLSearchParams({
    program: recommendation.programType,
    start: recommendation.startLevel, target: recommendation.targetLevel,
    package: recommendation.package.id, attendance,
  });
  const reviewHref = `/${locale}/plans/checkout?${routeQuery}`;
  const finalPrice = promoPricing?.finalPrice ?? recommendation.package.priceEgp;

  useEffect(() => {
    trackPaymentPreparation({ name: "ViewCheckout", packageId: recommendation.package.id });
  }, [recommendation.package.id]);

  function getIdempotencyKey() {
    if (idempotencyRef.current) return idempotencyRef.current;
    // Store only the retry key, never customer data or the order access token.
    const storageKey = `payment-order:${recommendation.startLevel}:${recommendation.targetLevel}:${recommendation.package.id}`;
    let key: string | null = null;
    try { key = window.sessionStorage.getItem(storageKey); } catch { /* In-memory retries still work. */ }
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) key = window.crypto.randomUUID();
    idempotencyRef.current = key;
    try { window.sessionStorage.setItem(storageKey, key); } catch { /* Storage may be disabled. */ }
    return key;
  }

  async function copyPaymentDetail(kind: "instapay" | "wallet", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedPaymentDetail(kind);
    } catch {
      setCopiedPaymentDetail(null);
    }
  }

  async function applyPromo() {
    if (applyingPromoRef.current || submittingRef.current) return;
    applyingPromoRef.current = true;
    setApplyingPromo(true);
    setPromoError(null);
    setPromoPricing(null);
    setError((previous) => previous === "promo" ? null : previous);
    try {
      const response = await fetch("/api/payments/promos/validate", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({ code: promoInput.trim(), packageId: recommendation.package.id }),
      });
      const data = await response.json();
      if (response.ok && data.ok === true && typeof data.pricing?.promoCode === "string"
        && data.pricing.originalPrice === recommendation.package.priceEgp
        && Number.isFinite(data.pricing.discountAmount) && Number.isFinite(data.pricing.finalPrice)) {
        setPromoPricing(data.pricing);
        setPromoInput(data.pricing.promoCode);
      } else { setPromoError(promoErrorMessage(data.error, copy.promo)); }
    } catch { setPromoError(copy.promo.unavailable); }
    finally { applyingPromoRef.current = false; setApplyingPromo(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || applyingPromoRef.current) return;
    const validation = validateEnrollment(contact, attendance);
    const selectedProofError = validateSelectedProof(proofFile, method);
    setFieldErrors(validation.errors);
    setMethodError(!method);
    setConsentError(!consentAccepted);
    setError(null);
    setProofError(selectedProofError);
    if (!validation.valid || !method) {
      const firstField = enrollmentFields.find((field) => validation.errors[field]);
      formRef.current?.querySelector<HTMLInputElement>(firstField ? `[name="${firstField}"]` : '[name="paymentMethod"]')?.focus();
      return;
    }
    if (selectedProofError) { formRef.current?.querySelector<HTMLInputElement>('[name="paymentProof"]')?.focus(); return; }
    if (promoInput.trim() && !promoPricing) { setPromoError(copy.promo.applyFirst); setError("promo"); formRef.current?.querySelector<HTMLInputElement>('[name="promoCode"]')?.focus(); return; }
    if (!legalLinks.trainingTerms) { setError("policies"); return; }
    if (!consentAccepted) { formRef.current?.querySelector<HTMLInputElement>('[name="legalConsent"]')?.focus(); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmissionPhase("creating");
    trackPaymentPreparation({ name: "InitiateCheckout", packageId: recommendation.package.id });
    try {
      const idempotencyKey = getIdempotencyKey();
      let proofReceipt: string | null = null;
      if (requiresPaymentProof(method) && proofFile) {
        const proofForm = new FormData();
        proofForm.set("method", method);
        proofForm.set("file", proofFile);
        const proofResponse = await fetch("/api/payments/proofs", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          credentials: "same-origin",
          signal: AbortSignal.timeout(30_000),
          body: proofForm,
        });
        const proofData = await proofResponse.json();
        if (!proofResponse.ok || proofData.ok !== true || typeof proofData.proofReceipt !== "string") {
          setProofError(proofData.error === "payment_proof_too_large" ? "tooLarge" : "upload");
          setError("proofUpload");
          return;
        }
        proofReceipt = proofData.proofReceipt;
      }
      const metadata = getLeadMetadata(locale);
      const response = await fetch("/api/payments/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        credentials: "same-origin",
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          locale, programType: recommendation.programType, startLevel: recommendation.startLevel, targetLevel: recommendation.targetLevel,
          packageId: recommendation.package.id, attendance,
          quotedPriceEgp: recommendation.package.priceEgp,
          quotedFinalPriceEgp: promoPricing?.finalPrice ?? recommendation.package.priceEgp,
          promoCode: promoPricing?.promoCode ?? undefined,
          legalConsent: { accepted: consentAccepted },
          customer: validation.details, paymentMethod: method, proofReceipt,
          marketing: {
            utm_source: metadata.utm_source, utm_medium: metadata.utm_medium,
            utm_campaign: metadata.utm_campaign, utm_content: metadata.utm_content, fbclid: metadata.fbclid,
          },
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok === true && typeof data.order?.id === "string" && typeof data.created === "boolean"
        && typeof data.orderAccessToken === "string") {
        const order = data.order as PublicOrder;
        const successData = JSON.stringify({ order, accessToken: data.orderAccessToken });
        try { window.sessionStorage.setItem(`payment-success:${order.id}`, successData); } catch { /* Fragment fallback below. */ }
        if (method === "card" || method === "installments") {
          setSubmissionPhase("initiating");
          const provider = method === "card" ? "paytabs" : "easykash";
          const paymentResponse = await fetch(`/api/payments/${provider}/initiate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.orderAccessToken}`,
              "Content-Type": "application/json",
            },
            credentials: "same-origin",
            signal: AbortSignal.timeout(30_000),
            body: JSON.stringify({ orderId: order.id }),
          });
          const paymentData = await paymentResponse.json();
          if (paymentData.error === "promo_reservation_expired") {
            setPromoPricing(null);
            setPromoError(promoErrorMessage(paymentData.error, copy.promo));
            setError("promo");
            return;
          }
          const validRedirect = method === "card"
            ? isPayTabsRedirect(paymentData.redirectUrl)
            : isEasyKashRedirect(paymentData.redirectUrl);
          if (!paymentResponse.ok || typeof paymentData.redirectUrl !== "string" || !validRedirect) {
            setError("payment");
            return;
          }
          setSubmissionPhase("redirecting");
          window.location.assign(paymentData.redirectUrl);
          return;
        }
        const fragment = new URLSearchParams({ access: data.orderAccessToken });
        window.location.assign(`/${locale}/plans/payment/success?order=${encodeURIComponent(order.id)}#${fragment}`);
      } else {
        setError(errorKind(data.error, response.status));
        if (typeof data.error === "string" && data.error.startsWith("promo_")) {
          setPromoPricing(null);
          setPromoError(promoErrorMessage(data.error, copy.promo));
        }
        if (data.error === "price_mismatch" && promoPricing) { setPromoPricing(null); setPromoError(copy.promo.changed); }
      }
    } catch { setError("failed"); }
    finally { setSubmitting(false); submittingRef.current = false; }
  }

  const canSubmit = validateEnrollment(contact, attendance).valid
    && method !== null && consentAccepted && Boolean(legalLinks.trainingTerms)
    && validateSelectedProof(proofFile, method) === null
    && (!promoInput.trim() || promoPricing !== null);

  return (
    <section className="bg-[#f7f3ed] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-[880px]">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black leading-tight text-[#321d43] sm:text-[30px]">{copy.title}</h1>
            <p className="mt-1 text-sm leading-6 text-[#563a64]">{copy.subtitle}</p>
          </div>
          <Link href={reviewHref} className="inline-flex min-h-10 items-center rounded-full text-sm font-bold text-[#563a64] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{copy.back}</Link>
        </header>
        <form ref={formRef} onSubmit={submit} noValidate aria-busy={submitting} className="space-y-3" dir={isArabic ? "rtl" : "ltr"}>
          <section data-payment-section="summary" className="rounded-[22px] border border-[#563a64]/15 bg-[#ece5ee] p-4 text-[#321d43] sm:p-5" aria-labelledby="mini-order-summary">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h2 id="mini-order-summary" className="text-xl font-black sm:text-2xl">{recommendation.package.name[locale]}</h2>
                  <span className="text-sm font-semibold text-[#563a64]">{copy.summaryTitle}</span>
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2"><dt className="text-[#563a64]">{planCopy.program.selectorLabel}</dt><dd className="font-bold">{planCopy.program.options[recommendation.programType]}</dd></div>
                  <div className="flex items-center gap-2"><dt className="text-[#563a64]">{copy.path}</dt><dd className="font-bold" dir="ltr">{recommendation.startLevel} → {recommendation.targetLevel}</dd></div>
                  <div className="flex items-center gap-2"><dt className="text-[#563a64]">{copy.attendance}</dt><dd className="font-bold">{copy.attendanceOptions[attendance]}</dd></div>
                </dl>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold"><span>{recommendation.requiredHours} {copy.hours}</span><span>{recommendation.package.sessions} {copy.sessions}</span><span>{planCopy.program.sessionDuration(recommendation.package.sessionDurationHours)}</span></p>
                <p className="mt-1 text-sm text-[#563a64]">{copy.duration.replace("{weeks}", formatter.format(recommendation.package.estimatedWeeks))}</p>
              </div>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-[#321d43]/15 pt-3 text-sm sm:border-s sm:border-t-0 sm:ps-5 sm:pt-0" aria-live="polite">
                <dt className="text-[#563a64]">{copy.promo.original}</dt><dd className="text-end font-semibold">{formatter.format(promoPricing?.originalPrice ?? recommendation.package.priceEgp)} {copy.currency}</dd>
                <dt className="text-[#563a64]">{copy.promo.discount}</dt><dd className="text-end font-semibold">{formatter.format(promoPricing?.discountAmount ?? 0)} {copy.currency}</dd>
                <dt className="font-bold">{copy.promo.final}</dt><dd className="text-end text-[28px] font-black leading-tight sm:text-[32px]">{formatter.format(promoPricing?.finalPrice ?? recommendation.package.priceEgp)} <span className="text-sm font-bold">{copy.currency}</span></dd>
              </dl>
            </div>
          </section>

          <div className="rounded-[22px] border border-[#321d43]/10 bg-white p-4 shadow-[0_8px_28px_rgba(50,29,67,0.04)] sm:p-5">
            <CustomerEnrollmentFields locale={locale} value={contact} errors={fieldErrors} disabled={submitting}
              onBlur={(field) => { const validation = validateEnrollment(contact, attendance); setFieldErrors((previous) => ({ ...previous, [field]: validation.errors[field] })); }}
              onChange={(field, value) => { setContact((previous) => ({ ...previous, [field]: value })); setFieldErrors((previous) => ({ ...previous, [field]: undefined })); }} />

            <section data-payment-section="promo" className="mt-4 border-t border-[#321d43]/10 pt-3 text-[#321d43]" aria-labelledby="promo-label">
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
                <label id="promo-label" htmlFor="promo-code" className="text-sm font-bold">{copy.promo.title}</label>
                <div className="flex w-full gap-2 sm:w-[360px]">
                  <input id="promo-code" name="promoCode" value={promoInput} maxLength={64} autoComplete="off" autoCapitalize="characters" spellCheck={false} dir="ltr"
                    placeholder={copy.promo.placeholder}
                    disabled={submitting || applyingPromo} aria-describedby={promoError ? "promo-error" : promoInput.trim() && !promoPricing ? "promo-hint" : undefined} aria-invalid={Boolean(promoError)}
                    onChange={(event) => { setPromoInput(event.target.value); setPromoPricing(null); setPromoError(null); }}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void applyPromo(); } }}
                    className="min-h-11 w-full min-w-0 rounded-xl border border-[#321d43]/20 bg-[#fbfafc] px-3 text-base outline-none focus:ring-2 focus:ring-[#563a64]" />
                  <button type="button" disabled={submitting || applyingPromo || !promoInput.trim()} onClick={() => void applyPromo()} className="min-h-11 shrink-0 rounded-xl bg-[#321d43] px-4 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{applyingPromo ? copy.promo.applying : copy.promo.apply}</button>
                </div>
              </div>
              {promoError ? <p id="promo-error" role="alert" className="mt-1 text-sm leading-6 text-red-700">{promoError}</p> : promoInput.trim() && !promoPricing && !applyingPromo ? <p id="promo-hint" className="mt-1 text-sm leading-6 text-[#563a64]">{copy.promo.applyFirst}</p> : null}
              {promoPricing ? <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-sm" aria-live="polite">
                <p className="font-bold">{copy.promo.applied}: <bdi>{promoPricing.promoCode}</bdi></p>
                <button type="button" disabled={submitting || applyingPromo} onClick={() => { setPromoInput(""); setPromoPricing(null); setPromoError(null); }} className="min-h-10 rounded px-1 underline underline-offset-4 focus-visible:outline focus-visible:outline-2">{copy.promo.remove}</button>
                <dl className="grid w-full grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-[#563a64]">{copy.promo.original}</dt><dd className="mt-1 font-semibold">{formatter.format(promoPricing.originalPrice)} {copy.currency}</dd></div>
                  <div><dt className="text-[#563a64]">{copy.promo.discount}</dt><dd className="mt-1 font-semibold">{formatter.format(promoPricing.discountAmount)} {copy.currency}</dd></div>
                  <div><dt className="text-[#563a64]">{copy.promo.final}</dt><dd className="mt-1 font-black">{formatter.format(promoPricing.finalPrice)} {copy.currency}</dd></div>
                </dl>
              </div> : null}
            </section>

            <fieldset data-payment-section="methods" className="mt-4" disabled={submitting} aria-describedby={methodError ? "payment-method-error" : "payment-method-hint"}>
              <legend className="text-lg font-black text-[#321d43]">{copy.methodTitle}</legend>
              <p id="payment-method-hint" className="mt-1 text-sm leading-6 text-[#563a64]">{copy.methodHint}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(0,1fr))]">
                {paymentMethodPreferences.map((id) => (
                  <label key={id} className={`relative flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition focus-within:ring-4 focus-within:ring-[#ec911f]/25 ${id === "card" ? "col-span-2 lg:col-span-1" : ""} ${method === id ? "border-[#563a64] bg-[#ece5ee] shadow-[inset_0_0_0_1px_#563a64]" : "border-[#321d43]/15 bg-white hover:bg-[#f7f3ed]"} ${submitting ? "pointer-events-none opacity-60" : ""}`}>
                    <input type="radio" name="paymentMethod" value={id} checked={method === id} required className="size-4 shrink-0 accent-[#321d43]"
                      onChange={() => { setMethod(id); setMethodError(false); setProofFile(null); setProofError(null); setCopiedPaymentDetail(null); trackPaymentPreparation({ name: "AddPaymentInfo", packageId: recommendation.package.id, method: id }); }} />
                    <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5"><span className="text-sm font-bold leading-6 text-[#321d43]">{copy.methods[id].title}</span>
                      {copy.methods[id].detail ? <span className="text-xs leading-5 text-[#563a64]" dir="ltr">{copy.methods[id].detail}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
              {methodError ? <p id="payment-method-error" role="alert" className="mt-1 text-sm font-semibold text-red-700">{copy.methodRequired}</p> : null}
            </fieldset>

            {method === "card" ? <section data-payment-section="instructions" className="mt-3 rounded-2xl border border-[#563a64]/15 bg-[#ece5ee]/55 p-3 text-[#321d43]" aria-labelledby="payment-instructions">
              <h2 id="payment-instructions" className="text-sm font-black">{copy.instructions.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[#563a64]">{copy.instructions[method]}</p>
            </section> : null}

            {method === "installments" ? <InstallmentProvidersPanel locale={locale} /> : null}

            {method === "instapay" || method === "wallet" || method === "branch" ? <ManualPaymentPanel
              method={method} locale={locale} formattedFinalPrice={formatter.format(finalPrice)} currency={copy.currency}
              copiedPaymentDetail={copiedPaymentDetail} onCopy={copyPaymentDetail} /> : null}

            {requiresPaymentProof(method) ? <section key={method} data-payment-section="proof" className="mt-3" aria-labelledby="payment-proof-label">
              <label id="payment-proof-label" htmlFor="payment-proof" className="mb-1 block text-sm font-bold text-[#321d43]">{copy.proof.label}</label>
              <input id="payment-proof" name="paymentProof" type="file" required accept="image/jpeg,image/png,image/webp"
                aria-invalid={Boolean(proofError)} aria-describedby={proofError ? "payment-proof-error" : "payment-proof-hint"}
                onChange={(event) => { setProofFile(event.target.files?.[0] ?? null); setProofError(null); }}
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#321d43]/20 bg-[#fbfafc] px-3 py-2 text-sm text-[#321d43] file:me-3 file:rounded-full file:border-0 file:bg-[#321d43] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white focus:ring-4 focus:ring-[#ece5ee]" />
              <p id="payment-proof-hint" className="mt-1 text-sm leading-6 text-[#563a64]">{copy.proof.hint}</p>
              {proofFile && !proofError ? <p className="mt-1 break-all text-sm font-semibold text-[#321d43]">{copy.proof.selected} <bdi>{proofFile.name}</bdi></p> : null}
              {proofError ? <p id="payment-proof-error" role="alert" className="mt-1 text-sm font-semibold text-red-700">{copy.proof[proofError]}</p> : null}
            </section> : null}

            <section data-payment-section="security" className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f7f3ed] p-3 text-[#563a64]" aria-labelledby="payment-security">
              <span className="mt-0.5 shrink-0 text-[#321d43]" aria-hidden="true"><LockIcon /></span>
              <div><h2 id="payment-security" className="text-sm font-black text-[#321d43]">{copy.security.title}</h2><p className="mt-1 text-sm leading-6">{method === "card" ? copy.security.cardBody : method === "installments" ? copy.security.installmentsBody : requiresPaymentProof(method) ? copy.security.proofBody : copy.security.body}</p></div>
            </section>

            <div data-payment-section="consent" className="mt-3 flex items-start gap-2.5 text-sm leading-6 text-[#563a64]">
              <input id="legal-consent" name="legalConsent" type="checkbox" required checked={consentAccepted} disabled={submitting || !legalLinks.trainingTerms}
                onChange={(event) => { setConsentAccepted(event.target.checked); setConsentError(false); }} aria-invalid={consentError} aria-describedby={!legalLinks.trainingTerms ? "legal-unavailable" : consentError ? "legal-error" : undefined}
                className="mt-1 size-5 shrink-0 cursor-pointer rounded accent-[#321d43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" />
              <label htmlFor="legal-consent">{copy.legal.prefix}{" "}
                <a href={legalLinks.terms} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">{copy.legal.terms}</a>{" "}{copy.legal.and}{" "}
                <a href={legalLinks.privacy} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">{copy.legal.privacy}</a>{" "}{copy.legal.and}{" "}
                {legalLinks.trainingTerms ? <a href={legalLinks.trainingTerms} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">{copy.legal.training}</a> : <span>{copy.legal.training}</span>}.
              </label>
            </div>
            {!legalLinks.trainingTerms ? <p id="legal-unavailable" role="status" className="mt-2 text-sm leading-6 text-[#563a64]">{copy.legal.unavailable}</p> : consentError ? <p id="legal-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{copy.legal.required}</p> : null}
            {error ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-800">{copy.errors[error]}</p> : null}
            <button data-payment-section="action" type="submit" disabled={!canSubmit || submitting || applyingPromo} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ec911f] px-5 py-3 text-base font-black text-white shadow-[0_8px_20px_rgba(236,145,31,0.16)] transition hover:bg-[#d97f13] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
              {submitting ? <span aria-hidden="true" className="size-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" /> : null}
              {submitting ? (method === "installments" ? copy.installmentSubmission[submissionPhase] : copy.submission[submissionPhase]) : copy.continue}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function InstallmentProvidersPanel({ locale }: { locale: Locale }) {
  const copy = paymentCopy[locale].installments;

  return <section data-payment-section="installment-providers" className="mt-3 rounded-2xl border border-[#563A64]/15 bg-[#ECE5EE]/55 p-3 text-[#321D43] sm:p-4" aria-labelledby="installment-providers-title">
    <h2 id="installment-providers-title" className="text-base font-black leading-6">{copy.title}</h2>
    <p className="mt-1 text-sm leading-6 text-[#563A64]">{copy.helper}</p>
    <div className="mt-3 grid max-w-[620px] grid-cols-2 gap-2 min-[430px]:grid-cols-3 sm:grid-cols-4" data-installment-provider-grid>
      {installmentProviders.map((provider) => <div key={provider.id} data-installment-provider={provider.id}
        className="flex min-h-[82px] min-w-0 flex-col items-center justify-center rounded-xl border border-[#563A64]/12 bg-white px-2 py-2.5 text-center shadow-[0_4px_12px_rgba(50,29,67,0.035)]">
        <div className="flex h-9 w-20 max-w-full items-center justify-center">
          {provider.logoPath ? <Image src={provider.logoPath} alt={`${provider.name} logo`} width={160} height={80}
            className="h-full w-full object-contain" sizes="80px" />
            : <span className="text-sm font-black leading-tight text-[#321D43]">NBE</span>}
        </div>
        <span className="sr-only">{provider.name}</span>
        {provider.id === "nbe" ? <span className="mt-1 text-[10px] font-bold leading-4 text-[#563A64]" dir="ltr">{copy.nbeMonths}</span> : null}
      </div>)}
    </div>
    <p className="mt-2 text-xs font-semibold leading-5 text-[#6B5E76]">{copy.gateway}</p>
  </section>;
}

function ManualPaymentPanel({ method, locale, formattedFinalPrice, currency, copiedPaymentDetail, onCopy }: {
  method: ManualPaymentMethod;
  locale: Locale;
  formattedFinalPrice: string;
  currency: string;
  copiedPaymentDetail: "instapay" | "wallet" | null;
  onCopy: (kind: "instapay" | "wallet", value: string) => Promise<void>;
}) {
  const copy = paymentCopy[locale].manual;
  const isArabic = locale === "ar";
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC911F] focus-visible:ring-offset-2";

  return <section data-payment-section="instructions" data-manual-payment-panel={method} className="mt-3 rounded-2xl border border-[#563A64]/15 bg-[#ECE5EE]/55 p-3 text-[#321D43] sm:p-4">
    <h2 className="text-base font-black leading-6">{copy[method].title}</h2>
    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl bg-white px-3 py-2.5">
      <span className="text-sm font-semibold text-[#563A64]">{copy.amount}</span>
      <strong data-payment-final-price className="text-xl font-black" dir="ltr">{formattedFinalPrice} <span className="text-sm">{currency}</span></strong>
    </div>

    {method === "instapay" ? <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#563A64]">{copy.instapay.address}</p>
        <p className="mt-1 break-all text-base font-black" dir="ltr">{manualPaymentConfig.instapay.address}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void onCopy("instapay", manualPaymentConfig.instapay.address)} aria-label={copy.instapay.copy}
            className={`min-h-10 rounded-full border border-[#563A64]/20 bg-white px-4 text-sm font-bold hover:bg-[#F7F3ED] ${focus}`}>{copy.instapay.copy}</button>
          {copiedPaymentDetail === "instapay" ? <span role="status" className="text-sm font-bold text-[#563A64]">{copy.instapay.copied}</span> : null}
        </div>
        <a href={manualPaymentConfig.instapay.paymentUrl} target="_blank" rel="noopener noreferrer"
          className={`mt-2 inline-flex min-h-10 items-center rounded-full bg-[#321D43] px-4 text-sm font-bold !text-white ${focus}`}>{copy.instapay.open}</a>
        <p className="mt-3 text-sm leading-6 text-[#563A64]">{copy.instapay.guidance}</p>
      </div>
      <a href={manualPaymentConfig.instapay.qrAssetPath} target="_blank" rel="noopener noreferrer" className={`mx-auto block max-w-full rounded-xl bg-white p-2 ${focus}`}>
        <Image src={manualPaymentConfig.instapay.qrAssetPath} alt={copy.instapay.qrAlt} width={514} height={552}
          className="h-auto w-[164px] max-w-full object-contain" sizes="164px" />
      </a>
    </div> : null}

    {method === "wallet" ? <div className="mt-3 min-w-0">
      <p className="text-xs font-bold text-[#563A64]">{copy.wallet.number}</p>
      <p className="mt-1 text-xl font-black" dir="ltr">{manualPaymentConfig.wallet.number}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void onCopy("wallet", manualPaymentConfig.wallet.number)} aria-label={copy.wallet.copy}
          className={`min-h-10 rounded-full border border-[#563A64]/20 bg-white px-4 text-sm font-bold hover:bg-[#F7F3ED] ${focus}`}>{copy.wallet.copy}</button>
        {copiedPaymentDetail === "wallet" ? <span role="status" className="text-sm font-bold text-[#563A64]">{copy.wallet.copied}</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#563A64]">{copy.wallet.guidance}</p>
    </div> : null}

    {method === "branch" ? <div className="mt-3 min-w-0 text-sm leading-6 text-[#563A64]">
      <p className="font-bold text-[#321D43]">{copy.branch.intro}</p>
      <p className="mt-1">{copy.branch.hold.replace("{hours}", String(manualPaymentConfig.branch.reservationHours))}</p>
      <dl className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
        <div className="min-w-0"><dt className="font-bold text-[#321D43]">{copy.branch.address}</dt><dd className="mt-0.5">{manualPaymentConfig.branch.name[locale]}<br />{manualPaymentConfig.branch.address[locale]}</dd></div>
        <div className="min-w-0"><dt className="font-bold text-[#321D43]">{copy.branch.hours}</dt><dd className="mt-0.5">{manualPaymentConfig.branch.workingHours[locale]}<br />{manualPaymentConfig.branch.fridayClosed[locale]}</dd></div>
        <div className="min-w-0 sm:col-span-2"><dt className="font-bold text-[#321D43]">{copy.branch.methods}</dt><dd className="mt-0.5">{manualPaymentConfig.branch.paymentMethods[locale].join(isArabic ? "، " : ", ")}.</dd></div>
      </dl>
      <a href={manualPaymentConfig.branch.mapsUrl} target="_blank" rel="noopener noreferrer"
        className={`mt-3 inline-flex min-h-10 items-center rounded-full bg-[#321D43] px-4 text-sm font-bold !text-white ${focus}`}>{copy.branch.maps}</a>
    </div> : null}
  </section>;
}

function LockIcon() {
  return <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" strokeLinecap="round" /></svg>;
}
function errorKind(code: unknown, status: number): ErrorKind {
  if (code === "invalid_payment_proof") return "proof";
  if (code === "legal_consent_required") return "consent";
  if (code === "legal_policies_unavailable") return "policies";
  if (typeof code === "string" && code.startsWith("promo_")) return "promo";
  if (code === "idempotency_conflict") return "duplicate";
  if (code === "price_mismatch" || code === "invalid_plan" || code === "invalid_attendance") return "plan";
  if (status === 503) return "unavailable";
  if (status === 429) return "limited";
  if (status === 400) return "validation";
  return "failed";
}

function promoErrorMessage(code: unknown, copy: typeof paymentCopy[Locale]["promo"]): string {
  switch (code) {
    case "promo_invalid": return copy.invalid;
    case "promo_inactive": return copy.inactive;
    case "promo_not_started": return copy.notStarted;
    case "promo_expired": return copy.expired;
    case "promo_limit_reached": return copy.limit;
    case "promo_package_ineligible": return copy.package;
    case "promo_changed": return copy.changed;
    case "promo_reservation_expired": return copy.reservationExpired;
    default: return copy.unavailable;
  }
}

function validateSelectedProof(file: File | null, method: PaymentMethodId | null): ProofError {
  if (!requiresPaymentProof(method)) return file ? "invalid" : null;
  if (!file) return "required";
  if (file.size > MAX_PROOF_BYTES) return "tooLarge";
  return file.size > 0 && proofTypes.has(file.type) ? null : "invalid";
}

function isPayTabsRedirect(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "secure-egypt.paytabs.com" || url.hostname.endsWith(".paytabs.com"));
  } catch { return false; }
}

function isEasyKashRedirect(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.toLowerCase() === "easykash.net"
      && !url.port && !url.username && !url.password;
  } catch { return false; }
}
