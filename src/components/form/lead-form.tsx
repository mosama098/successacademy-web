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
  "h-[52px] w-full rounded-[14px] border border-[#d9d0e5] bg-white px-4 text-[15px] font-bold text-[#391B68] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:font-semibold placeholder:text-[#80758e] hover:border-[#391B68]/35 focus:border-[#391B68] focus:ring-4 focus:ring-[#391B68]/10 disabled:cursor-not-allowed disabled:bg-[#f2eef6] disabled:text-[#80758e] lg:h-[46px] lg:rounded-[13px] lg:text-[14.5px]";

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
      className="scroll-mt-24 bg-[#f8f6fb] px-5 pb-[124px] pt-14 sm:px-6 sm:pb-[128px] sm:pt-16 lg:px-8 lg:py-7"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        className={`mx-auto grid max-w-[1160px] overflow-hidden rounded-[26px] border border-[#dcd3e8] bg-[#fffefd] shadow-[0_24px_60px_rgba(57,27,104,0.12)] lg:rounded-[30px] ${
          isArabic
            ? "lg:grid-cols-[minmax(0,0.68fr)_minmax(300px,0.32fr)]"
            : "lg:grid-cols-[minmax(300px,0.32fr)_minmax(0,0.68fr)]"
        }`}
        dir="ltr"
      >
        <TrustPanel
          copy={copy}
          isArabic={isArabic}
          className={isArabic ? "lg:col-start-2" : "lg:col-start-1"}
        />

        <div
          className={`${isArabic ? "lg:col-start-1" : "lg:col-start-2"} min-w-0 bg-[#fffefd] p-5 sm:p-7 lg:row-start-1 lg:px-6 lg:py-4`}
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
              className="grid gap-5 lg:gap-[7px]"
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

              <div className="grid gap-5 sm:grid-cols-2 lg:gap-3">
                <TextField
                  id="lead-full-name"
                  label={copy.labels.fullName}
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

              <TextField
                id="lead-email"
                label={copy.labels.email}
                optional={copy.optional}
                placeholder={copy.placeholders.email}
                value={form.email}
                error={errors.email}
                desktopInlineLabel
                type="email"
                inputMode="email"
                autoComplete="email"
                inputClassName={inputClassName}
                dir="ltr"
                setRef={(element) => setFieldRef("email", element)}
                onBlur={() => markTouched("email")}
                onChange={(event) => updateField("email", event.target.value)}
              />

              <ChoiceGroup
                id="learning-goal"
                name="learningGoal"
                label={copy.labels.learningGoal}
                options={copy.learningGoalOptions}
                value={form.learningGoal}
                error={errors.learningGoal}
                required
                gridClassName="grid-cols-1 min-[390px]:grid-cols-2"
                narrowDesktopLabel
                setFirstRef={(element) =>
                  setFieldRef("learningGoal", element)
                }
                onBlur={() => markTouched("learningGoal")}
                onChange={(value) => updateField("learningGoal", value)}
              />

              <ChoiceGroup
                id="learning-method"
                name="preferredLearningMode"
                label={copy.labels.preferredLearningMode}
                options={copy.learningModeOptions}
                value={form.preferredLearningMode}
                error={errors.preferredLearningMode}
                required
                gridClassName="grid-cols-1 sm:grid-cols-3"
                setFirstRef={(element) =>
                  setFieldRef("preferredLearningMode", element)
                }
                onBlur={() => markTouched("preferredLearningMode")}
                onChange={(value) =>
                  updateField("preferredLearningMode", value)
                }
              />

              <ChoiceGroup
                id="assessment-time"
                name="preferredAssessmentTime"
                label={copy.labels.preferredAssessmentTime}
                options={copy.assessmentTimeOptions}
                value={form.preferredAssessmentTime}
                error={errors.preferredAssessmentTime}
                required
                gridClassName="grid-cols-2 sm:grid-cols-3"
                firstOptionClassName="col-span-2 sm:col-span-1"
                setFirstRef={(element) =>
                  setFieldRef("preferredAssessmentTime", element)
                }
                onBlur={() => markTouched("preferredAssessmentTime")}
                onChange={(value) =>
                  updateField("preferredAssessmentTime", value)
                }
              />

              <TextAreaField
                id="lead-notes"
                label={copy.labels.notes}
                optional={copy.optional}
                placeholder={copy.placeholders.notes}
                value={form.notes}
                desktopInlineLabel
                inputClassName={inputClassName}
                setRef={(element) => setFieldRef("notes", element)}
                onBlur={() => markTouched("notes")}
                onChange={(event) => updateField("notes", event.target.value)}
              />

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

              {errors.submit ? (
                <SubmitError
                  copy={copy}
                  locale={locale}
                  whatsappHref={whatsappHref}
                />
              ) : null}

              <div className="grid gap-3 lg:gap-2">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-[16px] bg-[#EC911F] px-6 text-[17px] font-black text-white shadow-[0_14px_28px_rgba(236,145,31,0.28)] outline-none transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-[#d97f10] hover:shadow-[0_17px_34px_rgba(236,145,31,0.34)] active:translate-y-0.5 active:shadow-[0_8px_18px_rgba(236,145,31,0.24)] focus-visible:ring-4 focus-visible:ring-[#391B68]/25 disabled:cursor-not-allowed disabled:opacity-65 lg:h-[50px] lg:rounded-[14px] lg:text-[16px]"
                >
                  <span aria-live="polite">
                    {status === "loading"
                      ? copy.buttons.loading
                      : copy.buttons.submit}
                  </span>
                  <span
                    className="text-xl transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
                <p className="mx-auto max-w-[620px] text-center text-[13.5px] font-bold leading-[1.65] text-[#71667e] sm:text-[14px] lg:text-[13px] lg:leading-[1.55]">
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
      className={`${className} flex h-full flex-col bg-[#391B68] p-6 text-white sm:p-7 lg:row-start-1 lg:justify-between lg:p-8 xl:p-9`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div>
        <span className="inline-flex rounded-full border border-[#EC911F]/35 bg-[#fff7e9] px-4 py-2 text-[13px] font-black text-[#b86200] sm:text-[14px]">
          {copy.badge}
        </span>
        <h2
          className={`mt-5 text-balance text-[30px] font-black leading-[1.2] text-white sm:text-[36px] lg:mt-3.5 lg:leading-[1.2] ${
            isArabic
              ? "lg:text-[32px] xl:text-[34px]"
              : "lg:text-[30px] xl:text-[30px]"
          }`}
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-[15px] font-bold leading-[1.7] text-[#e7dff0] sm:text-[16px] lg:mt-3 lg:text-[14.5px] lg:leading-[1.65]">
          {copy.subtitle}
        </p>
      </div>
      <ul className="mt-6 grid gap-3 lg:mt-0">
        {copy.trustItems.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-t border-white/12 pt-3 text-[14px] font-bold leading-[1.65] text-white sm:text-[15px] lg:gap-2.5 lg:pt-2.5 lg:text-[14px] lg:leading-[1.55]"
          >
            <span
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#EC911F] text-sm font-black text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p
        className="hidden border-t border-white/12 pt-4 text-[13px] font-bold leading-[1.6] text-[#e7dff0] lg:block"
        aria-hidden="true"
      >
        {copy.reassurance}
      </p>
    </aside>
  );
}

function FieldLabel({
  htmlFor,
  children,
  optional,
  required,
  desktopInline,
}: {
  htmlFor?: string;
  children: ReactNode;
  optional?: string;
  required?: boolean;
  desktopInline?: boolean;
}) {
  const content = (
    <>
      <span>{children}</span>
      {required ? (
        <span className="text-[#b4233c]" aria-hidden="true">
          *
        </span>
      ) : null}
      {optional ? (
        <span className="rounded-full bg-[#eee9f4] px-2.5 py-1 text-[11px] font-black text-[#71667e] lg:px-2 lg:py-0.5 lg:text-[10.5px]">
          {optional}
        </span>
      ) : null}
    </>
  );

  const className = `mb-2.5 flex items-center gap-2 text-[15px] font-black leading-6 text-[#391B68] sm:text-[16px] lg:text-[15px] lg:leading-5 ${
    desktopInline ? "lg:mb-0" : "lg:mb-2"
  }`;

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
  optional,
  error,
  required,
  desktopInlineLabel = false,
  inputClassName,
  setRef,
  ...inputProps
}: {
  id: string;
  label: string;
  optional?: string;
  error?: string;
  required?: boolean;
  desktopInlineLabel?: boolean;
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
    <div
      className={
        desktopInlineLabel
          ? "lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-center lg:gap-x-3"
          : undefined
      }
    >
      <FieldLabel
        htmlFor={id}
        optional={optional}
        required={required}
        desktopInline={desktopInlineLabel}
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
          className={`${inputClassName} ${
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
  optional,
  desktopInlineLabel = false,
  inputClassName,
  setRef,
  ...textareaProps
}: {
  id: string;
  label: string;
  optional: string;
  desktopInlineLabel?: boolean;
  inputClassName: string;
  setRef: (element: HTMLTextAreaElement | null) => void;
  value: string;
  placeholder: string;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div
      className={
        desktopInlineLabel
          ? "lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-x-3"
          : undefined
      }
    >
      <FieldLabel
        htmlFor={id}
        optional={optional}
        desktopInline={desktopInlineLabel}
      >
        {label}
      </FieldLabel>
      <div className="min-w-0">
        <textarea
          {...textareaProps}
          ref={setRef}
          id={id}
          name={id}
          className={`${inputClassName} min-h-[96px] resize-y py-4 leading-7 lg:min-h-[80px] lg:py-3 lg:leading-6`}
        />
      </div>
    </div>
  );
}

function ChoiceGroup({
  id,
  name,
  label,
  options,
  value,
  error,
  required,
  gridClassName,
  firstOptionClassName = "",
  narrowDesktopLabel = false,
  setFirstRef,
  onBlur,
  onChange,
}: {
  id: string;
  name: FieldName;
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  error?: string;
  required?: boolean;
  gridClassName: string;
  firstOptionClassName?: string;
  narrowDesktopLabel?: boolean;
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

  return (
    <fieldset
      className={`min-w-0 lg:relative ${
        narrowDesktopLabel ? "lg:ps-[192px]" : "lg:ps-[212px]"
      }`}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
      onBlur={handleBlur}
    >
      <legend
        className={`w-full lg:absolute lg:start-0 lg:top-0 lg:pt-3 ${
          narrowDesktopLabel ? "lg:w-[180px]" : "lg:w-[200px]"
        }`}
      >
        <FieldLabel required={required} desktopInline>
          {label}
        </FieldLabel>
      </legend>
      <div className={`grid gap-2.5 lg:gap-2 ${gridClassName}`}>
        {options.map((option, index) => {
          const selected = value === option.value;
          const optionId = `${id}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={index === 0 ? firstOptionClassName : undefined}
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
                className="peer sr-only"
              />
              <span
                className={`flex min-h-[50px] cursor-pointer items-center justify-between gap-2 rounded-[14px] border px-4 py-2.5 text-start text-[14px] font-black leading-[1.45] outline-none transition-[border-color,background-color,box-shadow,color] duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-[#391B68]/15 sm:text-[15px] lg:min-h-[44px] lg:gap-1.5 lg:rounded-[13px] lg:px-2.5 lg:py-2 lg:text-[13.5px] ${
                  selected
                    ? "border-[#391B68] bg-[#eee9f4] text-[#391B68] shadow-[0_6px_16px_rgba(57,27,104,0.08)]"
                    : error
                      ? "border-[#b4233c]/60 bg-white text-[#554760] hover:border-[#391B68]/45 hover:bg-[#faf8fc]"
                      : "border-[#d9d0e5] bg-white text-[#554760] hover:border-[#391B68]/45 hover:bg-[#faf8fc]"
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[12px] transition-colors lg:h-4 lg:w-4 lg:text-[9px] ${
                    selected
                      ? "bg-[#EC911F] text-white"
                      : "border border-[#c9bdd8] text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  ✓
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
    <div>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-[16px] border bg-[#faf8fc] p-4 text-[14px] font-bold leading-[1.65] text-[#554760] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#391B68]/40 sm:text-[15px] lg:rounded-[13px] lg:p-3 lg:text-[14px] lg:leading-[1.55] ${
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
          className="peer sr-only"
        />
        <span
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border text-sm font-black transition-[border-color,background-color,color,box-shadow] peer-focus-visible:ring-4 peer-focus-visible:ring-[#391B68]/15 lg:h-5 lg:w-5 lg:rounded-md lg:text-xs ${
            checked
              ? "border-[#391B68] bg-[#391B68] text-white"
              : "border-[#a99ab9] bg-white text-transparent"
          }`}
          aria-hidden="true"
        >
          ✓
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
      className="flex min-h-[520px] flex-col items-center justify-center py-6 text-center sm:py-10"
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

