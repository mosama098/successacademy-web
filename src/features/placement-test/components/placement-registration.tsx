"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { trackFormStart, trackFormSubmit, trackPlacementTestEvent } from "@/lib/tracking";
import { getLeadMetadata } from "@/lib/utm";
import { placementCopy } from "../copy";
import type { PlacementLocale } from "../types";

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
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
      <div className="max-w-xl">
        <span className="inline-flex rounded-full bg-[#f1e8fb] px-4 py-2 text-sm font-black text-[#391b68]">English Placement Assessment</span>
        <h1 className="mt-5 text-balance text-[clamp(2.2rem,5vw,4rem)] font-black leading-[1.12] text-[#391b68]">{copy.title}</h1>
        <p className="mt-5 max-w-lg text-[15px] leading-8 text-[#6d5889] sm:text-lg">{copy.description}</p>
        <div className="mt-7 grid gap-3 text-sm font-bold text-[#513477] sm:grid-cols-3">
          {["36 questions", "24–27 min", "English Use · Reading · Listening"].map((item) => (
            <div key={item} className="rounded-2xl border border-[#e3d8f0] bg-white/80 px-4 py-3">{item}</div>
          ))}
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={submit}
        onFocus={trackStartOnce}
        noValidate
        className="rounded-[28px] border border-[#e0d4ef] bg-white p-5 shadow-[0_22px_70px_rgba(57,27,104,0.1)] sm:p-8"
      >
        <div className="grid gap-5">
          <Field label={copy.fullName} name="fullName" error={errors.fullName} required autoComplete="name" />
          <Field label={copy.phone} name="phone" error={errors.phone} required type="tel" inputMode="tel" autoComplete="tel" />
          <Field label={copy.email} name="email" error={errors.email} type="email" inputMode="email" autoComplete="email" />
          <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
            <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${errors.consent ? "border-red-400 bg-red-50" : "border-[#e0d4ef] bg-[#fcfaff]"}`}>
            <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#391b68]" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "placement-consent-error" : undefined} />
            <span>{copy.consent}</span>
          </label>
          {errors.consent ? <p id="placement-consent-error" className="-mt-3 text-sm font-bold text-red-700">{errors.consent}</p> : null}
          {errors.form ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errors.form}</p> : null}
          <button type="submit" disabled={submitting} className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#ec911f] px-6 text-base font-black text-white shadow-[0_14px_30px_rgba(236,145,31,0.24)] transition hover:bg-[#d97f11] disabled:cursor-not-allowed disabled:opacity-65">
            {submitting ? copy.registering : copy.register}
          </button>
        </div>
      </form>
    </section>
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
      <label htmlFor={name} className="mb-2 block text-sm font-black text-[#391b68]">
        {label}{required ? <span className="text-[#ec911f]"> *</span> : null}
      </label>
      <input id={name} name={name} type={type} inputMode={inputMode} autoComplete={autoComplete} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={`h-13 w-full rounded-2xl border bg-white px-4 text-base text-[#281343] outline-none transition placeholder:text-[#9a88ae] focus:border-[#391b68] focus:ring-4 focus:ring-[#391b68]/10 ${error ? "border-red-400" : "border-[#d8c8eb]"}`} />
      {error ? <p id={errorId} className="mt-1.5 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

function isSuccess(value: unknown): value is { ok: true } {
  return typeof value === "object" && value !== null && "ok" in value && value.ok === true;
}
