"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { LandingContent } from "@/content";
import { getLeadMetadata, getWhatsAppHref } from "@/lib/utm";
import {
  trackAssessmentTimeSelect,
  trackFormStart,
  trackFormStepChange,
  trackFormSubmit,
  trackWhatsAppClick,
} from "@/lib/tracking";

type LeadFormProps = {
  locale: Locale;
  copy: LandingContent["form"];
};

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  learningGoal: string;
  currentLevel: string;
  preferredLearningMode: string;
  preferredAssessmentTime: string;
  notes: string;
  consent: boolean;
  company: string;
};

type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

const initialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  learningGoal: "",
  currentLevel: "",
  preferredLearningMode: "",
  preferredAssessmentTime: "",
  notes: "",
  consent: false,
  company: "",
};

export function LeadForm({ locale, copy }: LeadFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const started = useRef(false);
  const whatsappHref = useMemo(() => getWhatsAppHref(locale), [locale]);

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
        body: JSON.stringify({
          ...form,
          metadata: getLeadMetadata(locale),
        }),
      });

      if (!response.ok) {
        throw new Error("Lead submission failed");
      }

      setStatus("success");
      trackFormSubmit({ locale, goal: form.learningGoal, preferredAssessmentTime: form.preferredAssessmentTime });
      router.push(`/${locale}/thank-you`);
    } catch {
      setStatus("idle");
      setErrors((current) => ({ ...current, submit: copy.errors.submit }));
    }
  }

  return (
    <section id="lead-form" className="relative scroll-mt-24 px-5 py-16 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-50 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="flex flex-col justify-center">
          <span className="mb-4 w-fit rounded-full bg-[#391B68]/8 px-4 py-2 text-sm font-black text-[#391B68]">
            {locale === "ar" ? "تسجيل التقييم" : "Assessment registration"}
          </span>
          <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{copy.title}</h2>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">{copy.subtitle}</p>
          <div className="mt-8 grid gap-3 text-sm font-bold text-slate-700">
            <div className="rounded-xl border border-[#391B68]/12 bg-white p-4 shadow-sm">
              {locale === "ar" ? "بياناتك بتوصل لفريق المتابعة فقط." : "Your details go only to the follow-up team."}
            </div>
            <div className="rounded-xl border border-[#EC911F]/20 bg-[#EC911F]/8 p-4 text-[#391B68]">
              {copy.fallback}
            </div>
          </div>
        </div>

        <form
          onSubmit={submitForm}
          onFocus={markStarted}
          className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-[#391B68]/10 transition duration-300 hover:-translate-y-1 hover:border-[#EC911F]/35 hover:shadow-[#391B68]/16 md:p-7"
          noValidate
        >
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="mb-6 grid grid-cols-2 gap-3">
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
                className={`rounded-full px-4 py-3 text-sm font-black transition ${
                  step === index + 1
                    ? "bg-[#391B68] text-white shadow-lg shadow-[#391B68]/20"
                    : "bg-slate-100 text-slate-600 hover:bg-[#391B68]/8 hover:text-[#391B68]"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          {step === 1 ? (
            <div className="grid gap-5">
              <Field label={copy.labels.fullName} error={errors.fullName} required>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder={copy.placeholders.fullName}
                  className="funnel-input"
                />
              </Field>
              <Field label={copy.labels.phone} error={errors.phone} required>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder={copy.placeholders.phone}
                  className="funnel-input"
                  inputMode="tel"
                />
              </Field>
              <Field label={copy.labels.email}>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder={copy.placeholders.email}
                  className="funnel-input"
                  type="email"
                />
              </Field>
              <OptionGroup
                label={copy.labels.learningGoal}
                options={copy.learningGoalOptions}
                value={form.learningGoal}
                error={errors.learningGoal}
                required
                onChange={(value) => updateField("learningGoal", value)}
              />
              <button type="button" onClick={goToStepTwo} className="premium-button premium-button-primary mt-2">
                <span>{copy.buttons.next}</span>
                <span className="button-arrow">→</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              <OptionGroup
                label={copy.labels.preferredAssessmentTime}
                options={copy.assessmentTimeOptions}
                value={form.preferredAssessmentTime}
                error={errors.preferredAssessmentTime}
                required
                onChange={(value) => updateField("preferredAssessmentTime", value)}
              />
              <OptionGroup
                label={copy.labels.preferredLearningMode}
                options={copy.learningModeOptions}
                value={form.preferredLearningMode}
                onChange={(value) => updateField("preferredLearningMode", value)}
              />
              <OptionGroup
                label={copy.labels.currentLevel}
                options={copy.currentLevelOptions}
                value={form.currentLevel}
                onChange={(value) => updateField("currentLevel", value)}
              />
              <Field label={copy.labels.notes}>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder={copy.placeholders.notes}
                  className="funnel-input min-h-28 resize-none"
                />
              </Field>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 transition hover:border-[#EC911F]/40 hover:bg-[#EC911F]/8">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => updateField("consent", event.target.checked)}
                  className="mt-1 h-5 w-5 accent-[#391B68]"
                />
                <span>{copy.labels.consent}</span>
              </label>
              {errors.consent ? <p className="form-error">{errors.consent}</p> : null}
              {errors.submit ? (
                <div className="rounded-xl border border-[#E32F54]/25 bg-[#E32F54]/8 p-4 text-sm font-bold leading-6 text-[#9f1d39]">
                  {errors.submit}{" "}
                  <a
                    href={whatsappHref}
                    onClick={() => trackWhatsAppClick({ locale, source: "form_error" })}
                    className="underline"
                  >
                    {locale === "ar" ? "واتساب" : "WhatsApp"}
                  </a>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full border border-slate-200 px-6 py-3 font-black text-slate-700 transition hover:border-[#391B68] hover:text-[#391B68]"
                >
                  {copy.buttons.back}
                </button>
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="premium-button premium-button-primary disabled:cursor-not-allowed disabled:opacity-75"
                >
                  <span>
                    {status === "loading"
                      ? copy.buttons.loading
                      : status === "success"
                        ? copy.buttons.success
                        : copy.buttons.submit}
                  </span>
                  <span className="button-arrow">{status === "loading" ? "…" : "→"}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-800">
        {label} {required ? <span className="text-[#E32F54]">*</span> : null}
      </span>
      {children}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-black text-slate-800">
        {label} {required ? <span className="text-[#E32F54]">*</span> : null}
      </span>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-4 py-3 text-start text-sm font-bold leading-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#EC911F] hover:shadow-md ${
              value === option.value
                ? "border-[#391B68] bg-[#391B68] text-white shadow-lg shadow-[#391B68]/20"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}
