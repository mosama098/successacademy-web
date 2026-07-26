"use client";

import { useEffect, useRef, useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type StepIcon = "details" | "schedule" | "assessment" | "result" | "start";

type TextPart = {
  text: string;
  ltr?: boolean;
};

type RegistrationStep = {
  title: string;
  description: TextPart[];
  icon: StepIcon;
};

type RegistrationContent = {
  badge: string;
  titleLead: string;
  titleHighlight: string;
  description: string;
  ctaSupport: string;
  cta: string;
  reassurance: string;
  steps: RegistrationStep[];
};

const registrationContent: Record<"ar" | "en", RegistrationContent> = {
  ar: {
    badge: "خطوات التسجيل",
    titleLead: "من أول التسجيل لحد ما تبدأ…",
    titleHighlight: "كل خطوة واضحة",
    description:
      "من غير خطوات معقدة: سجّل بياناتك، اختار الموعد، اعمل التقييم، وإحنا نحدد لك البداية المناسبة.",
    ctaSupport: "جاهز تبدأ أول خطوة؟",
    cta: "ابدأ بتسجيل بياناتك",
    reassurance: "هنوضح لك كل خطوة قبل ما تبدأ.",
    steps: [
      {
        title: "سجّل بياناتك",
        description: [
          { text: "اكتب اسمك ورقم واتساب علشان نبدأ التواصل معاك." },
        ],
        icon: "details",
      },
      {
        title: "اختار طريقتك وموعدك",
        description: [
          {
            text: "حدّد أونلاين أو فرع الدقي، واختار اليوم والوقت المناسب ليك.",
          },
        ],
        icon: "schedule",
      },
      {
        title: "اعمل تقييم المستوى",
        description: [
          {
            text: "تقييم يحدد مستواك الحقيقي ونقاط القوة والاحتياج.",
          },
        ],
        icon: "assessment",
      },
      {
        title: "استلم نتيجتك وخطتك",
        description: [
          {
            text: "نعرفك مستواك ونرشح لك البداية والمجموعة الأنسب لهدفك.",
          },
        ],
        icon: "result",
      },
      {
        title: "أكّد تسجيلك وابدأ",
        description: [
          { text: "تختار مجموعتك، تؤكد التسجيل، ويبدأ معاك الـ " },
          { text: "Success Manager", ltr: true },
          { text: "." },
        ],
        icon: "start",
      },
    ],
  },
  en: {
    badge: "How to Get Started",
    titleLead: "From Registration to Your First Session —",
    titleHighlight: "Every Step Is Clear",
    description:
      "No complicated process: submit your details, choose a suitable time, complete your assessment, and we’ll guide you to the right starting point.",
    ctaSupport: "Ready to Take the First Step?",
    cta: "Submit Your Details",
    reassurance: "We’ll explain every step before you begin.",
    steps: [
      {
        title: "Submit Your Details",
        description: [
          {
            text: "Enter your name and WhatsApp number so our team can contact you.",
          },
        ],
        icon: "details",
      },
      {
        title: "Choose Your Format and Time",
        description: [
          {
            text: "Choose online learning or our Dokki branch, then select a suitable day and time.",
          },
        ],
        icon: "schedule",
      },
      {
        title: "Complete Your Level Assessment",
        description: [
          {
            text: "The assessment identifies your current level, strengths, and learning needs.",
          },
        ],
        icon: "assessment",
      },
      {
        title: "Receive Your Result and Plan",
        description: [
          {
            text: "We explain your result and recommend the right starting point and group for your goal.",
          },
        ],
        icon: "result",
      },
      {
        title: "Confirm and Start",
        description: [
          {
            text: "Choose your group, confirm your registration, and begin with support from your Success Manager.",
          },
        ],
        icon: "start",
      },
    ],
  },
};

function RichText({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.ltr ? (
          <span
            key={`${part.text}-${index}`}
            className="[unicode-bidi:isolate]"
            dir="ltr"
          >
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function StepIconGraphic({ icon }: { icon: StepIcon }) {
  const className = "h-5 w-5";

  if (icon === "details") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="7" r="3" />
        <path d="M3.5 19c.5-4 2.3-6 5.5-6s5 2 5.5 6M16 8h5M16 12h5M17 16h4" />
      </svg>
    );
  }

  if (icon === "schedule") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6" />
      </svg>
    );
  }

  if (icon === "assessment") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 5h6M9 3h6v4H9z" />
        <path d="M7 5H5v16h14V5h-2M8 12l2 2 5-5M8 18h8" />
      </svg>
    );
  }

  if (icon === "result") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="6" r="2" />
        <path d="M7 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h1M10 10l3-3-3-3" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9M17.5 17.5 21 21" />
    </svg>
  );
}

export function RegistrationStepsSection({
  locale,
}: LandingSectionProps) {
  const content = registrationContent[locale];
  const isArabic = locale === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setPrefersReducedMotion(media.matches);
      if (media.matches) setHasEntered(true);
    };

    syncPreference();
    media.addEventListener("change", syncPreference);

    const section = sectionRef.current;
    if (!section || media.matches) {
      return () => media.removeEventListener("change", syncPreference);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasEntered(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncPreference);
    };
  }, []);

  const isRevealed = hasEntered || prefersReducedMotion;

  return (
    <section
      ref={sectionRef}
      id="registration-steps"
      className="relative bg-[#F8F6FB] px-5 pb-[calc(108px+env(safe-area-inset-bottom))] pt-16 sm:px-6 sm:pt-[68px] md:pb-[68px] lg:px-8 lg:py-14"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1220px]">
        <header className="mx-auto max-w-[1000px] text-center">
          <span className="inline-flex rounded-full border border-[#EC911F]/30 bg-[#EC911F]/[0.08] px-4 py-1.5 text-[13px] font-black text-[#EC911F] sm:text-[14px]">
            {content.badge}
          </span>
          <h2 className="mt-4 text-[31px] font-black leading-[1.23] text-[#391B68] sm:text-[38px] lg:text-[42px] lg:leading-[1.16]">
            <span className="block">{content.titleLead}</span>
            <span className="mt-1 block text-[#EC911F]">
              {content.titleHighlight}
            </span>
          </h2>
          <p className="mx-auto mt-3.5 max-w-[760px] text-[15px] font-bold leading-[1.68] text-[#6d6578] sm:text-[17px]">
            {content.description}
          </p>
        </header>

        <div
          className={`mx-auto mt-6 max-w-[1180px] rounded-[24px] border border-[#dcd3e8] bg-white p-[18px] shadow-[0_18px_45px_rgba(57,27,104,0.1)] sm:p-6 lg:rounded-[28px] lg:px-8 lg:py-4 ${
            prefersReducedMotion
              ? "transition-none"
              : "transition-[opacity,transform] duration-[350ms] ease-out"
          }`}
          style={{
            opacity: isRevealed ? 1 : 0,
            transform: `translateY(${isRevealed ? 0 : 6}px)`,
          }}
        >
          <div className="relative mx-auto max-w-[1080px]">
            <div
              className={`absolute bottom-[26px] start-[25px] top-[26px] w-[3px] rounded-full bg-[#ded6e8] lg:hidden ${
                prefersReducedMotion
                  ? "transition-none"
                  : "transition-opacity duration-300"
              }`}
              style={{
                opacity: isRevealed ? 1 : 0,
                transitionDelay: prefersReducedMotion ? "0ms" : "140ms",
              }}
              aria-hidden="true"
            >
              <span
                className={`block h-full w-full origin-top rounded-full bg-[#EC911F] ${
                  prefersReducedMotion
                    ? "transition-none"
                    : "transition-transform duration-[900ms] ease-out"
                }`}
                style={{
                  transform: `scaleY(${isRevealed ? 1 : 0})`,
                  transitionDelay: prefersReducedMotion ? "0ms" : "240ms",
                }}
              />
            </div>

            <div
              className={`absolute inset-x-[10%] top-[30px] hidden h-1 rounded-full bg-[#ded6e8] lg:block ${
                prefersReducedMotion
                  ? "transition-none"
                  : "transition-opacity duration-300"
              }`}
              style={{
                opacity: isRevealed ? 1 : 0,
                transitionDelay: prefersReducedMotion ? "0ms" : "140ms",
              }}
              aria-hidden="true"
            >
              <span
                className={`block h-full w-full rounded-full bg-[#EC911F] ${
                  isArabic ? "origin-right" : "origin-left"
                } ${
                  prefersReducedMotion
                    ? "transition-none"
                    : "transition-transform duration-[900ms] ease-out"
                }`}
                style={{
                  transform: `scaleX(${isRevealed ? 1 : 0})`,
                  transitionDelay: prefersReducedMotion ? "0ms" : "240ms",
                }}
              />
            </div>

            <ol className="relative grid gap-[22px] lg:grid-cols-5 lg:gap-0">
              {content.steps.map((step, index) => {
                const isDestination = index === content.steps.length - 1;

                return (
                  <li
                    key={step.title}
                    className="relative grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3 lg:block"
                  >
                    <div
                      className={`relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full border text-[16px] font-black tabular-nums shadow-[0_8px_20px_rgba(57,27,104,0.12)] lg:mx-auto lg:h-16 lg:w-16 lg:text-[17px] ${
                        isDestination
                          ? "border-[#EC911F] bg-[#EC911F] text-white shadow-[0_10px_24px_rgba(236,145,31,0.25)]"
                          : "border-[#391B68]/25 bg-white text-[#EC911F]"
                      } ${
                        prefersReducedMotion
                          ? "transition-none"
                          : "transition-[opacity,transform] duration-[350ms] ease-out"
                      }`}
                      style={{
                        opacity: isRevealed ? 1 : 0,
                        transform: `translateY(${isRevealed ? 0 : 6}px)`,
                        transitionDelay: prefersReducedMotion
                          ? "0ms"
                          : `${300 + index * 70}ms`,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div
                      className={`pt-0.5 lg:pt-[18px] ${
                        prefersReducedMotion
                          ? "transition-none"
                          : "transition-[opacity,transform] duration-[350ms] ease-out"
                      }`}
                      style={{
                        opacity: isRevealed ? 1 : 0,
                        transform: `translateY(${isRevealed ? 0 : 6}px)`,
                        transitionDelay: prefersReducedMotion
                          ? "0ms"
                          : `${390 + index * 70}ms`,
                      }}
                    >
                      <div className="mb-2 flex items-center justify-start gap-2.5 text-[#391B68]">
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[#391B68] ${
                            isDestination
                              ? "bg-[#EC911F]/15"
                              : "bg-[#ece6f3]"
                          }`}
                        >
                          <StepIconGraphic icon={step.icon} />
                        </span>
                        <h3 className="text-[18px] font-black leading-[1.35] text-[#391B68] lg:text-[19px]">
                          {step.title}
                        </h3>
                      </div>
                      <p
                        className={`max-w-[390px] text-[14.5px] font-bold leading-[1.65] text-[#6d6578] lg:max-w-[205px] lg:text-[15px] ${
                          isArabic ? "text-right" : "text-left"
                        }`}
                      >
                        <RichText parts={step.description} />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            className={`mt-6 flex flex-col gap-4 rounded-[20px] border border-[#391B68]/10 bg-[#F8F6FB] p-4 sm:p-5 lg:mt-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-4 ${
              prefersReducedMotion
                ? "transition-none"
                : "transition-[opacity,transform] duration-[350ms] ease-out"
            }`}
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: `translateY(${isRevealed ? 0 : 6}px)`,
              transitionDelay: prefersReducedMotion ? "0ms" : "780ms",
            }}
          >
            <div className={isArabic ? "text-right" : "text-left"}>
              <p className="text-[21px] font-black leading-[1.32] text-[#391B68] sm:text-[23px] lg:text-[24px]">
                {content.ctaSupport}
              </p>
              <p className="mt-1.5 text-[13.5px] font-bold leading-[1.55] text-[#6d6578] sm:text-[14px]">
                {content.reassurance}
              </p>
            </div>
            <CtaLink
              href={bookingHref}
              locale={locale}
              source="registration_steps"
              className="h-[54px] w-full shrink-0 !rounded-[16px] !bg-[#EC911F] px-7 text-[16px] shadow-[0_12px_26px_rgba(236,145,31,0.24)] hover:!bg-[#EC911F] hover:brightness-95 lg:w-auto"
            >
              {content.cta}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
