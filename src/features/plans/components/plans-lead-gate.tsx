"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { normalizeEgyptianMobile } from "@/lib/phone";
import {
  clearLeadSubmissionId,
  getOrCreateLeadSubmissionId,
  submitLead,
} from "@/features/leads/client/lead-submission";
import { trackFormSubmit } from "@/lib/tracking";
import { getLeadMetadata } from "@/lib/utm";
import { plansCopy } from "../copy";

type GateForm = {
  fullName: string;
  phone: string;
  email: string;
  consent: boolean;
  company: string;
};

type GateErrors = Partial<Record<"fullName" | "phone" | "email" | "consent" | "submission", string>>;

const initialForm: GateForm = {
  fullName: "",
  phone: "",
  email: "",
  consent: false,
  company: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const submissionStorageKey = "sa_plans_lead_submission";

export function PlansLeadGate({ locale }: { locale: Locale }) {
  const copy = plansCopy[locale].gate;
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<GateErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const trackedSuccess = useRef(false);
  const submissionInFlight = useRef(false);
  const submissionId = useRef<string | null>(null);

  const getSubmissionId = () => {
    if (submissionId.current) return submissionId.current;
    submissionId.current = getOrCreateLeadSubmissionId(submissionStorageKey);
    return submissionId.current;
  };

  const update = <Key extends keyof GateForm>(key: Key, value: GateForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, submission: undefined }));
  };

  const validate = () => {
    const next: GateErrors = {};
    if (form.fullName.trim().length < 2) next.fullName = copy.errors.fullName;
    if (!normalizeEgyptianMobile(form.phone)) next.phone = copy.errors.phone;
    if (form.email.trim() && !emailPattern.test(form.email.trim())) next.email = copy.errors.email;
    if (!form.consent) next.consent = copy.errors.consent;
    return next;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlight.current || submitting) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setErrors({});

    try {
      const result = await submitLead({
        source: "plans_pricing",
        submissionId: getSubmissionId(),
        fullName: form.fullName.trim(),
        phone: form.phone,
        email: form.email.trim(),
        consent: form.consent,
        company: form.company,
        metadata: getLeadMetadata(locale),
      });
      if (result.kind !== "success") throw new Error(`plans_lead_${result.kind}`);

      if (!trackedSuccess.current) {
        trackedSuccess.current = true;
        trackFormSubmit(
          { form: "plans_pricing", source: "plans_pricing", locale },
          { metaEventId: result.metaLeadEventId },
        );
      }
      clearLeadSubmissionId(submissionStorageKey);
      submissionId.current = null;
      router.refresh();
    } catch {
      submissionInFlight.current = false;
      setErrors({ submission: copy.errors.submission });
      setSubmitting(false);
    }
  };

  const fieldClass = "mt-1.5 h-11 w-full rounded-[7px] border border-[#563A64]/20 bg-[#FFFEFC] px-4 text-[16px] font-semibold text-[#34253E] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#887C8E] hover:border-[#563A64]/35 focus:border-[#EC911F] focus:bg-white focus:ring-2 focus:ring-[#EC911F]/20 sm:h-12";

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-72px)] items-start overflow-hidden bg-[#F7F3ED] px-4 pb-32 pt-3 sm:items-center sm:px-6 sm:py-12 lg:px-8 lg:py-14"
      aria-labelledby="plans-gate-title"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-48 bg-[#ECE5EE]/65" />
        <div className="absolute left-1/2 top-8 w-[1080px] max-w-[118vw] -translate-x-1/2 px-4 sm:top-10 sm:px-8">
          <div className="grid grid-cols-3 gap-3 opacity-75 sm:gap-5 lg:gap-7">
            <PlanSilhouette accent="bg-[#563A64]" />
            <PlanSilhouette accent="bg-[#EC911F]" raised />
            <PlanSilhouette accent="bg-[#321D43]" />
          </div>
        </div>
        <div className="absolute inset-0 bg-[#F7F3ED]/55 backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F7F3ED] via-[#F7F3ED]/90 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[540px]">
        <form
          onSubmit={submit}
          noValidate
          aria-busy={submitting}
          className="rounded-[8px] border border-[#563A64]/16 bg-white/95 p-4 shadow-[0_20px_55px_rgba(50,29,67,0.14)] backdrop-blur-md sm:p-7"
        >
          <div className="mb-4 text-center sm:mb-6">
            <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#EC911F]">{copy.eyebrow}</p>
            <h1 id="plans-gate-title" className="mt-1 text-[27px] font-black leading-[1.2] text-[#321D43] sm:mt-1.5 sm:text-[32px]">
              {copy.title}
            </h1>
            <p className="mx-auto mt-1.5 max-w-[440px] text-[14px] font-semibold leading-[1.45] text-[#563A64] sm:mt-2 sm:text-[15px] sm:leading-6">
              {copy.description}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4">
            <label className="block text-[14px] font-black text-[#34253E] sm:col-span-2" htmlFor="plans-full-name">
              {copy.labels.fullName}
              <input
                id="plans-full-name"
                name="fullName"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "plans-full-name-error" : undefined}
                className={fieldClass}
                placeholder={copy.placeholders.fullName}
              />
              {errors.fullName ? <span id="plans-full-name-error" className="mt-1.5 block text-[13px] font-bold text-red-700">{errors.fullName}</span> : null}
            </label>

            <label className="block text-[14px] font-black text-[#34253E]" htmlFor="plans-phone">
              {copy.labels.phone}
              <input
                id="plans-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "plans-phone-error" : undefined}
                className={`${fieldClass} text-left`}
                placeholder={copy.placeholders.phone}
              />
              {errors.phone ? <span id="plans-phone-error" className="mt-1.5 block text-[13px] font-bold text-red-700">{errors.phone}</span> : null}
            </label>

            <label className="block text-[14px] font-black text-[#34253E]" htmlFor="plans-email">
              <span>{copy.labels.email} <span className="font-semibold text-[#776B80]">({copy.labels.optional})</span></span>
              <input
                id="plans-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "plans-email-error" : undefined}
                className={`${fieldClass} text-left`}
                placeholder={copy.placeholders.email}
              />
              {errors.email ? <span id="plans-email-error" className="mt-1.5 block text-[13px] font-bold text-red-700">{errors.email}</span> : null}
            </label>
          </div>

          <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="plans-company">Company</label>
            <input id="plans-company" name="company" value={form.company} onChange={(event) => update("company", event.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[7px] bg-[#F7F3ED]/75 px-3 py-2 text-[13px] font-semibold leading-5.5 text-[#563A64] sm:mt-4 sm:py-2.5" htmlFor="plans-consent">
            <input
              id="plans-consent"
              name="consent"
              type="checkbox"
              checked={form.consent}
              onChange={(event) => update("consent", event.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "plans-consent-error" : undefined}
              className="mt-1 h-4 w-4 shrink-0 accent-[#EC911F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
            />
            <span>
              {copy.consentPrefix}{" "}
              <Link href={`/${locale}/legal#privacy`} className="font-black text-[#321D43] underline decoration-[#EC911F] underline-offset-4">
                {copy.privacyPolicy}
              </Link>
            </span>
          </label>
          {errors.consent ? <p id="plans-consent-error" className="mt-1.5 text-[13px] font-bold text-red-700">{errors.consent}</p> : null}

          {errors.submission ? <p role="alert" className="mt-3 rounded-[7px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold leading-5 text-red-800">{errors.submission}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-[7px] bg-[#EC911F] px-5 py-3 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(236,145,31,0.22)] transition-[background-color,box-shadow,transform,opacity] hover:-translate-y-0.5 hover:bg-[#D98113] hover:shadow-[0_13px_28px_rgba(236,145,31,0.28)] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#321D43] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70 sm:mt-4 sm:min-h-[52px] motion-reduce:transform-none"
          >
            {submitting ? copy.submitting : copy.submit}
          </button>
          <span className="sr-only" aria-live="polite">{submitting ? copy.submitting : ""}</span>
        </form>
      </div>
    </section>
  );
}

function PlanSilhouette({ accent, raised = false }: { accent: string; raised?: boolean }) {
  return (
    <div className={`min-h-[360px] rounded-[8px] border border-[#563A64]/12 bg-white/80 p-4 shadow-[0_18px_45px_rgba(50,29,67,0.08)] sm:min-h-[430px] sm:p-5 ${raised ? "-translate-y-3" : "translate-y-4"}`}>
      <span className={`block h-1.5 w-12 rounded-full ${accent}`} />
      <div className="mt-5 flex items-center gap-2">
        <span className="size-8 rounded-full bg-[#ECE5EE]" />
        <span className="h-5 w-2/5 rounded-[5px] bg-[#563A64]/14" />
      </div>
      <div className="mt-7 rounded-[7px] bg-[#F7F3ED] p-4">
        <span className="block h-8 w-3/5 rounded-[5px] bg-[#321D43]/12" />
        <span className="mt-3 block h-2.5 w-full rounded-full bg-[#563A64]/10" />
        <span className="mt-2 block h-2.5 w-4/5 rounded-full bg-[#563A64]/10" />
      </div>
      <div className="mt-5 space-y-3">
        <span className="block h-10 rounded-[7px] border border-[#563A64]/10 bg-white" />
        <span className="block h-10 rounded-[7px] border border-[#563A64]/10 bg-white" />
        <span className="block h-10 rounded-[7px] border border-[#563A64]/10 bg-white" />
      </div>
      <span className={`mt-6 block h-11 rounded-[7px] ${accent} opacity-20`} />
    </div>
  );
}
