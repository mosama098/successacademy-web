"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormAside } from "@/components/form/form-aside";
import { FormField } from "@/components/form/form-field";
import { FormOptions } from "@/components/form/form-options";
import { initialState, type FormErrors, type FormState, type LeadFormProps } from "@/components/form/types";
import { getLeadMetadata, getWhatsAppHref } from "@/lib/utm";
import {
  trackAssessmentTimeSelect,
  trackFormStart,
  trackFormStepChange,
  trackFormSubmit,
  trackWhatsAppClick,
} from "@/lib/tracking";

export function LeadForm({ locale, copy }: LeadFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const started = useRef(false);
  const whatsappHref = useMemo(() => getWhatsAppHref(locale), [locale]);
  const isArabic = locale === "ar";

  function markStarted() {
    if (!started.current) {
      started.current = true;
      trackFormStart({ locale, step: 1 });
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    markStarted();
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));

    if (field === "preferredAssessmentTime" && value) {
      trackAssessmentTimeSelect({ locale, value: String(value) });
    }
  }

  function validateStep(targetStep = step) {
    const nextErrors: FormErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = copy.errors.fullName;
    if (!form.phone.trim()) nextErrors.phone = copy.errors.phone;
    if (!form.learningGoal) nextErrors.learningGoal = copy.errors.learningGoal;

    if (targetStep === 2) {
      if (!form.preferredAssessmentTime) nextErrors.preferredAssessmentTime = copy.errors.preferredAssessmentTime;
      if (!form.consent) nextErrors.consent = copy.errors.consent;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goToStepTwo() {
    if (!validateStep(1)) return;
    setStep(2);
    trackFormStepChange({ locale, step: 2 });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markStarted();
    if (!validateStep(2)) return;
    setStatus("loading");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, metadata: getLeadMetadata(locale) }),
      });

      if (!response.ok) throw new Error("Lead submission failed");

      setStatus("success");
      trackFormSubmit({ locale, goal: form.learningGoal, preferredAssessmentTime: form.preferredAssessmentTime });
      router.push(`/${locale}/thank-you`);
    } catch {
      setStatus("idle");
      setErrors((current) => ({ ...current, submit: copy.errors.submit }));
    }
  }

  return (
    <section id="lead-form" className="scroll-mt-24 bg-gradient-to-b from-[#F8F5FF] to-white px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <FormAside copy={copy} isArabic={isArabic} />
        <form
          onSubmit={submitForm}
          onFocus={markStarted}
          className={`order-1 ${isArabic ? "lg:col-start-1 lg:row-start-1" : ""} rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl shadow-[#391B68]/15 transition-all duration-300 hover:-translate-y-1 hover:border-[#EC911F]/45 lg:order-none lg:p-8`}
          noValidate
        >
          <input type="text" name="company" value={form.company} onChange={(event) => updateField("company", event.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
          <StepTabs copy={copy} step={step} setStep={setStep} validateStep={validateStep} locale={locale} />
          {step === 1 ? (
            <StepOne copy={copy} form={form} errors={errors} updateField={updateField} goToStepTwo={goToStepTwo} />
          ) : (
            <StepTwo
              copy={copy}
              form={form}
              errors={errors}
              status={status}
              whatsappHref={whatsappHref}
              isArabic={isArabic}
              updateField={updateField}
              setStep={setStep}
              locale={locale}
            />
          )}
        </form>
      </div>
    </section>
  );
}

function StepTabs({
  copy,
  step,
  setStep,
  validateStep,
  locale,
}: Pick<LeadFormProps, "copy" | "locale"> & {
  step: number;
  setStep: (step: number) => void;
  validateStep: (targetStep?: number) => boolean;
}) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-2">
      {[copy.stepOne, copy.stepTwo].map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            if (index === 0 || validateStep(1)) {
              setStep(index + 1);
              trackFormStepChange({ locale, step: index + 1 });
            }
          }}
          className={`min-h-[52px] rounded-xl px-4 text-[15px] font-black transition-all duration-300 ${
            step === index + 1 ? "bg-[#391B68] text-white shadow-lg shadow-[#391B68]/20" : "bg-white text-slate-700 hover:bg-[#EC911F]/10 hover:text-[#391B68]"
          }`}
        >
          {index + 1}. {label}
        </button>
      ))}
    </div>
  );
}

function StepOne({
  copy,
  form,
  errors,
  updateField,
  goToStepTwo,
}: Pick<LeadFormProps, "copy"> & {
  form: FormState;
  errors: FormErrors;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  goToStepTwo: () => void;
}) {
  return (
    <div className="grid gap-5">
      <FormField label={copy.labels.fullName} error={errors.fullName} required>
        <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder={copy.placeholders.fullName} className="funnel-input" />
      </FormField>
      <FormField label={copy.labels.phone} error={errors.phone} required>
        <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder={copy.placeholders.phone} className="funnel-input" inputMode="tel" />
      </FormField>
      <FormField label={copy.labels.email}>
        <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder={copy.placeholders.email} className="funnel-input" type="email" />
      </FormField>
      <FormOptions label={copy.labels.learningGoal} options={copy.learningGoalOptions} value={form.learningGoal} error={errors.learningGoal} required onChange={(value) => updateField("learningGoal", value)} />
      <button type="button" onClick={goToStepTwo} className="premium-button premium-button-primary mt-2 h-[56px] w-full">
        <span>{copy.buttons.next}</span>
        <span className="button-arrow">→</span>
      </button>
    </div>
  );
}

function StepTwo({
  copy,
  form,
  errors,
  status,
  whatsappHref,
  isArabic,
  updateField,
  setStep,
  locale,
}: Pick<LeadFormProps, "copy" | "locale"> & {
  form: FormState;
  errors: FormErrors;
  status: "idle" | "loading" | "success";
  whatsappHref: string;
  isArabic: boolean;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setStep: (step: number) => void;
}) {
  return (
    <div className="grid gap-5">
      <FormOptions label={copy.labels.preferredAssessmentTime} options={copy.assessmentTimeOptions} value={form.preferredAssessmentTime} error={errors.preferredAssessmentTime} required onChange={(value) => updateField("preferredAssessmentTime", value)} />
      <FormOptions label={copy.labels.preferredLearningMode} options={copy.learningModeOptions} value={form.preferredLearningMode} onChange={(value) => updateField("preferredLearningMode", value)} />
      <FormOptions label={copy.labels.currentLevel} options={copy.currentLevelOptions} value={form.currentLevel} onChange={(value) => updateField("currentLevel", value)} />
      <FormField label={copy.labels.notes}>
        <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder={copy.placeholders.notes} className="funnel-input min-h-32 resize-none" />
      </FormField>
      <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[15px] font-bold leading-7 text-slate-700 transition-all duration-300 hover:border-[#EC911F]/50 hover:bg-[#EC911F]/10">
        <input type="checkbox" checked={form.consent} onChange={(event) => updateField("consent", event.target.checked)} className="mt-1 h-5 w-5 accent-[#391B68]" />
        <span>{copy.labels.consent}</span>
      </label>
      {errors.consent ? <p className="form-error">{errors.consent}</p> : null}
      {errors.submit ? <SubmitError message={errors.submit} whatsappHref={whatsappHref} isArabic={isArabic} locale={locale} /> : null}
      <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
        <button type="button" onClick={() => setStep(1)} className="h-[56px] rounded-full border border-slate-300 px-6 font-black text-slate-700 transition-all duration-300 hover:border-[#391B68] hover:text-[#391B68]">
          {copy.buttons.back}
        </button>
        <button type="submit" disabled={status === "loading" || status === "success"} className="premium-button premium-button-primary h-[56px] w-full disabled:cursor-not-allowed disabled:opacity-75">
          <span>{status === "loading" ? copy.buttons.loading : status === "success" ? copy.buttons.success : copy.buttons.submit}</span>
          <span className="button-arrow">{status === "loading" ? "..." : "→"}</span>
        </button>
      </div>
    </div>
  );
}

function SubmitError({ message, whatsappHref, isArabic, locale }: { message: string; whatsappHref: string; isArabic: boolean; locale: LeadFormProps["locale"] }) {
  return (
    <div className="rounded-2xl border border-[#E32F54]/25 bg-[#E32F54]/8 p-4 text-[15px] font-black leading-7 text-[#9f1d39]">
      {message}{" "}
      <a href={whatsappHref} onClick={() => trackWhatsAppClick({ locale, source: "form_error" })} className="underline">
        {isArabic ? "واتساب" : "WhatsApp"}
      </a>
    </div>
  );
}
