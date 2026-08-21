"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { trackFormStart, trackFormSubmit, trackPlacementTestEvent } from "@/lib/tracking";
import { getLeadMetadata } from "@/lib/utm";
import { placementCopy } from "../copy";
import type { PlacementLocale } from "../types";
import {
  AssessmentInfoCards,
  ChallengeVisual,
  ExperienceBackdrop,
} from "./placement-experience";

type PlacementRegistrationProps = {
  locale: PlacementLocale;
};

type FormErrors = Partial<Record<"fullName" | "phone" | "email" | "consent" | "form", string>>;

export function PlacementRegistration({ locale }: PlacementRegistrationProps) {
  const copy = placementCopy[locale];
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const startedTracking = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function trackStartOnce() {
    if (startedTracking.current) return;
    startedTracking.current = true;
    trackFormStart({ form: "placement_test", locale });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const consent = form.get("consent") === "on";
    const nextErrors: FormErrors = {};

    if (!fullName) nextErrors.fullName = copy.requiredError;
    if (!normalizeEgyptianMobile(phone)) nextErrors.phone = copy.phoneError;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = copy.emailError;
    if (!consent) nextErrors.consent = copy.requiredError;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "placement_test",
          fullName,
          phone,
          email,
          consent,
          company: String(form.get("company") ?? ""),
          metadata: getLeadMetadata(locale),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !isSuccess(result)) {
        setErrors({ form: response.status === 400 ? copy.formError : copy.serverError });
        return;
      }

      trackFormSubmit({ form: "placement_test", source: "placement_test", locale });
      trackPlacementTestEvent("placement_test_registration_complete", { locale });
      router.replace(`/${locale}/placement-test/assessment`);
    } catch {
      setErrors({ form: copy.serverError });
    } finally {
      setSubmitting(false);
    }
  }

  function focusFirstInvalid(nextErrors: FormErrors) {
    window.setTimeout(() => {
      const first = (["fullName", "phone", "email", "consent"] as const).find((name) => nextErrors[name]);
      formRef.current?.elements.namedItem(first ?? "") instanceof HTMLElement &&
        (formRef.current.elements.namedItem(first ?? "") as HTMLElement).focus();
    });
  }

  return (
    <ExperienceBackdrop className="min-h-[calc(100dvh-4rem)]">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10">
        <div className="motion-safe:animate-[placementPageEnter_.45s_ease-out_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/65 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#5e486a] shadow-sm backdrop-blur"><span className="h-2 w-2 rounded-full bg-[#ec911f]" />{copy.assessmentLabel}</span>
          <h1 className="mt-4 max-w-xl text-balance text-[clamp(2rem,5vw,4rem)] font-black leading-[1.07] tracking-[-0.02em] text-[#291e31] sm:mt-5">{copy.title}</h1>
          <p className="mt-3 max-w-lg text-[14px] font-semibold leading-6 text-[#6f6473] sm:mt-4 sm:text-lg sm:leading-8">{copy.description}</p>
          <div className="mt-4 sm:mt-6"><AssessmentInfoCards locale={locale} /></div>
          <div className="mx-auto mt-1 hidden max-w-[210px] lg:block"><ChallengeVisual label={copy.assessmentLabel} /></div>
        </div>

        <form
          ref={formRef}
          onSubmit={submit}
          onFocus={trackStartOnce}
          noValidate
          className="relative overflow-hidden rounded-[26px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,254,251,0.94),rgba(244,239,243,0.94))] p-4 shadow-[0_30px_80px_rgba(42,28,51,0.14)] backdrop-blur-xl sm:rounded-[30px] sm:p-7 motion-safe:animate-[placementPageEnter_.48s_.08s_ease-out_both]"
        >
          <span className="absolute -end-20 -top-24 h-52 w-52 rounded-full bg-[#7c5295]/12 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="mb-4 flex items-start gap-3 rounded-[18px] bg-[#30223a] p-3.5 text-white shadow-[0_14px_35px_rgba(45,31,55,0.18)] sm:mb-5 sm:p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#ec911f] text-white"><ShieldIcon /></span>
              <div>
                <p className="font-black">{locale === "ar" ? "محاولة آمنة ومحفوظة" : "Secure, saved attempt"}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/60">{copy.autoSaveNote}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={copy.fullName} name="fullName" error={errors.fullName} required autoComplete="name" />
              <Field label={copy.phone} name="phone" error={errors.phone} required type="tel" inputMode="tel" autoComplete="tel" />
              <div className="sm:col-span-2"><Field label={copy.email} name="email" error={errors.email} type="email" inputMode="email" autoComplete="email" /></div>
            </div>
            <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
              <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-[18px] p-4 text-sm font-semibold leading-6 shadow-inner transition focus-within:ring-4 focus-within:ring-[#ec911f]/18 ${errors.consent ? "bg-red-50 text-red-800" : "bg-[#e9e3e9] text-[#58495e]"}`}>
              <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#391b68]" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "placement-consent-error" : undefined} />
              <span>{copy.consent}</span>
            </label>
            {errors.consent ? <p id="placement-consent-error" className="mt-1.5 text-sm font-bold text-red-700">{errors.consent}</p> : null}
            {errors.form ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errors.form}</p> : null}
            <button type="submit" disabled={submitting} className="group mt-4 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-[17px] bg-[#30223a] px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(45,31,55,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3b2947] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/30">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ec911f] transition group-hover:rotate-6"><BoltIcon /></span>
              {submitting ? copy.registering : copy.register}
            </button>
          </div>
        </form>
      </section>
    </ExperienceBackdrop>
  );
}

type FieldProps = {
  label: string;
  name: "fullName" | "phone" | "email";
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete: string;
};

function Field({ label, name, error, required, type = "text", inputMode = "text", autoComplete }: FieldProps) {
  const errorId = `${name}-placement-error`;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-black text-[#3b2946]">
        {label}{required ? <span className="text-[#ec911f]"> *</span> : null}
      </label>
      <input id={name} name={name} type={type} inputMode={inputMode} autoComplete={autoComplete} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={`h-13 w-full rounded-[16px] border bg-white/76 px-4 text-base text-[#281f2d] outline-none shadow-sm transition duration-200 placeholder:text-[#9a8f9d] focus:-translate-y-0.5 focus:border-[#7a568e] focus:bg-white focus:ring-4 focus:ring-[#7a568e]/10 ${error ? "border-red-400" : "border-white"}`} />
      {error ? <p id={errorId} className="mt-1.5 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

function isSuccess(value: unknown): value is { ok: true } {
  return typeof value === "object" && value !== null && "ok" in value && value.ok === true;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
}

function BoltIcon() {
  return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7z" /></svg>;
}
