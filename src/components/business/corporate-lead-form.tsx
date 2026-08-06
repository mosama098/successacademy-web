"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { BusinessFormContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";
import { normalizeEgyptianMobile } from "@/lib/phone";
import { trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { getLeadMetadata } from "@/lib/utm";

type CorporateFormData = {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  employeeCount: string;
  preferredTrainingMode: string;
  trainingGoal: string;
  notes: string;
  consent: boolean;
  company: string;
};

type FieldName = Exclude<keyof CorporateFormData, "company">;
type FormErrors = Partial<Record<FieldName, string>>;

const initialForm: CorporateFormData = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  employeeCount: "",
  preferredTrainingMode: "",
  trainingGoal: "",
  notes: "",
  consent: false,
  company: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1.5 text-[12.5px] font-bold text-[#B42318]">{message}</p> : null;
}

export function CorporateLeadForm({ locale, copy }: { locale: Locale; copy: BusinessFormContent }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackFormStart({ locale, source: "corporate_training" });
  }

  function setField<K extends keyof CorporateFormData>(field: K, value: CorporateFormData[K]) {
    markStarted();
    setForm((current) => ({ ...current, [field]: value }));
    const validatedField = field as FieldName;
    if (field !== "company" && errors[validatedField]) {
      setErrors((current) => ({ ...current, [validatedField]: undefined }));
    }
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!form.companyName.trim()) nextErrors.companyName = copy.errors.companyName;
    if (!form.contactName.trim()) nextErrors.contactName = copy.errors.contactName;
    if (!normalizeEgyptianMobile(form.phone)) nextErrors.phone = copy.errors.phone;
    if (!emailPattern.test(form.email.trim())) nextErrors.email = copy.errors.email;
    if (!form.employeeCount) nextErrors.employeeCount = copy.errors.employeeCount;
    if (!form.preferredTrainingMode) nextErrors.preferredTrainingMode = copy.errors.preferredTrainingMode;
    if (!form.trainingGoal.trim()) nextErrors.trainingGoal = copy.errors.trainingGoal;
    if (!form.consent) nextErrors.consent = copy.errors.consent;

    return nextErrors;
  }

  function toggleTrainingGoal(label: string) {
    const separator = locale === "ar" ? "، " : ", ";
    const goals = form.trainingGoal
      .split(locale === "ar" ? "،" : ",")
      .map((goal) => goal.trim())
      .filter(Boolean);
    const nextGoals = goals.includes(label)
      ? goals.filter((goal) => goal !== label)
      : [...goals, label];
    setField("trainingGoal", nextGoals.join(separator));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    markStarted();
    const nextErrors = validate();
    setErrors(nextErrors);
    setStatus("idle");

    const firstInvalid = Object.keys(nextErrors)[0] as FieldName | undefined;
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus();
      return;
    }

    const normalizedPhone = normalizeEgyptianMobile(form.phone);
    if (!normalizedPhone) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "corporate_training",
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          phone: normalizedPhone,
          email: form.email.trim(),
          employeeCount: form.employeeCount,
          preferredTrainingMode: form.preferredTrainingMode,
          trainingGoal: form.trainingGoal.trim(),
          notes: form.notes.trim(),
          consent: form.consent,
          company: form.company,
          metadata: getLeadMetadata(locale),
        }),
      });

      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || !isSuccessfulResponse(result)) throw new Error("submission_failed");

      setStatus("success");
      trackFormSubmit({ locale, source: "corporate_training" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div id="corporate-lead-form" className="grid min-h-[280px] scroll-mt-28 place-items-center bg-white p-5 text-center sm:p-7" role="status" aria-live="polite">
        <div className="max-w-[540px]">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#EEE9F4] text-[#391B68]">
            <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="mt-5 text-[27px] font-black leading-[1.4] text-[#391B68] sm:text-[32px]">{copy.success}</h2>
        </div>
      </div>
    );
  }

  const inputClass = "h-[48px] w-full rounded-[12px] border border-[#391B68]/18 bg-white px-3.5 text-[14.5px] font-semibold text-[#391B68] outline-none transition-[border-color,box-shadow] placeholder:text-[#8C8195] focus:border-[#391B68] focus:ring-4 focus:ring-[#391B68]/10 disabled:cursor-not-allowed disabled:opacity-60 lg:h-[42px] lg:rounded-[11px] lg:text-[13.5px]";
  const textareaClass = "w-full resize-y rounded-[12px] border border-[#391B68]/18 bg-white px-3.5 py-2.5 text-[14px] font-semibold leading-[1.55] text-[#391B68] outline-none transition-[border-color,box-shadow] placeholder:text-[#8C8195] focus:border-[#391B68] focus:ring-4 focus:ring-[#391B68]/10 disabled:cursor-not-allowed disabled:opacity-60 lg:rounded-[11px] lg:text-[13.5px]";
  const labelClass = "mb-1.5 block text-[14px] font-black leading-[1.4] text-[#391B68] lg:mb-1 lg:text-[13.5px]";
  const selectedGoals = form.trainingGoal
    .split(locale === "ar" ? "،" : ",")
    .map((goal) => goal.trim());

  return (
    <form
      ref={formRef}
      id="corporate-lead-form"
      onSubmit={handleSubmit}
      noValidate
      className="scroll-mt-28 bg-[#FEFDFE] p-4 sm:p-5 lg:p-[22px]"
    >
      <input
        type="text"
        name="company"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        value={form.company}
        onChange={(event) => setField("company", event.target.value)}
        aria-hidden="true"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:gap-2.5">
        <div>
          <label className={labelClass} htmlFor="corporate-company-name">{copy.labels.companyName} <span className="text-[#B42318]">*</span></label>
          <input
            id="corporate-company-name"
            name="companyName"
            data-field="companyName"
            className={`${inputClass} ${errors.companyName ? "!border-[#B42318]" : ""}`}
            value={form.companyName}
            onChange={(event) => setField("companyName", event.target.value)}
            autoComplete="organization"
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={errors.companyName ? "corporate-company-name-error" : undefined}
            disabled={status === "loading"}
            placeholder={copy.placeholders.companyName}
          />
          <FieldError id="corporate-company-name-error" message={errors.companyName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="corporate-contact-name">{copy.labels.contactName} <span className="text-[#B42318]">*</span></label>
          <input
            id="corporate-contact-name"
            name="contactName"
            data-field="contactName"
            className={`${inputClass} ${errors.contactName ? "!border-[#B42318]" : ""}`}
            value={form.contactName}
            onChange={(event) => setField("contactName", event.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(errors.contactName)}
            aria-describedby={errors.contactName ? "corporate-contact-name-error" : undefined}
            disabled={status === "loading"}
            placeholder={copy.placeholders.contactName}
          />
          <FieldError id="corporate-contact-name-error" message={errors.contactName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="corporate-phone">{copy.labels.phone} <span className="text-[#B42318]">*</span></label>
          <input
            id="corporate-phone"
            name="phone"
            data-field="phone"
            className={`${inputClass} ${errors.phone ? "!border-[#B42318]" : ""}`}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "corporate-phone-error" : undefined}
            disabled={status === "loading"}
            placeholder={copy.placeholders.phone}
          />
          <FieldError id="corporate-phone-error" message={errors.phone} />
        </div>
        <div>
          <label className={labelClass} htmlFor="corporate-email">{copy.labels.email} <span className="text-[#B42318]">*</span></label>
          <input
            id="corporate-email"
            name="email"
            data-field="email"
            className={`${inputClass} ${errors.email ? "!border-[#B42318]" : ""}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "corporate-email-error" : undefined}
            disabled={status === "loading"}
            placeholder={copy.placeholders.email}
          />
          <FieldError id="corporate-email-error" message={errors.email} />
        </div>
      </div>

      <fieldset className="mt-3 border-t border-[#391B68]/10 pt-3">
        <legend className="text-[14px] font-black leading-[1.4] text-[#391B68] lg:text-[13.5px]">{copy.labels.employeeCount} <span className="text-[#B42318]">*</span></legend>
        <div className="mt-2 grid grid-cols-2 gap-2 min-[430px]:grid-cols-3 sm:grid-cols-5 lg:gap-1.5" dir={locale === "ar" ? "rtl" : "ltr"}>
          {copy.employeeCountOptions.map((option) => (
            <label key={option.value} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-[11px] border px-2 text-center text-[13px] font-black transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#EC911F] lg:min-h-[38px] lg:rounded-[10px] lg:text-[12.5px] ${form.employeeCount === option.value ? "border-[#391B68] bg-[#EEE9F4] text-[#391B68] shadow-[inset_0_0_0_1px_rgba(57,27,104,0.16)]" : "border-[#391B68]/16 bg-white text-[#675A70] hover:border-[#391B68]/40"}`}>
              <input
                className="sr-only"
                type="radio"
                name="employeeCount"
                data-field="employeeCount"
                value={option.value}
                checked={form.employeeCount === option.value}
                onChange={() => setField("employeeCount", option.value)}
                aria-invalid={Boolean(errors.employeeCount)}
                aria-describedby={errors.employeeCount ? "corporate-employee-count-error" : undefined}
                disabled={status === "loading"}
              />
              <span className="inline-flex items-center gap-1.5">
                <span className={`grid size-[17px] shrink-0 place-items-center rounded-full border ${form.employeeCount === option.value ? "border-[#391B68] bg-[#391B68] text-white" : "border-[#BFB3CB] text-transparent"}`}><CheckIcon /></span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <FieldError id="corporate-employee-count-error" message={errors.employeeCount} />
      </fieldset>

      <fieldset className="mt-3 border-t border-[#391B68]/10 pt-3">
        <legend className="text-[14px] font-black leading-[1.4] text-[#391B68] lg:text-[13.5px]">{copy.labels.preferredTrainingMode} <span className="text-[#B42318]">*</span></legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:gap-1.5" dir={locale === "ar" ? "rtl" : "ltr"}>
          {copy.trainingModeOptions.map((option) => (
            <label key={option.value} className={`flex min-h-[50px] cursor-pointer items-center justify-center rounded-[11px] border px-2.5 text-center text-[13px] font-black leading-[1.35] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#EC911F] lg:min-h-[40px] lg:rounded-[10px] lg:text-[12.5px] ${form.preferredTrainingMode === option.value ? "border-[#391B68] bg-[#EEE9F4] text-[#391B68] shadow-[inset_0_0_0_1px_rgba(57,27,104,0.16)]" : "border-[#391B68]/16 bg-white text-[#675A70] hover:border-[#391B68]/40"}`}>
              <input
                className="sr-only"
                type="radio"
                name="preferredTrainingMode"
                data-field="preferredTrainingMode"
                value={option.value}
                checked={form.preferredTrainingMode === option.value}
                onChange={() => setField("preferredTrainingMode", option.value)}
                aria-invalid={Boolean(errors.preferredTrainingMode)}
                aria-describedby={errors.preferredTrainingMode ? "corporate-mode-error" : undefined}
                disabled={status === "loading"}
              />
              <span className="inline-flex items-center gap-2">
                <span className={`grid size-[17px] shrink-0 place-items-center rounded-full border ${form.preferredTrainingMode === option.value ? "border-[#391B68] bg-[#391B68] text-white" : "border-[#BFB3CB] text-transparent"}`}><CheckIcon /></span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <FieldError id="corporate-mode-error" message={errors.preferredTrainingMode} />
      </fieldset>

      <div className="mt-3 border-t border-[#391B68]/10 pt-3">
        <label className={labelClass} htmlFor="corporate-training-goal">{copy.labels.trainingGoal} <span className="text-[#B42318]">*</span></label>
        <div className="mb-2.5 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 lg:grid-cols-3 lg:gap-1.5" aria-label={copy.labels.trainingGoal}>
          {copy.trainingGoalOptions.map((option) => {
            const selected = selectedGoals.includes(option.label);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                disabled={status === "loading"}
                onClick={() => toggleTrainingGoal(option.label)}
                className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[11px] border px-2.5 py-1.5 text-start text-[12.5px] font-black leading-[1.35] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-[38px] lg:rounded-[10px] lg:text-[12px] ${selected ? "border-[#391B68] bg-[#EEE9F4] text-[#391B68] shadow-[inset_0_0_0_1px_rgba(57,27,104,0.14)]" : "border-[#391B68]/14 bg-white text-[#675A70] hover:border-[#391B68]/35 hover:text-[#391B68]"}`}
              >
                <span className="text-[12.5px] leading-[1.35] lg:text-[12px]">{option.label}</span>
                <span className={`grid size-[17px] shrink-0 place-items-center rounded-full ${selected ? "bg-[#391B68] text-white" : "bg-[#EEE9F4] text-transparent"}`}><CheckIcon /></span>
              </button>
            );
          })}
        </div>
        <textarea
          id="corporate-training-goal"
          name="trainingGoal"
          data-field="trainingGoal"
          className={`${textareaClass} h-[82px] min-h-[82px] lg:h-[70px] lg:min-h-[70px] ${errors.trainingGoal ? "!border-[#B42318]" : ""}`}
          value={form.trainingGoal}
          onChange={(event) => setField("trainingGoal", event.target.value)}
          aria-invalid={Boolean(errors.trainingGoal)}
          aria-describedby={errors.trainingGoal ? "corporate-goal-error" : undefined}
          disabled={status === "loading"}
          placeholder={copy.placeholders.trainingGoal}
        />
        <FieldError id="corporate-goal-error" message={errors.trainingGoal} />
      </div>

      <div className="mt-3">
        <label className={labelClass} htmlFor="corporate-notes">{copy.labels.notes} <span className="rounded-full bg-[#EEE9F4] px-2 py-0.5 text-[11px] text-[#6B5E76]">{copy.optional}</span></label>
        <textarea
          id="corporate-notes"
          name="notes"
          data-field="notes"
          className={`${textareaClass} h-[68px] min-h-[68px] lg:h-[58px] lg:min-h-[58px]`}
          value={form.notes}
          onChange={(event) => setField("notes", event.target.value)}
          disabled={status === "loading"}
          placeholder={copy.placeholders.notes}
        />
      </div>

      <div className="mt-3 border-t border-[#391B68]/10 pt-3">
        <div className={`flex items-start gap-2.5 rounded-[12px] border p-3 text-[13px] font-bold leading-[1.52] text-[#5E5268] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#EC911F] lg:p-2.5 lg:text-[12.5px] ${errors.consent ? "border-[#B42318]" : "border-[#391B68]/14 bg-white"}`}>
          <input
            id="corporate-consent"
            type="checkbox"
            name="consent"
            data-field="consent"
            className="mt-0.5 size-[18px] shrink-0 accent-[#391B68]"
            checked={form.consent}
            onChange={(event) => setField("consent", event.target.checked)}
            aria-labelledby="corporate-consent-text"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "corporate-consent-error" : undefined}
            disabled={status === "loading"}
          />
          <p id="corporate-consent-text">
            <label className="cursor-pointer" htmlFor="corporate-consent">{copy.labels.consent}</label>{" "}
            <Link href={`/${locale}/legal#privacy`} className="rounded-sm font-black text-[#391B68] underline decoration-[#EC911F]/55 underline-offset-2 hover:text-[#EC911F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]">
              {copy.privacyLink}
            </Link>
            {copy.labels.consentSuffix}
          </p>
        </div>
        <FieldError id="corporate-consent-error" message={errors.consent} />
      </div>

      {status === "error" ? (
        <div className="mt-3 rounded-[12px] border border-[#B42318]/25 bg-[#FEF3F2] px-3.5 py-2.5 text-[13px] font-bold leading-[1.5] text-[#B42318]" role="alert">
          {copy.failure}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-3 flex min-h-[50px] w-full items-center justify-center rounded-[13px] bg-[#EC911F] px-5 text-[15.5px] font-black text-white shadow-[0_8px_18px_rgba(236,145,31,0.2)] transition-colors hover:bg-[#D98113] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#391B68] disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-[46px] lg:text-[15px]"
      >
        {status === "loading" ? copy.loading : copy.submit}
      </button>
      <p className="mt-1.5 text-center text-[12px] font-semibold leading-[1.5] text-[#786C81]">{copy.reassurance}</p>
    </form>
  );
}

function isSuccessfulResponse(value: unknown): value is { ok: true } {
  return typeof value === "object" && value !== null && "ok" in value && value.ok === true;
}
