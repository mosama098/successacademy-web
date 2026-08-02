"use client";

import {
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
import { normalizeEgyptianMobile } from "@/lib/phone";
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
  const whatsappHref = getWhatsAppHref(locale);

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

    if (field === "phone" && !normalizeEgyptianMobile(String(value))) {
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

    const normalizedPhone = normalizeEgyptianMobile(form.phone);
    if (!normalizedPhone) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: normalizedPhone,
          metadata: getLeadMetadata(locale),
        }),
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
                  inputMode="numeric"
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
                    options={copy.learningModeOptions}
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
                    options={copy.assessmentTimeOptions}
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
                    className="group flex h-[50px] w-full scroll-mb-[148px] items-center justify-center gap-2.5 rounded-[14px] bg-[#EC911F] px-5 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(236,145,31,0.26)] outline-none transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-[#d97f10] hover:shadow-[0_15px_28px_rgba(236,145,31,0.31)] activeÛN¼¶‰žËkºwµçHÝ¥‘Ñ ôˆÄàˆ¡•¥¡ÐôˆÄÐˆÉàôˆÈ¸Ôˆ€¼ø(€€€€€€€€€€ñÁ…Ñ ô‰´Ð€Ü€à€Ø€à´Øˆ€¼ø(€€€€€€€€ð¼ø(€€€€€€¤ì(€€€€€‰É•…¬ì(€€€…Í”€‰µ•ÍÍ…”ˆè(€€€€€Á…Ñ¡Ì€ô€ (€€€€€€€€ðø(€€€€€€€€€€ñÁ…Ñ ô‰4Ô¸Ô€Äà¸Ô€Ì€ÈÅ°¸à´Ñà€à€À€Ä€Ä€Ü€Ää¸Ôˆ€¼ø(€€€€€€€€€€ñÁ…Ñ ô‰4à€ÄÁ á4à€ÄÑ Ôˆ€¼ø(€€€€€€€€ð¼ø(€€€€€€¤ì(€€€€€‰É•…¬ì(€€€…Í”€‰Á¡½¹”ˆè(€€€€€Á…Ñ¡Ì€ô€ (€€€€€€€€ñÁ…Ñ ô‰4Ü¸È€Ì¸Ô€ÄÀ€Ü¸à€à¸Ì€ÄÁ„ÄÔ¸Ì€ÄÔ¸Ì€À€À€À€Ô¸Ü€Ô¸Ý°È¸È´Ä¸Ü€Ð¸Ì€È¸à´¸à€Ì¸ÉŒ´¸È¸à´¸ä€Ä¸Ð´Ä¸à€Ä¸Ñä¸Ô€ÈÀ¸à€Ì¸È€ÄÐ¸Ô€È¸Ø€Ø¸ÅŒ´¸Ä´¸ä¸Ô´Ä¸Ø€Ä¸Ð´Ä¸á°Ì¸È´¸áhˆ€¼ø(€€€€€€¤ì(€€€€€‰É•…¬ì(€€€…Í”€‰ÍÁ…É¬ˆè(€€€€€Á…Ñ¡Ì€ô€ (€€€€€€€€ðø(€€€€€€€€€€ñÁ…Ñ ô‰´ÄÈ€Ì€Ä¸È€Ì¸Í0ÄØ¸Ô€Ü¸Õ°´Ì¸Ì€Ä¸É0ÄÈ€ÄÉ°´Ä¸È´Ì¸Ì´Ì¸Ì´Ä¸È€Ì¸Ì´Ä¸É0ÄÈ€Íhˆ€¼ø(€€€€€€€€€€ñÁ…Ñ ô‰´Äà¸Ô€ÄÌ€¸Ü€Ä¸à€Ä¸à¸Ü´Ä¸à¸Ü´¸Ü€Ä¸à´¸Ü´Ä¸à´Ä¸à´¸Ü€Ä¸à´¸Ü¸Ü´Ä¸áhˆ€¼ø(€€€€€€€€€€ñÁ…Ñ ô‰´Ô¸Ô€ÄÐ€¸Ø€Ä¸Ô€Ä¸Ð¸Ô´Ä¸Ð¸Ø´¸Ø€Ä¸Ð´¸Ô´Ä¸Ð´Ä¸Ô´¸Ø€Ä¸Ô´¸Ô¸Ô´Ä¸Õhˆ€¼ø(€€€€€€€€ð¼ø(€€€€€€¤ì(€€€€€‰É•…¬ì(€€€…Í”€‰Ñ…É•Ðˆè(€€€€€Á…Ñ¡Ì€ô€ (€€€€€€€€ðø(€€€€€€€€€€ñ¥É±”àôˆÄÈˆäôˆÄÈˆÈôˆà¸Ôˆ€¼ø(€€€€€€€€€€ñ¥É±”àôˆÄÈˆäôˆÄÈˆÈôˆÐ¸Ôˆ€¼ø(€€€€€€€€€€ñ¥É±”àôˆÄÈˆäôˆÄÈˆÈôˆÄˆ€¼ø(€€€€€€€€ð¼ø(€€€€€€¤ì(€€€€€‰É•…¬ì(€€€…Í”€‰ÕÍ•Èˆè(€€€€€Á…Ñ¡Ì€ô€ (€€€€€€€€ðø(€€€€€€€€€€ñ¥É±”àôˆÄÈˆäôˆàˆÈôˆÌ¸Ôˆ€¼ø(€€€€€€€€€€ñÁ…Ñ ô‰4Ô€ÈÁŒ¸à´Ð€Ì¸Ä´Ø€Ü´ÙÌØ¸È€È€Ü€Øˆ€¼ø(€€€€€€€€ð¼ø(€€€€€€¤ì(€€€€€‰É•…¬ì(€ô((€É•ÑÕÉ¸€ (€€€€ñÍÙœ(€€€€€Ù¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ(€€€€€™¥±°ô‰¹½¹”ˆ(€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÄ¸àˆ(€€€€€ÍÑÉ½­•1¥¹•…Àô‰É½Õ¹ˆ(€€€€€ÍÑÉ½­•1¥¹•©½¥¸ô‰É½Õ¹ˆ(€€€€€±…ÍÍ9…µ”õí±…ÍÍ9…µ•ô(€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€ø(€€€€€íÁ…Ñ¡Íô(€€€€ð½ÍÙœø(€€¤ì)ô()™Õ¹Ñ¥½¸¥•±‘1…‰•°¡ì(€¡Ñµ±½È°(€¡¥±‘É•¸°(€¥½¸°(€½ÁÑ¥½¹…°°(€É•ÅÕ¥É•°)ôèì(€¡Ñµ±½ÈüèÍÑÉ¥¹œì(€¡¥±‘É•¸èI•…Ñ9½‘”ì(€¥½¸üè½Éµ%½¹9…µ”ì(€½ÁÑ¥½¹…°üèÍÑÉ¥¹œì(€É•ÅÕ¥É•üè‰½½±•…¸ì)ô¤ì(€½¹ÍÐ½¹Ñ•¹Ð€ô€ (€€€€ðø(€€€€€í¥½¸€ü€ (€€€€€€€€ñÍÁ…¸(€€€€€€€€€±…ÍÍ9…µ”ô‰É¥ ´ØÜ´ØÍ¡É¥¹¬´ÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µµ‰œµl˜Á•‰˜ÕtÑ•áÐµlŒÌäÅØátÍ´é ´ÜÍ´éÜ´ÜÍ´éÉ½Õ¹‘•µ±œ±œé ´Ø±œéÜ´Ø±œéÉ½Õ¹‘•µµˆ(€€€€€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€€€€€ø(€€€€€€€€€€ñ½Éµ%½¸¹…µ”õí¥½¹ô±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼ø(€€€€€€€€ð½ÍÁ…¸ø(€€€€€€¤€è¹Õ±±ô(€€€€€€ñÍÁ…¸ùí¡¥±‘É•¹ôð½ÍÁ…¸ø(€€€€€íÉ•ÅÕ¥É•€ü€ (€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlˆÐÈÌÍtˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆø(€€€€€€€€€€¨(€€€€€€€€ð½ÍÁ…¸ø(€€€€€€¤€è¹Õ±±ô(€€€€€í½ÁÑ¥½¹…°€ü€ (€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Í¡É¥¹¬´ÀÉ½Õ¹‘•µ™Õ±°‰œµl••”å˜ÑtÁà´È¸ÔÁä´ÄÑ•áÐµlÄÅÁát™½¹Ðµ‰±…¬Ñ•áÐµlŒÜÄØØÝ•t±œéÁà´È±œéÁä´À¸Ô±œéÑ•áÐµlÄÀ¸ÕÁátˆø(€€€€€€€€€í½ÁÑ¥½¹…±ô(€€€€€€€€ð½ÍÁ…¸ø(€€€€€€¤€è¹Õ±±ô(€€€€ð¼ø(€€¤ì((€½¹ÍÐ±…ÍÍ9…µ”€ô(€€€€‰µˆ´Ä¸Ô™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÈÑ•áÐµlÄÑÁát™½¹Ðµ‰±…¬±•…‘¥¹œµlÄ¸ÐÕtÑ•áÐµlŒÌäÅØátÍ´éµˆ´ÈÍ´éÑ•áÐµlÄÕÁát±œéµˆ´Ä¸Ô±œéÑ•áÐµlÄÑÁátˆì((€É•ÑÕÉ¸¡Ñµ±½È€ü€ (€€€€ñ±…‰•°¡Ñµ±½Èõí¡Ñµ±½Éô±…ÍÍ9…µ”õí±…ÍÍ9…µ•ôø(€€€€€í½¹Ñ•¹Ñô(€€€€ð½±…‰•°ø(€€¤€è€ (€€€€ñÍÁ…¸±…ÍÍ9…µ”õí±…ÍÍ9…µ•ôùí½¹Ñ•¹Ñôð½ÍÁ…¸ø(€€¤ì)ô()™Õ¹Ñ¥½¸Q•áÑ¥•±¡ì(€¥°(€±…‰•°°(€¥½¸°(€½ÁÑ¥½¹…°°(€•ÉÉ½È°(€É•ÅÕ¥É•°(€¥¹ÁÕÑ±…ÍÍ9…µ”°(€Í•ÑI•˜°(€€¸¸¹¥¹ÁÕÑAÉ½ÁÌ)ôèì(€¥èÍÑÉ¥¹œì(€±…‰•°èÍÑÉ¥¹œì(€¥½¸üè½Éµ%½¹9…µ”ì(€½ÁÑ¥½¹…°üèÍÑÉ¥¹œì(€•ÉÉ½ÈüèÍÑÉ¥¹œì(€É•ÅÕ¥É•üè‰½½±•…¸ì(€¥¹ÁÕÑ±…ÍÍ9…µ”èÍÑÉ¥¹œì(€Í•ÑI•˜è€¡•±•µ•¹Ðè!Q51%¹ÁÕÑ±•µ•¹Ðð¹Õ±°¤€ôøÙ½¥ì(€Ù…±Õ”èÍÑÉ¥¹œì(€Á±…•¡½±‘•ÈèÍÑÉ¥¹œì(€ÑåÁ”üèÍÑÉ¥¹œì(€¥¹ÁÕÑ5½‘”üè€‰Ñ•áÐˆð€‰Ñ•°ˆð€‰•µ…¥°ˆð€‰¹Õµ•É¥Œˆì(€…ÕÑ½½µÁ±•Ñ”üèÍÑÉ¥¹œì(€‘¥Èüè€‰±ÑÈˆð€‰ÉÑ°ˆì(€½¹	±ÕÈè€ ¤€ôøÙ½¥ì(€½¹¡…¹”è€¡•Ù•¹Ðè¡…¹•Ù•¹Ðñ!Q51%¹ÁÕÑ±•µ•¹Ðø¤€ôøÙ½¥ì)ô¤ì(€½¹ÍÐ•ÉÉ½É%€ô€‘í¥‘ôµ•ÉÉ½É€ì((€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µÜ´ÀÍÉ½±°µµˆµlÄÔÁÁátˆø(€€€€€€ñ¥•±‘1…‰•°(€€€€€€€¡Ñµ±½Èõí¥‘ô(€€€€€€€¥½¸õí¥½¹ô(€€€€€€€½ÁÑ¥½¹…°õí½ÁÑ¥½¹…±ô(€€€€€€€É•ÅÕ¥É•õíÉ•ÅÕ¥É•‘ô(€€€€€€ø(€€€€€€€í±…‰•±ô(€€€€€€ð½¥•±‘1…‰•°ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µÜ´Àˆø(€€€€€€€€ñ¥¹ÁÕÐ(€€€€€€€€€ì¸¸¹¥¹ÁÕÑAÉ½ÁÍô(€€€€€€€€€É•˜õíÍ•ÑI•™ô(€€€€€€€€€¥õí¥‘ô(€€€€€€€€€¹…µ”õí¥‘ô(€€€€€€€€€…É¥„µ¥¹Ù…±¥õí	½½±•…¸¡•ÉÉ½È¥ô(€€€€€€€€€…É¥„µ‘•ÍÉ¥‰•‘‰äõí•ÉÉ½È€ü•ÉÉ½É%€èÕ¹‘•™¥¹•‘ô(€€€€€€€€€±…ÍÍ9…µ”õí€‘í¥¹ÁÕÑ±…ÍÍ9…µ•ô µlÐáÁátÍ´é µlÔÁÁát±œé µlÐÉÁát€‘ì(€€€€€€€€€€€•ÉÉ½È(€€€€€€€€€€€€€€ü€‰‰½É‘•ÈµlˆÐÈÌÍtÉ¥¹œ´ÈÉ¥¹œµlˆÐÈÌÍt¼ÄÀ™½ÕÌé‰½É‘•ÈµlˆÐÈÌÍt™½ÕÌéÉ¥¹œµlˆÐÈÌÍt¼ÄÔˆ(€€€€€€€€€€€€€€è€ˆˆ(€€€€€€€€€õô(€€€€€€€€¼ø(€€€€€€€€ñ¥•±‘ÉÉ½È¥õí•ÉÉ½É%‘ô•ÉÉ½Èõí•ÉÉ½Éô€¼ø(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸Q•áÑÉ•…¥•±¡ì(€¥°(€±…‰•°°(€¥½¸°(€½ÁÑ¥½¹…°°(€¥¹ÁÕÑ±…ÍÍ9…µ”°(€Í•ÑI•˜°(€€¸¸¹Ñ•áÑ…É•…AÉ½ÁÌ)ôèì(€¥èÍÑÉ¥¹œì(€±…‰•°èÍÑÉ¥¹œì(€¥½¸üè½Éµ%½¹9…µ”ì(€½ÁÑ¥½¹…°èÍÑÉ¥¹œì(€¥¹ÁÕÑ±…ÍÍ9…µ”èÍÑÉ¥¹œì(€Í•ÑI•˜è€¡•±•µ•¹Ðè!Q51Q•áÑÉ•…±•µ•¹Ðð¹Õ±°¤€ôøÙ½¥ì(€Ù…±Õ”èÍÑÉ¥¹œì(€Á±…•¡½±‘•ÈèÍÑÉ¥¹œì(€½¹	±ÕÈè€ ¤€ôøÙ½¥ì(€½¹¡…¹”è€¡•Ù•¹Ðè¡…¹•Ù•¹Ðñ!Q51Q•áÑÉ•…±•µ•¹Ðø¤€ôøÙ½¥ì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µÜ´ÀÍÉ½±°µµˆµlÄÔÁÁátˆø(€€€€€€ñ¥•±‘1…‰•°¡Ñµ±½Èõí¥‘ô¥½¸õí¥½¹ô½ÁÑ¥½¹…°õí½ÁÑ¥½¹…±ôø(€€€€€€€í±…‰•±ô(€€€€€€ð½¥•±‘1…‰•°ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µÜ´Àˆø(€€€€€€€€ñÑ•áÑ…É•„(€€€€€€€€€ì¸¸¹Ñ•áÑ…É•…AÉ½ÁÍô(€€€€€€€€€É•˜õíÍ•ÑI•™ô(€€€€€€€€€¥õí¥‘ô(€€€€€€€€€¹…µ”õí¥‘ô(€€€€€€€€€±…ÍÍ9…µ”õí€‘í¥¹ÁÕÑ±…ÍÍ9…µ•ô µläÙÁátÉ•Í¥é”µäÁä´Ì±•…‘¥¹œ´ÜÍ´é µlÄÀÁÁát±œé µlØáÁát±œéÁä´È¸Ô±œé±•…‘¥¹œ´Õô(€€€€€€€€¼ø(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸¡½¥•É½ÕÀ¡ì(€¥°(€¹…µ”°(€±…‰•°°(€¥½¸°(€½ÁÑ¥½¹Ì°(€Ù…±Õ”°(€•ÉÉ½È°(€É•ÅÕ¥É•°(€±…å½ÕÐ°(€Í•Ñ¥ÉÍÑI•˜°(€½¹	±ÕÈ°(€½¹¡…¹”°)ôèì(€¥èÍÑÉ¥¹œì(€¹…µ”è¥•±‘9…µ”ì(€±…‰•°èÍÑÉ¥¹œì(€¥½¸è½Éµ%½¹9…µ”ì(€½ÁÑ¥½¹ÌèÉÉ…äñìÙ…±Õ”èÍÑÉ¥¹œì±…‰•°èÍÑÉ¥¹œôøì(€Ù…±Õ”èÍÑÉ¥¹œì(€•ÉÉ½ÈüèÍÑÉ¥¹œì(€É•ÅÕ¥É•üè‰½½±•…¸ì(€±…å½ÕÐè€‰½…°ˆð€‰µ•Ñ¡½ˆð€‰Ñ¥µ”ˆì(€Í•Ñ¥ÉÍÑI•˜è€¡•±•µ•¹Ðè!Q51%¹ÁÕÑ±•µ•¹Ðð¹Õ±°¤€ôøÙ½¥ì(€½¹	±ÕÈè€ ¤€ôøÙ½¥ì(€½¹¡…¹”è€¡Ù…±Õ”èÍÑÉ¥¹œ¤€ôøÙ½¥ì)ô¤ì(€½¹ÍÐ•ÉÉ½É%€ô€‘í¥‘ôµ•ÉÉ½É€ì((€™Õ¹Ñ¥½¸¡…¹‘±•	±ÕÈ¡•Ù•¹Ðè½ÕÍÙ•¹Ðñ!Q51¥•±‘M•Ñ±•µ•¹Ðø¤ì(€€€¥˜€ (€€€€€•Ù•¹Ð¹É•±…Ñ•‘Q…É•Ð¥¹ÍÑ…¹•½˜9½‘”€˜˜(€€€€€•Ù•¹Ð¹ÕÉÉ•¹ÑQ…É•Ð¹½¹Ñ…¥¹Ì¡•Ù•¹Ð¹É•±…Ñ•‘Q…É•Ð¤(€€€€¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€½¹	±ÕÈ ¤ì(€ô((€½¹ÍÐÉ¥‘±…ÍÍ9…µ”€ô(€€€±…å½ÕÐ€ôôô€‰½…°ˆ(€€€€€€ü€‰É¥µ½±Ì´Èˆ(€€€€€€è±…å½ÕÐ€ôôô€‰µ•Ñ¡½ˆ(€€€€€€€€ü€‰É¥µ½±Ì´Èˆ(€€€€€€€€è€‰É¥µ½±Ì´ÈµéÉ¥µ½±Ì´Ìˆì(€½¹ÍÐ‘•Í­Ñ½Á=ÁÑ¥½¹±…ÍÍ9…µ”€ô(€€€±…å½ÕÐ€ôôô€‰Ñ¥µ”ˆ(€€€€€€ü€‰±œé…À´Ä¸Ô±œéÁà´È±œéÑ•áÐµlÄÈ¸ÕÁátˆ(€€€€€€è±…å½ÕÐ€ôôô€‰½…°ˆ(€€€€€€€€ü€‰±œé…À´È±œéÁà´È¸Ô±œéÁä´Ä±œéÑ•áÐµlÄÍÁátˆ(€€€€€€€€è€‰±œé…À´È±œéÁà´È¸Ô±œéÑ•áÐµlÄÍÁátˆì((€É•ÑÕÉ¸€ (€€€€ñ™¥•±‘Í•Ð(€€€€€±…ÍÍ9…µ”ô‰µÐ´Ìµ¥¸µÜ´ÀÍÉ½±°µµˆµlÄÐáÁát‰½É‘•ÈµÐ‰½É‘•Èµl”Õ‘••tÁÐ´ÌÍ´éµÐ´ÐÍ´éÁÐ´Ð±œéµÐ´È¸Ô±œéÁÐ´È¸Ôˆ(€€€€€…É¥„µ¥¹Ù…±¥õí	½½±•…¸¡•ÉÉ½È¥ô(€€€€€…É¥„µ‘•ÍÉ¥‰•‘‰äõí•ÉÉ½È€ü•ÉÉ½É%€èÕ¹‘•™¥¹•‘ô(€€€€€½¹	±ÕÈõí¡…¹‘±•	±ÕÉô(€€€€ø(€€€€€€ñ±••¹±…ÍÍ9…µ”ô‰Üµ™Õ±°ˆø(€€€€€€€€ñ¥•±‘1…‰•°¥½¸õí¥½¹ôÉ•ÅÕ¥É•õíÉ•ÅÕ¥É•‘ôø(€€€€€€€€€í±…‰•±ô(€€€€€€€€ð½¥•±‘1…‰•°ø(€€€€€€ð½±••¹ø(€€€€€€ñ‘¥Ø(€€€€€€€±…ÍÍ9…µ”õíÉ¥…ÕÑ¼µÉ½ÝÌµ™È¥Ñ•µÌµÍÑÉ•Ñ …À´ÈÍ´é…À´È¸Ô±œé…À´Ä¸Ô€‘íÉ¥‘±…ÍÍ9…µ•õô(€€€€€€ø(€€€€€€€í½ÁÑ¥½¹Ì¹µ…À ¡½ÁÑ¥½¸°¥¹‘•à¤€ôøì(€€€€€€€€€½¹ÍÐÍ•±•Ñ•€ôÙ…±Õ”€ôôô½ÁÑ¥½¸¹Ù…±Õ”ì(€€€€€€€€€½¹ÍÐ½ÁÑ¥½¹%€ô€‘í¥‘ô´‘í½ÁÑ¥½¸¹Ù…±Õ•õ€ì((€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€ñ±…‰•°(€€€€€€€€€€€€€­•äõí½ÁÑ¥½¸¹Ù…±Õ•ô(€€€€€€€€€€€€€¡Ñµ±½Èõí½ÁÑ¥½¹%‘ô(€€€€€€€€€€€€€±…ÍÍ9…µ”õí µ™Õ±°µ¥¸µÜ´À€‘ì(€€€€€€€€€€€€€€€±…å½ÕÐ€ôôô€‰Ñ¥µ”ˆ(€€€€€€€€€€€€€€€€€€ü¥¹‘•à€ôôô€À(€€€€€€€€€€€€€€€€€€€€ü€‰½É‘•È´Ì½°µÍÁ…¸´Èµé½É‘•Èµ¹½¹”µé½°µÍÁ…¸´Äˆ(€€€€€€€€€€€€€€€€€€€€è¥¹‘•à€ôôô€Ä(€€€€€€€€€€€€€€€€€€€€€€ü€‰½É‘•È´Äµé½É‘•Èµ¹½¹”ˆ(€€€€€€€€€€€€€€€€€€€€€€è€‰½É‘•È´Èµé½É‘•Èµ¹½¹”ˆ(€€€€€€€€€€€€€€€€€€è€ˆˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñ¥¹ÁÕÐ(€€€€€€€€€€€€€€€É•˜õí¥¹‘•à€ôôô€À€üÍ•Ñ¥ÉÍÑI•˜€èÕ¹‘•™¥¹•‘ô(€€€€€€€€€€€€€€€¥õí½ÁÑ¥½¹%‘ô(€€€€€€€€€€€€€€€ÑåÁ”ô‰É…‘¥¼ˆ(€€€€€€€€€€€€€€€¹…µ”õí¹…µ•ô(€€€€€€€€€€€€€€€Ù…±Õ”õí½ÁÑ¥½¸¹Ù…±Õ•ô(€€€€€€€€€€€€€€€¡•­•õíÍ•±•Ñ•‘ô(€€€€€€€€€€€€€€€½¹¡…¹”õì ¤€ôø½¹¡…¹”¡½ÁÑ¥½¸¹Ù…±Õ”¥ô(€€€€€€€€€€€€€€€…É¥„µ¥¹Ù…±¥õí	½½±•…¸¡•ÉÉ½È¥ô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Á••ÈÍÈµ½¹±äÍÉ½±°µµˆµlÄÐáÁátˆ(€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ñÍÁ…¸(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õí™±•à µ™Õ±°µ¥¸µ µlÔÁÁátÜµ™Õ±°ÕÉÍ½ÈµÁ½¥¹Ñ•È¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´È¸ÔÉ½Õ¹‘•µlÄÍÁát‰½É‘•ÈÁà´ÌÁä´ÈÑ•áÐµÍÑ…ÉÐÑ•áÐµlÄÑÁát™½¹Ðµ‰½±±•…‘¥¹œµlÄ¸Ñt½ÕÑ±¥¹”µ¹½¹”ÑÉ…¹Í¥Ñ¥½¸µm‰½É‘•Èµ½±½È±‰…­É½Õ¹µ½±½È±‰½àµÍ¡…‘½Ü±½±½Ét‘ÕÉ…Ñ¥½¸´ÈÀÀÁ••Èµ™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´ÐÁ••Èµ™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÌäÅØát¼ÄÔÍ´éµ¥¸µ µlÔÉÁátÍ´éÁà´Ì¸ÔÍ´éÁä´È¸ÔÍ´éÑ•áÐµlÄÕÁát±œéµ¥¸µ µlÐÁÁát±œéÉ½Õ¹‘•µlÄÉÁát±œéÁä´Ä¸Ô€‘í‘•Í­Ñ½Á=ÁÑ¥½¹±…ÍÍ9…µ•ô€‘ì(€€€€€€€€€€€€€€€€€Í•±•Ñ•(€€€€€€€€€€€€€€€€€€€€ü€‰‰½É‘•ÈµlŒÌäÅØát‰œµl••”å˜Ñt™½¹Ðµ‰±…¬Ñ•áÐµlŒÌäÅØátÍ¡…‘½Üµm¥¹Í•Ñ|Á|Á|Á|ÅÁá}É‰„ ÔÜ°ÈÜ°ÄÀÐ°À¸ÄÐ¤°Á|ÝÁá|ÄáÁá}É‰„ ÔÜ°ÈÜ°ÄÀÐ°À¸Ä¥tˆ(€€€€€€€€€€€€€€€€€€€€è•ÉÉ½È(€€€€€€€€€€€€€€€€€€€€€€ü€‰‰½É‘•ÈµlˆÐÈÌÍt¼ØÀ‰œµÝ¡¥Ñ”Ñ•áÐµlŒÔÔÐÜØÁt¡½Ù•Èé‰½É‘•ÈµlŒÌäÅØát¼ÐÔ¡½Ù•Èé‰œµl™…˜á™tˆ(€€€€€€€€€€€€€€€€€€€€€€è€‰‰½É‘•ÈµlåÁ”Õt‰œµÝ¡¥Ñ”Ñ•áÐµlŒÔÔÐÜØÁt¡½Ù•Èé‰½É‘•ÈµlŒÌäÅØát¼ÐÔ¡½Ù•Èé‰œµl™…˜á™tˆ(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñÍÁ…¸(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíµ¥¸µÜ´À™±•à´ÄÑ•áÐµÍÑ…ÉÐ€‘ì(€€€€€€€€€€€€€€€€€€€±…å½ÕÐ€ôôô€‰Ñ¥µ”ˆ€ü€‰±œéÝ¡¥Ñ•ÍÁ…”µ¹½ÝÉ…Àˆ€è€ˆˆ(€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€í½ÁÑ¥½¸¹±…‰•±ô(€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÉ¥ ´ÔÜ´ÔÍ¡É¥¹¬´ÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°Ñ•áÐµlÄÅÁátÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ±œé µlÄáÁát±œéÜµlÄáÁát€‘ì(€€€€€€€€€€€€€€€€€€€Í•±•Ñ•(€€€€€€€€€€€€€€€€€€€€€€ü€‰‰œµläÄÅtÑ•áÐµÝ¡¥Ñ”ˆ(€€€€€€€€€€€€€€€€€€€€€€è€‰‰½É‘•È‰½É‘•ÈµlŒå‰‘átÑ•áÐµÑÉ…¹ÍÁ…É•¹Ðˆ(€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñ½Éµ%½¸¹…µ”ô‰¡•¬ˆ±…ÍÍ9…µ”ô‰ ´Ì¸ÔÜ´Ì¸Ôˆ€¼ø(€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½±…‰•°ø(€€€€€€€€€€¤ì(€€€€€€€ô¥ô(€€€€€€ð½‘¥Øø(€€€€€€ñ‘¥Øø(€€€€€€€€ñ¥•±‘ÉÉ½È¥õí•ÉÉ½É%‘ô•ÉÉ½Èõí•ÉÉ½Éô€¼ø(€€€€€€ð½‘¥Øø(€€€€ð½™¥•±‘Í•Ðø(€€¤ì)ô()™Õ¹Ñ¥½¸½¹Í•¹Ñ¥•±¡ì(€¥°(€±…‰•°°(€¡•­•°(€•ÉÉ½È°(€Í•ÑI•˜°(€½¹	±ÕÈ°(€½¹¡…¹”°)ôèì(€¥èÍÑÉ¥¹œì(€±…‰•°èÍÑÉ¥¹œì(€¡•­•è‰½½±•…¸ì(€•ÉÉ½ÈüèÍÑÉ¥¹œì(€Í•ÑI•˜è€¡•±•µ•¹Ðè!Q51%¹ÁÕÑ±•µ•¹Ðð¹Õ±°¤€ôøÙ½¥ì(€½¹	±ÕÈè€ ¤€ôøÙ½¥ì(€½¹¡…¹”è€¡•Ù•¹Ðè¡…¹•Ù•¹Ðñ!Q51%¹ÁÕÑ±•µ•¹Ðø¤€ôøÙ½¥ì)ô¤ì(€½¹ÍÐ•ÉÉ½É%€ô€‘í¥‘ôµ•ÉÉ½É€ì((€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÉ½±°µµˆµlÄÐáÁátˆø(€€€€€€ñ±…‰•°(€€€€€€€¡Ñµ±½Èõí¥‘ô(€€€€€€€±…ÍÍ9…µ”õí™±•àµ¥¸µ µlÔÁÁátÕÉÍ½ÈµÁ½¥¹Ñ•È¥Ñ•µÌµÍÑ…ÉÐ…À´È¸ÔÉ½Õ¹‘•µlÄÍÁát‰½É‘•È‰œµl™…˜á™tÀ´ÌÑ•áÐµlÄÍÁát™½¹Ðµ‰½±±•…‘¥¹œµlÄ¸ÕtÑ•áÐµlŒÔÔÐÜØÁtÑÉ…¹Í¥Ñ¥½¸µm‰½É‘•Èµ½±½È±‰…­É½Õ¹µ½±½È±‰½àµÍ¡…‘½Ýt‘ÕÉ…Ñ¥½¸´ÈÀÀ¡½Ù•Èé‰½É‘•ÈµlŒÌäÅØát¼ÐÔÍ´é…À´ÌÍ´éÀ´Ì¸ÔÍ´éÑ•áÐµlÄÐ¸ÕÁát±œéµ¥¸µ µlÐÉÁát±œé…À´È¸Ô±œéÉ½Õ¹‘•µlÄÉÁát±œéÀ´È¸Ô±œéÑ•áÐµlÄÍÁát±œé±•…‘¥¹œµlÄ¸ÐÕt€‘ì(€€€€€€€€€•ÉÉ½È€ü€‰‰½É‘•ÈµlˆÐÈÌÍtˆ€è€‰‰½É‘•ÈµlåÁ”Õtˆ(€€€€€€€õô(€€€€€€ø(€€€€€€€€ñ¥¹ÁÕÐ(€€€€€€€€€É•˜õíÍ•ÑI•™ô(€€€€€€€€€¥õí¥‘ô(€€€€€€€€€¹…µ”ô‰½¹Í•¹Ðˆ(€€€€€€€€€ÑåÁ”ô‰¡•­‰½àˆ(€€€€€€€€€¡•­•õí¡•­•‘ô(€€€€€€€€€½¹¡…¹”õí½¹¡…¹•ô(€€€€€€€€€½¹	±ÕÈõí½¹	±ÕÉô(€€€€€€€€€…É¥„µ¥¹Ù…±¥õí	½½±•…¸¡•ÉÉ½È¥ô(€€€€€€€€€…É¥„µ‘•ÍÉ¥‰•‘‰äõí•ÉÉ½È€ü•ÉÉ½É%€èÕ¹‘•™¥¹•‘ô(€€€€€€€€€±…ÍÍ9…µ”ô‰Á••ÈÍÈµ½¹±äÍÉ½±°µµˆµlÄÐáÁátˆ(€€€€€€€€¼ø(€€€€€€€€ñÍÁ…¸(€€€€€€€€€±…ÍÍ9…µ”õíµÐ´À¸ÔÉ¥ ´ÔÜ´ÔÍ¡É¥¹¬´ÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µµ‰½É‘•ÈÑ•áÐµáÌ™½¹Ðµ‰±…¬ÑÉ…¹Í¥Ñ¥½¸µm‰½É‘•Èµ½±½È±‰…­É½Õ¹µ½±½È±½±½È±‰½àµÍ¡…‘½ÝtÁ••Èµ™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´ÐÁ••Èµ™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÌäÅØát¼ÄÔ±œé µlÄáÁát±œéÜµlÄáÁát€‘ì(€€€€€€€€€€€¡•­•(€€€€€€€€€€€€€€ü€‰‰½É‘•ÈµlŒÌäÅØát‰œµlŒÌäÅØátÑ•áÐµÝ¡¥Ñ”ˆ(€€€€€€€€€€€€€€è€‰‰½É‘•Èµl„äå…ˆåt‰œµÝ¡¥Ñ”Ñ•áÐµÑÉ…¹ÍÁ…É•¹Ðˆ(€€€€€€€€€õô(€€€€€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€€€€€ø(€€€€€€€€€€ñ½Éµ%½¸¹…µ”ô‰¡•¬ˆ±…ÍÍ9…µ”ô‰ ´Ì¸ÔÜ´Ì¸Ôˆ€¼ø(€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€ñÍÁ…¸ùí±…‰•±ôð½ÍÁ…¸ø(€€€€€€ð½±…‰•°ø(€€€€€€ñ¥•±‘ÉÉ½È¥õí•ÉÉ½É%‘ô•ÉÉ½Èõí•ÉÉ½Éô€¼ø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸¥•±‘ÉÉ½È¡ì¥°•ÉÉ½Èôèì¥èÍÑÉ¥¹œì•ÉÉ½ÈüèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸•ÉÉ½È€ü€ (€€€€ñÀ(€€€€€¥õí¥‘ô(€€€€€É½±”ô‰…±•ÉÐˆ(€€€€€±…ÍÍ9…µ”ô‰µÐ´È™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÈÑ•áÐµlÄÍÁát™½¹Ðµ‰±…¬±•…‘¥¹œ´ÔÑ•áÐµl„ØÅˆÌÕtˆ(€€€€ø(€€€€€€ñÍÁ…¸(€€€€€€€±…ÍÍ9…µ”ô‰É¥ ´ÔÜ´ÔÍ¡É¥¹¬´ÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°‰½É‘•È‰½É‘•ÈµÕÉÉ•¹ÐÑ•áÐµlÄÅÁátˆ(€€€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€€€ø(€€€€€€€€„(€€€€€€ð½ÍÁ…¸ø(€€€€€í•ÉÉ½Éô(€€€€ð½Àø(€€¤€è¹Õ±°ì)ô()™Õ¹Ñ¥½¸MÕ‰µ¥ÑÉÉ½È¡ì(€½Áä°(€±½…±”°(€Ý¡…ÑÍ…ÁÁ!É•˜°)ôèA¥¬ñ1•…‘½ÉµAÉ½ÁÌ°€‰½Áäˆð€‰±½…±”ˆø€˜ì(€Ý¡…ÑÍ…ÁÁ!É•˜èÍÑÉ¥¹œì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø(€€€€€É½±”ô‰…±•ÉÐˆ(€€€€€…É¥„µ±¥Ù”ô‰…ÍÍ•ÉÑ¥Ù”ˆ(€€€€€±…ÍÍ9…µ”ô‰É½Õ¹‘•µlÄÙÁát‰½É‘•È‰½É‘•ÈµlˆÐÈÌÍt¼ÌÔ‰œµl™™˜Ñ˜ÕtÀ´ÐÑ•áÐµlŒàØÄØÉ…tˆ(€€€€ø(€€€€€€ñ Ì±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÙÁát™½¹Ðµ‰±…¬±•…‘¥¹œ´Øˆø(€€€€€€€í½Áä¹™…¥±ÕÉ”¹Ñ¥Ñ±•ô(€€€€€€ð½ Ìø(€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÄÑ•áÐµlÄÑÁát™½¹Ðµ‰½±±•…‘¥¹œ´Øˆø(€€€€€€€í½Áä¹™…¥±ÕÉ”¹µ•ÍÍ…•1•…‘ô(€€€€€€€€ñ„(€€€€€€€€€¡É•˜õíÝ¡…ÑÍ…ÁÁ!É•™ô(€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€ÑÉ…­]¡…ÑÍÁÁ±¥¬¡ì±½…±”°Í½ÕÉ”è€‰™½Éµ}•ÉÉ½Èˆô¤(€€€€€€€€€ô(€€€€€€€€€±…ÍÍ9…µ”ô‰™½¹Ðµ‰±…¬Õ¹‘•É±¥¹”‘•½É…Ñ¥½¸´ÈÕ¹‘•É±¥¹”µ½™™Í•Ð´È½ÕÑ±¥¹”µ¹½¹”™½ÕÌµÙ¥Í¥‰±”éÉ½Õ¹‘•™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´È™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÌäÅØátˆ(€€€€€€€€ø(€€€€€€€€€í½Áä¹™…¥±ÕÉ”¹Ý¡…ÑÍ…ÁÁô(€€€€€€€€ð½„ø(€€€€€€€í½Áä¹™…¥±ÕÉ”¹µ•ÍÍ…•Q…¥±ô(€€€€€€ð½Àø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸MÕ•ÍÍMÑ…Ñ”¡ì(€½Áä°(€¥ÍÉ…‰¥Œ°(€±½…±”°(€Ý¡…ÑÍ…ÁÁ!É•˜°(€½¹	…¬°)ôèA¥¬ñ1•…‘½ÉµAÉ½ÁÌ°€‰½Áäˆð€‰±½…±”ˆø€˜ì(€¥ÍÉ…‰¥Œè‰½½±•…¸ì(€Ý¡…ÑÍ…ÁÁ!É•˜èÍÑÉ¥¹œì(€½¹	…¬è€ ¤€ôøÙ½¥ì)ô¤ì(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø(€€€€€É½±”ô‰ÍÑ…ÑÕÌˆ(€€€€€…É¥„µ±¥Ù”ô‰Á½±¥Ñ”ˆ(€€€€€±…ÍÍ9…µ”ô‰™±•àµ¥¸µ µlÐÈÁÁát™±•àµ½°¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÁä´àÑ•áÐµ•¹Ñ•È±œéµ¥¸µ µlÔØÁÁátˆ(€€€€ø(€€€€€€ñÍÁ…¸(€€€€€€€±…ÍÍ9…µ”ô‰É¥ ´ÄØÜ´ÄØÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µlÈÁÁát‰œµl••”å˜ÑtÑ•áÐ´Íá°™½¹Ðµ‰±…¬Ñ•áÐµläÄÅtˆ(€€€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€€€ø(€€€€€€€ƒŠrL(€€€€€€ð½ÍÁ…¸ø(€€€€€€ñ È±…ÍÍ9…µ”ô‰µÐ´ØÑ•áÐµlÌÁÁát™½¹Ðµ‰±…¬±•…‘¥¹œµlÄ¸ÈÕtÑ•áÐµlŒÌäÅØátÍ´éÑ•áÐµlÌÙÁátˆø(€€€€€€€í½Áä¹ÍÕ•ÍÌ¹Ñ¥Ñ±•ô(€€€€€€ð½ Èø(€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´Ðµ…àµÜµlÔØÁÁátÑ•áÐµlÄÕÁát™½¹Ðµ‰½±±•…‘¥¹œµlÄ¸ÜÕtÑ•áÐµlŒÜÄØØÝ•tÍ´éÑ•áÐµlÄÙÁátˆø(€€€€€€€í½Áä¹ÍÕ•ÍÌ¹µ•ÍÍ…•ô(€€€€€€ð½Àø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´àÉ¥Üµ™Õ±°µ…àµÜµlÔÈÁÁát…À´ÌÍ´éÉ¥µ½±Ì´Èˆø(€€€€€€€€ñ„(€€€€€€€€€¡É•˜õíÝ¡…ÑÍ…ÁÁ!É•™ô(€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€ÑÉ…­]¡…ÑÍÁÁ±¥¬¡ì±½…±”°Í½ÕÉ”è€‰™½Éµ}ÍÕ•ÍÌˆô¤(€€€€€€€€€ô(€€€€€€€€€±…ÍÍ9…µ”ô‰™±•àµ¥¸µ µlÔÑÁát¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µlÄÙÁát‰œµläÄÅtÁà´ÔÑ•áÐµlÄÕÁát™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”Í¡…‘½ÜµlÁ|ÄÉÁá|ÈÑÁá}É‰„ ÈÌØ°ÄÐÔ°ÌÄ°À¸ÈÔ¥t½ÕÑ±¥¹”µ¹½¹”ÑÉ…¹Í¥Ñ¥½¸µm‰…­É½Õ¹µ½±½È±‰½àµÍ¡…‘½Ü±ÑÉ…¹Í™½Éµt¡½Ù•Èé‰œµläÝ˜ÄÁt…Ñ¥Ù”éÑÉ…¹Í±…Ñ”µä´À¸Ô™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´Ð™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÌäÅØát¼ÈÀˆ(€€€€€€€€ø(€€€€€€€€€í½Áä¹ÍÕ•ÍÌ¹Ý¡…ÑÍ…ÁÁô(€€€€€€€€€€ñÍÁ…¸(€€€€€€€€€€€±…ÍÍ9…µ”õí¥ÍÉ…‰¥Œ€ü€‰É½Ñ…Ñ”´ÄàÀˆ€èÕ¹‘•™¥¹•‘ô(€€€€€€€€€€€…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ(€€€€€€€€€€ø(€€€€€€€€€€€ƒŠH(€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€ð½„ø(€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€½¹±¥¬õí½¹	…­ô(€€€€€€€€€±…ÍÍ9…µ”ô‰µ¥¸µ µlÔÑÁátÉ½Õ¹‘•µlÄÙÁát‰½É‘•È‰½É‘•ÈµlŒÌäÅØát¼ÈÔ‰œµÝ¡¥Ñ”Áà´ÔÑ•áÐµlÄÕÁát™½¹Ðµ‰±…¬Ñ•áÐµlŒÌäÅØát½ÕÑ±¥¹”µ¹½¹”ÑÉ…¹Í¥Ñ¥½¸µm‰½É‘•Èµ½±½È±‰…­É½Õ¹µ½±½È±ÑÉ…¹Í™½Éµt¡½Ù•Èé‰½É‘•ÈµlŒÌäÅØát¡½Ù•Èé‰œµl™…˜á™t…Ñ¥Ù”éÑÉ…¹Í±…Ñ”µä´À¸Ô™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œ´Ð™½ÕÌµÙ¥Í¥‰±”éÉ¥¹œµlŒÌäÅØát¼ÄÔˆ(€€€€€€€€ø(€€€€€€€€€í½Áä¹ÍÕ•ÍÌ¹‰…­ô(€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô()™Õ¹Ñ¥½¸¥ÍY…±¥‘µ…¥°¡Ù…±Õ”èÍÑÉ¥¹œ¤ì(€É•ÑÕÉ¸€½ymyqÍt­myqÍt­p¹myqÍt¬¼¹Ñ•ÍÐ¡Ù…±Õ”¹ÑÉ¥´ ¤¤ì)ô(