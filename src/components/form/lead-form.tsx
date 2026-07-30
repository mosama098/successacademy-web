"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
} from "react";
import {
  initialState,
  type FormErrors,
  type FormState,
  type LeadFormProps,
} from "@/components/form/types";
import {
  trackAssessmentTimeSelect,
  trackFormStart,
  trackFormSubmit,
  trackWhatsAppClick,
} from "@/lib/tracking";
import { getLeadMetadata, getWhatsAppHref } from "@/lib/utm";

type FieldName = Exclude<keyof FormState, "company">;
type FocusableField = HTMLInputElement | HTMLTextAreaElement;
type FormStatus = "idle" | "loading" | "success";
type FormIconName =
  | "arrow"
  | "check"
  | "clock"
  | "learning"
  | "mail"
  | "message"
  | "phone"
  | "spark"
  | "target"
  | "user"
  | "whatsapp";

const validationOrder: FieldName[] = [
  "fullName",
  "phone",
  "email",
  "learningGoal",
  "preferredLearningMode",
  "preferredAssessmentTime",
  "consent",
];

const inputClassName =
  "scroll-mb-[148px] w-full rounded-[13px] border border-[#d9d0e5] bg-white px-4 text-[15px] font-bold text-[#391B68] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:font-semibold placeholder:text-[#766b82] hover:border-[#391B68]/45 focus:border-[#391B68] focus:ring-4 focus:ring-[#391B68]/12 disabled:cursor-not-allowed disabled:bg-[#f2eef6] disabled:text-[#80758e] lg:rounded-[12px] lg:px-3.5 lg:text-[14px]";

export function LeadForm({ locale, copy }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {},
  );
  const [status, setStatus] = useState<FormStatus>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRefs = useRef<Partial<Record<FieldName, FocusableField>>>({});
  const started = useRef(false);
  const isArabic = locale === "ar";
  const whatsappHref = useMemo(() => getWhatsAppHref(locale), [locale]);
  const learningModeOptions = copy.learningModeOptions.filter(
    (option) => option.value !== "not_sure",
  );
  const assessmentTimeOptions = copy.assessmentTimeOptions.filter((option) =>
    ["earliest", "morning", "evening"].includes(option.value),
  );

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackFormStart({ locale });
  }

  function setFieldRef(field: FieldName, element: FocusableField | null) {
    if (element) fieldRefs.current[field] = element;
  }

  function fieldError(
    field: FieldName,
    value: FormState[FieldName],
  ): string | undefined {
    if (field === "fullName" && !String(value).trim()) {
      return copy.errors.fullName;
    }

    if (field === "phone" && !isValidPhone(String(value))) {
      return copy.errors.phone;
    }

    if (
      field === "email" &&
      String(value).trim() &&
      !isValidEmail(String(value))
    ) {
      return copy.errors.email;
    }

    if (field === "learningGoal" && !value) {
      return copy.errors.learningGoal;
    }

    if (field === "preferredLearningMode" && !value) {
      return copy.errors.preferredLearningMode;
    }

    if (field === "preferredAssessmentTime" && !value) {
      return copy.errors.preferredAssessmentTime;
    }

    if (field === "consent" && value !== true) {
      return copy.errors.consent;
    }

    return undefined;
  }

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    markStarted();
    setForm((current) => ({ ...current, [field]: value }));
    const validatedField: FieldName | undefined =
      field === "company" ? undefined : (field as FieldName);
    setErrors((current) => ({
      ...current,
      [field]:
        validatedField && touched[validatedField]
          ? fieldError(validatedField, value as FormState[FieldName])
          : undefined,
      submit: undefined,
    }));

    if (field === "preferredAssessmentTime" && value) {
      trackAssessmentTimeSelect({ locale, value: String(value) });
    }
  }

  function markTouched(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: fieldError(field, form[field]),
    }));
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    validationOrder.forEach((field) => {
      const error = fieldError(field, form[field]);
      if (error) nextErrors[field] = error;
    });

    setTouched(
      Object.fromEntries(validationOrder.map((field) => [field, true])),
    );
    setErrors(nextErrors);

    const firstInvalid = validationOrder.find((field) => nextErrors[field]);
    if (firstInvalid) {
      requestAnimationFrame(() => fieldRefs.current[firstInvalid]?.focus());
      return false;
    }

    return true;
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markStarted();
    if (status === "loading" || !validateForm()) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, metadata: getLeadMetadata(locale) }),
      });

      if (!response.ok) throw new Error("Lead submission failed");

      setStatus("success");
      trackFormSubmit({
        locale,
        goal: form.learningGoal,
        preferredAssessmentTime: form.preferredAssessmentTime,
      });
    } catch {
      setStatus("idle");
      setErrors((current) => ({
        ...current,
        submit: `${copy.failure.messageLead}${copy.failure.whatsapp}${copy.failure.messageTail}`,
      }));
    }
  }

  function returnToWebsite() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section
      id="lead-form"
      className="scroll-mt-24 bg-[#f8f6fb] px-4 pb-[112px] pt-8 sm:px-6 sm:pb-[124px] sm:pt-11 lg:px-8 lg:py-9"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        className={`mx-auto grid max-w-[1000px] overflow-hidden rounded-[22px] border border-[#dcd3e8] bg-[#fffefd] shadow-[0_20px_48px_rgba(57,27,104,0.1)] sm:rounded-[24px] lg:rounded-[27px] ${
          isArabic
            ? "lg:grid-cols-[minmax(0,0.73fr)_minmax(260px,0.27fr)]"
            : "lg:grid-cols-[minmax(260px,0.27fr)_minmax(0,0.73fr)]"
        }`}
        dir="ltr"
      >
        <TrustPanel
          copy={copy}
          isArabic={isArabic}
          className={isArabic ? "lg:col-start-2" : "lg:col-start-1"}
        />

        <div
          className={`${isArabic ? "lg:col-start-1" : "lg:col-start-2"} min-w-0 bg-[#fffefd] px-3.5 py-4 sm:p-6 lg:row-start-1 lg:px-[22px] lg:py-[19px]`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          {status === "success" ? (
            <SuccessState
              copy={copy}
              isArabic={isArabic}
              locale={locale}
              whatsappHref={whatsappHref}
              onBack={returnToWebsite}
            />
          ) : (
            <form
              ref={formRef}
              onSubmit={submitForm}
              onFocus={markStarted}
              noValidate
              className="min-w-0"
            >
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={(event) =>
                  updateField("company", event.target.value)
                }
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-3">
                <TextField
                  id="lead-full-name"
                  label={copy.labels.fullName}
                  icon="user"
                  placeholder={copy.placeholders.fullName}
                  value={form.fullName}
                  error={errors.fullName}
                  required
                  autoComplete="name"
                  inputClassName={inputClassName}
                  setRef={(element) => setFieldRef("fullName", element)}
                  onBlur={() => markTouched("fullName")}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                />
                <TextField
                  id="lead-phone"
                  label={copy.labels.phone}
                  icon="phone"
                  placeholder={copy.placeholders.phone}
                  value={form.phone}
                  error={errors.phone}
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  inputClassName={inputClassName}
                  dir="ltr"
                  setRef={(element) => setFieldRef("phone", element)}
                  onBlur={() => markTouched("phone")}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                />
              </div>

              <div className="mt-3 sm:mt-4 lg:mt-2.5">
                <TextField
                  id="lead-email"
                  label={copy.labels.email}
                  icon="mail"
                  optional={copy.optional}
                  placeholder={copy.placeholders.email}
                  value={form.email}
                  error={errors.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  inputClassName={inputClassName}
                  dir="ltr"
                  setRef={(element) => setFieldRef("email", element)}
                  onBlur={() => markTouched("email")}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>

              <div className="lg:grid lg:grid-cols-5 lg:gap-x-3">
                <div className="min-w-0 lg:col-span-3 lg:self-start">
                  <ChoiceGroup
                    id="learning-goal"
                    name="learningGoal"
                    label={copy.labels.learningGoal}
                    icon="target"
                    options={copy.learningGoalOptions}
                    value={form.learningGoal}
                    error={errors.learningGoal}
                    required
                    layout="goal"
                    setFirstRef={(element) =>
                      setFieldRef("learningGoal", element)
                    }
                    onBlur={() => markTouched("learningGoal")}
                    onChange={(value) => updateField("learningGoal", value)}
                  />
                </div>

                <div className="min-w-0 lg:col-span-2 lg:self-start">
                  <ChoiceGroup
                    id="learning-method"
                    name="preferredLearningMode"
                    label={copy.labels.preferredLearningMode}
                    icon="learning"
                    options={learningModeOptions}
                    value={form.preferredLearningMode}
                    error={errors.preferredLearningMode}
                    required
                    layout="method"
                    setFirstRef={(element) =>
                      setFieldRef("preferredLearningMode", element)
                    }
                    onBlur={() => markTouched("preferredLearningMode")}
                    onChange={(value) =>
                      updateField("preferredLearningMode", value)
                    }
                  />
                </div>

                <div className="min-w-0 lg:col-span-3 lg:self-start">
                  <ChoiceGroup
                    id="assessment-time"
                    name="preferredAssessmentTime"
                    label={copy.labels.preferredAssessmentTime}
                    icon="clock"
                    options={assessmentTimeOptions}
                    value={form.preferredAssessmentTime}
                    error={errors.preferredAssessmentTime}
                    required
                    layout="time"
                    setFirstRef={(element) =>
                      setFieldRef("preferredAssessmentTime", element)
                    }
                    onBlur={() => markTouched("preferredAssessmentTime")}
                    onChange={(value) =>
                      updateField("preferredAssessmentTime", value)
                    }
                  />
                </div>

                <div className="mt-3 min-w-0 border-t border-[#e5deec] pt-3 sm:mt-4 sm:pt-4 lg:col-span-2 lg:mt-2.5 lg:self-start lg:pt-2.5">
                  <TextAreaField
                    id="lead-notes"
                    label={copy.labels.notes}
                    icon="message"
                    optional={copy.optional}
                    placeholder={copy.placeholders.notes}
                    value={form.notes}
                    inputClassName={inputClassName}
                    setRef={(element) => setFieldRef("notes", element)}
                    onBlur={() => markTouched("notes")}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mt-3 border-t border-[#e5deec] pt-3 sm:mt-4 sm:pt-4 lg:mt-2 lg:pt-2">
                <ConsentField
                  id="lead-consent"
                  label={copy.labels.consent}
                  checked={form.consent}
                  error={errors.consent}
                  setRef={(element) => setFieldRef("consent", element)}
                  onBlur={() => markTouched("consent")}
                  onChange={(event) =>
                    updateField("consent", event.target.checked)
                  }
                />
              </div>

              {errors.submit ? (
                <div className="mt-4">
                  <SubmitError
                    copy={copy}
                    locale={locale}
                    whatsappHref={whatsappHref}
                  />
                </div>
              ) : null}

              <div className="mt-3 border-t border-[#e5deec] pt-3 sm:mt-4 sm:pt-4 lg:mt-2 lg:pt-2">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.08fr_0.92fr]">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="group flex h-[50px] w-full scroll-mb-[148px] items-center justify-center gap-2.5 rounded-[14px] bg-[#EC911F] px-5 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(236,145,31,0.26)] outline-none transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-[#d97f10] hover:shadow-[0_15px_28px_rgba(236,145,31,0.31)] active:translate-y-0.5 active:shadow-[0_7px_16px_rgba(236,145,31,0.22)] focus-visible:ring-4 focus-visible:ring-[#391B68]/25 disabled:cursor-not-allowed disabled:opacity-65 sm:h-[52px] lg:h-[46px] lg:rounded-[13px] lg:text-[15.5px]"
                  >
                    <span aria-live="polite">
                      {status === "loading"
                        ? copy.buttons.loading
                        : copy.buttons.submit}
                    </span>
                    <FormIcon
                      name="arrow"
                      className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    />
                  </button>
                  <a
                    href={whatsappHref}
                    onClick={() =>
                      trackWhatsAppClick({
                        locale,
                        source: "lead_form_secondary",
                      })
                    }
                    className="flex h-[50px] w-full scroll-mb-[148px] items-center justify-center gap-2 rounded-[14px] border border-[#391B68]/40 bg-white px-4 text-center text-[14.5px] font-black leading-[1.4] text-[#391B68] outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-[#391B68] hover:bg-[#eee9f4] active:translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#391B68]/15 sm:h-[52px] lg:h-[44px] lg:rounded-[13px] lg:text-[14px]"
                  >
                    <span className="inline-flex h-[19px] w-[19px] shrink-0 items-center justify-center">
                      <FormIcon
                        name="whatsapp"
                        className="h-full w-full"
                      />
                    </span>
                    {isArabic
                      ? "عندك سؤال؟ تواصل معانا على واتساب"
                      : "Have a Question? Contact Us on WhatsApp"}
                  </a>
                </div>
                <p className="mx-auto mt-1.5 max-w-[620px] text-center text-[12px] font-bold leading-[1.5] text-[#71667e] sm:text-[12.5px] lg:text-[11.5px]">
                  {copy.reassurance}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function TrustPanel({
  copy,
  isArabic,
  className,
}: Pick<LeadFormProps, "copy"> & {
  isArabic: boolean;
  className: string;
}) {
  return (
    <aside
      className={`${className} flex h-full flex-col bg-[#391B68] px-4 py-3.5 text-white sm:p-5 lg:row-start-1 lg:justify-between lg:p-6`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EC911F]/35 bg-[#fff7e9] px-3 py-1.5 text-[12.5px] font-black text-[#a95500] sm:text-[13px]">
          <FormIcon name="spark" className="h-3.5 w-3.5" />
          {copy.badge}
        </span>
        <h2
          className={`mt-4 text-balance font-black leading-[1.2] text-white sm:text-[30px] lg:mt-3.5 lg:leading-[1.2] ${
            isArabic
              ? "text-[27px] sm:text-[30px] lg:text-[32px]"
              : "text-[25px] sm:text-[30px] lg:text-[27px]"
          }`}
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-[13px] font-bold leading-[1.55] text-[#e7dff0] sm:mt-3 sm:text-[14px] sm:leading-[1.6] lg:mt-2.5 lg:text-[13px] lg:leading-[1.55]">
          {copy.subtitle}
        </p>
      </div>
      <ul className="mt-3 grid gap-1.5 sm:mt-4 sm:gap-2 lg:mt-0">
        {copy.trustItems.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 border-t border-white/12 pt-1.5 text-[12.5px] font-bold leading-[1.5] text-white sm:pt-2.5 sm:text-[13.5px] sm:leading-[1.55] lg:pt-2.5 lg:text-[12.5px] lg:leading-[1.45]"
          >
            <span
              className="mt-0.5 grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-white/8 text-[#EC911F] ring-1 ring-white/12 sm:h-8 sm:w-8 sm:rounded-[10px]"
              aria-hidden="true"
            >
              <FormIcon name="check" className="h-[18px] w-[18px]" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p
        className="hidden border-t border-white/12 pt-2.5 text-[12px] font-bold leading-[1.45] text-[#e7dff0] lg:block"
        aria-hidden="true"
      >
        {copy.reassurance}
      </p>
    </aside>
  );
}

function FormIcon({
  name,
  className = "h-4 w-4",
}: {
  name: FormIconName;
  className?: string;
}) {
  if (name === "whatsapp") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path d="M12.04 2a9.84 9.84 0 0 0-8.4 14.96L2 22l5.17-1.61A9.94 9.94 0 0 0 12.04 22C17.53 22 22 17.52 22 12.01S17.53 2 12.04 2Zm5.83 14.1c-.25.71-1.47 1.35-2.03 1.44-.52.08-1.2.12-1.94-.12-.45-.14-1.03-.33-1.77-.65-3.11-1.34-5.14-4.55-5.3-4.76-.15-.21-1.26-1.68-1.26-3.2 0-1.52.8-2.27 1.08-2.58.28-.31.61-.39.82-.39h.59c.19 0 .44-.07.69.53.25.61.85 2.08.93 2.23.08.15.13.33.03.54-.1.21-.15.33-.31.51-.15.18-.32.4-.46.54-.15.15-.3.31-.13.61.18.31.78 1.29 1.67 2.09 1.15 1.02 2.12 1.34 2.42 1.49.3.15.48.13.66-.08.18-.21.77-.9.98-1.21.2-.31.41-.26.69-.15.28.1 1.79.84 2.1.99.31.15.51.23.59.36.08.13.08.74-.18 1.45Z" />
      </svg>
    );
  }

  let paths: ReactNode;

  switch (name) {
    case "arrow":
      paths = (
        <>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </>
      );
      break;
    case "check":
      paths = <path d="m5 12 4 4L19 7" />;
      break;
    case "clock":
      paths = (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      );
      break;
    case "learning":
      paths = (
        <>
          <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" />
          <path d="M8.5 20h7M12 16v4" />
        </>
      );
      break;
    case "mail":
      paths = (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 6 8-6" />
        </>
      );
      break;
    case "message":
      paths = (
        <>
          <path d="M5.5 18.5 3 21l.8-4A8 8 0 1 1 7 19.5" />
          <path d="M8 10h8M8 14h5" />
        </>
      );
      break;
    case "phone":
      paths = (
        <path d="M7.2 3.5 10 7.8 8.3 10a15.3 15.3 0 0 0 5.7 5.7l2.2-1.7 4.3 2.8-.8 3.2c-.2.8-.9 1.4-1.8 1.4C9.5 20.8 3.2 14.5 2.6 6.1c-.1-.9.5-1.6 1.4-1.8l3.2-.8Z" />
      );
      break;
    case "spark":
      paths = (
        <>
          <path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z" />
          <path d="m18.5 13 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
          <path d="m5.5 14 .6 1.5 1.4.5-1.4.6-.6 1.4-.5-1.4-1.5-.6 1.5-.5.5-1.5Z" />
        </>
      );
      break;
    case "target":
      paths = (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" />
        </>
      );
      break;
    case "user":
      paths = (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />
        </>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

function FieldLabel({
  htmlFor,
  children,
  icon,
  optional,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  icon?: FormIconName;
  optional?: string;
  required?: boolean;
}) {
  const content = (
    <>
      {icon ? (
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#f0ebf5] text-[#391B68] sm:h-7 sm:w-7 sm:rounded-lg lg:h-6 lg:w-6 lg:rounded-md"
          aria-hidden="true"
        >
          <FormIcon name={icon} className="h-4 w-4" />
        </span>
      ) : null}
      <span>{children}</span>
      {required ? (
        <span className="text-[#b4233c]" aria-hidden="true">
          *
        </span>
      ) : null}
      {optional ? (
        <span className="shrink-0 rounded-full bg-[#eee9f4] px-2.5 py-1 text-[11px] font-black text-[#71667e] lg:px-2 lg:py-0.5 lg:text-[10.5px]">
          {optional}
        </span>
      ) : null}
    </>
  );

  const className =
    "mb-1.5 flex items-center gap-2 text-[14px] font-black leading-[1.45] text-[#391B68] sm:mb-2 sm:text-[15px] lg:mb-1.5 lg:text-[14px]";

  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {content}
    </label>
  ) : (
    <span className={className}>{content}</span>
  );
}

function TextField({
  id,
  label,
  icon,
  optional,
  error,
  required,
  inputClassName,
  setRef,
  ...inputProps
}: {
  id: string;
  label: string;
  icon?: FormIconName;
  optional?: string;
  error?: string;
  required?: boolean;
  inputClassName: string;
  setRef: (element: HTMLInputElement | null) => void;
  value: string;
  placeholder: string;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
  dir?: "ltr" | "rtl";
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0 scroll-mb-[150px]">
      <FieldLabel
        htmlFor={id}
        icon={icon}
        optional={optional}
        required={required}
      >
        {label}
      </FieldLabel>
      <div className="min-w-0">
        <input
          {...inputProps}
          ref={setRef}
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClassName} h-[48px] sm:h-[50px] lg:h-[42px] ${
            error
              ? "border-[#b4233c] ring-2 ring-[#b4233c]/10 focus:border-[#b4233c] focus:ring-[#b4233c]/15"
              : ""
          }`}
        />
        <FieldError id={errorId} error={error} />
      </div>
    </div>
  );
}

function TextAreaField({
  id,
  label,
  icon,
  optional,
  inputClassName,
  setRef,
  ...textareaProps
}: {
  id: string;
  label: string;
  icon?: FormIconName;
  optional: string;
  inputClassName: string;
  setRef: (element: HTMLTextAreaElement | null) => void;
  value: string;
  placeholder: string;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="min-w-0 scroll-mb-[150px]">
      <FieldLabel htmlFor={id} icon={icon} optional={optional}>
        {label}
      </FieldLabel>
      <div className="min-w-0">
        <textarea
          {...textareaProps}
          ref={setRef}
          id={id}
          name={id}
          className={`${inputClassName} h-[96px] resize-y py-3 leading-7 sm:h-[100px] lg:h-[68px] lg:py-2.5 lg:leading-5`}
        />
      </div>
    </div>
  );
}

function ChoiceGroup({
  id,
  name,
  label,
  icon,
  options,
  value,
  error,
  required,
  layout,
  setFirstRef,
  onBlur,
  onChange,
}: {
  id: string;
  name: FieldName;
  label: string;
  icon: FormIconName;
  options: Array<{ value: string; label: string }>;
  value: string;
  error?: string;
  required?: boolean;
  layout: "goal" | "method" | "time";
  setFirstRef: (element: HTMLInputElement | null) => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;

  function handleBlur(event: FocusEvent<HTMLFieldSetElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    onBlur();
  }

  const gridClassName =
    layout === "goal"
      ? "grid-cols-2"
      : layout === "method"
        ? "grid-cols-2"
        : "grid-cols-2 md:grid-cols-3";
  const desktopOptionClassName =
    layout === "time"
      ? "lg:gap-1.5 lg:px-2 lg:text-[12.5px]"
      : layout === "goal"
        ? "lg:gap-2 lg:px-2.5 lg:py-1 lg:text-[13px]"
        : "lg:gap-2 lg:px-2.5 lg:text-[13px]";

  return (
    <fieldset
      className="mt-3 min-w-0 scroll-mb-[148px] border-t border-[#e5deec] pt-3 sm:mt-4 sm:pt-4 lg:mt-2.5 lg:pt-2.5"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      onBlur={handleBlur}
    >
      <legend className="w-full">
        <FieldLabel icon={icon} required={required}>
          {label}
        </FieldLabel>
      </legend>
      <div
        className={`grid auto-rows-fr items-stretch gap-2 sm:gap-2.5 lg:gap-1.5 ${gridClassName}`}
      >
        {options.map((option, index) => {
          const selected = value === option.value;
          const optionId = `${id}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`h-full min-w-0 ${
                layout === "time"
                  ? index === 0
                    ? "order-3 col-span-2 md:order-none md:col-span-1"
                    : index === 1
                      ? "order-1 md:order-none"
                      : "order-2 md:order-none"
                  : ""
              }`}
            >
              <input
                ref={index === 0 ? setFirstRef : undefined}
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                aria-invalid={Boolean(error)}
                className="peer sr-only scroll-mb-[148px]"
              />
              <span
                className={`flex h-full min-h-[50px] w-full cursor-pointer items-center justify-between gap-2.5 rounded-[13px] border px-3 py-2 text-start text-[14px] font-bold leading-[1.4] outline-none transition-[border-color,background-color,box-shadow,color] duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-[#391B68]/15 sm:min-h-[52px] sm:px-3.5 sm:py-2.5 sm:text-[15px] lg:min-h-[40px] lg:rounded-[12px] lg:py-1.5 ${desktopOptionClassName} ${
                  selected
                    ? "border-[#391B68] bg-[#eee9f4] font-black text-[#391B68] shadow-[inset_0_0_0_1px_rgba(57,27,104,0.14),0_7px_18px_rgba(57,27,104,0.1)]"
                    : error
                      ? "border-[#b4233c]/60 bg-white text-[#554760] hover:border-[#391B68]/45 hover:bg-[#faf8fc]"
                      : "border-[#d9d0e5] bg-white text-[#554760] hover:border-[#391B68]/45 hover:bg-[#faf8fc]"
                }`}
              >
                <span
                  className={`min-w-0 flex-1 text-start ${
                    layout === "time" ? "lg:whitespace-nowrap" : ""
                  }`}
                >
                  {option.label}
                </span>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] transition-colors lg:h-[18px] lg:w-[18px] ${
                    selected
                      ? "bg-[#EC911F] text-white"
                      : "border border-[#c9bdd8] text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  <FormIcon name="check" className="h-3.5 w-3.5" />
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <div>
        <FieldError id={errorId} error={error} />
      </div>
    </fieldset>
  );
}

function ConsentField({
  id,
  label,
  checked,
  error,
  setRef,
  onBlur,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  error?: string;
  setRef: (element: HTMLInputElement | null) => void;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="scroll-mb-[148px]">
      <label
        htmlFor={id}
        className={`flex min-h-[50px] cursor-pointer items-start gap-2.5 rounded-[13px] border bg-[#faf8fc] p-3 text-[13px] font-bold leading-[1.5] text-[#554760] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#391B68]/45 sm:gap-3 sm:p-3.5 sm:text-[14.5px] lg:min-h-[42px] lg:gap-2.5 lg:rounded-[12px] lg:p-2.5 lg:text-[13px] lg:leading-[1.45] ${
          error ? "border-[#b4233c]" : "border-[#d9d0e5]"
        }`}
      >
        <input
          ref={setRef}
          id={id}
          name="consent"
          type="checkbox"
          checked={checked}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="peer sr-only scroll-mb-[148px]"
        />
        <span
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs font-black transition-[border-color,background-color,color,box-shadow] peer-focus-visible:ring-4 peer-focus-visible:ring-[#391B68]/15 lg:h-[18px] lg:w-[18px] ${
            checked
              ? "border-[#391B68] bg-[#391B68] text-white"
              : "border-[#a99ab9] bg-white text-transparent"
          }`}
          aria-hidden="true"
        >
          <FormIcon name="check" className="h-3.5 w-3.5" />
        </span>
        <span>{label}</span>
      </label>
      <FieldError id={errorId} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p
      id={id}
      role="alert"
      className="mt-2 flex items-center gap-2 text-[13px] font-black leading-5 text-[#a61b35]"
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[11px]"
        aria-hidden="true"
      >
        !
      </span>
      {error}
    </p>
  ) : null;
}

function SubmitError({
  copy,
  locale,
  whatsappHref,
}: Pick<LeadFormProps, "copy" | "locale"> & {
  whatsappHref: string;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-[16px] border border-[#b4233c]/35 bg-[#fff4f5] p-4 text-[#86162a]"
    >
      <h3 className="text-[16px] font-black leading-6">
        {copy.failure.title}
      </h3>
      <p className="mt-1 text-[14px] font-bold leading-6">
        {copy.failure.messageLead}
        <a
          href={whatsappHref}
          onClick={() =>
            trackWhatsAppClick({ locale, source: "form_error" })
          }
          className="font-black underline decoration-2 underline-offset-2 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#391B68]"
        >
          {copy.failure.whatsapp}
        </a>
        {copy.failure.messageTail}
      </p>
    </div>
  );
}

function SuccessState({
  copy,
  isArabic,
  locale,
  whatsappHref,
  onBack,
}: Pick<LeadFormProps, "copy" | "locale"> & {
  isArabic: boolean;
  whatsappHref: string;
  onBack: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[420px] flex-col items-center justify-center py-8 text-center lg:min-h-[560px]"
    >
      <span
        className="grid h-16 w-16 place-items-center rounded-[20px] bg-[#eee9f4] text-3xl font-black text-[#EC911F]"
        aria-hidden="true"
      >
        ✓
      </span>
      <h2 className="mt-6 text-[30px] font-black leading-[1.25] text-[#391B68] sm:text-[36px]">
        {copy.success.title}
      </h2>
      <p className="mt-4 max-w-[560px] text-[15px] font-bold leading-[1.75] text-[#71667e] sm:text-[16px]">
        {copy.success.message}
      </p>
      <div className="mt-8 grid w-full max-w-[520px] gap-3 sm:grid-cols-2">
        <a
          href={whatsappHref}
          onClick={() =>
            trackWhatsAppClick({ locale, source: "form_success" })
          }
          className="flex min-h-[54px] items-center justify-center gap-2 rounded-[16px] bg-[#EC911F] px-5 text-[15px] font-black text-white shadow-[0_12px_24px_rgba(236,145,31,0.25)] outline-none transition-[background-color,box-shadow,transform] hover:bg-[#d97f10] active:translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#391B68]/20"
        >
          {copy.success.whatsapp}
          <span
            className={isArabic ? "rotate-180" : undefined}
            aria-hidden="true"
          >
            →
          </span>
        </a>
        <button
          type="button"
          onClick={onBack}
          className="min-h-[54px] rounded-[16px] border border-[#391B68]/25 bg-white px-5 text-[15px] font-black text-[#391B68] outline-none transition-[border-color,background-color,transform] hover:border-[#391B68] hover:bg-[#faf8fc] active:translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#391B68]/15"
        >
          {copy.success.back}
        </button>
      </div>
    </div>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  const normalized = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
