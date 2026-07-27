"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LandingSectionProps } from "./types";

type IconName =
  | "team"
  | "experience"
  | "certificate"
  | "activity"
  | "conversation"
  | "correction"
  | "feedback";

type TrainerContent = {
  badge: string;
  titleLead: string;
  titleHighlight: string;
  imageAlt: string;
  stats: Array<{
    value: string;
    label?: string;
    icon: IconName;
  }>;
  message: string;
  support: string;
  points: Array<{
    title: string;
    description: string;
    icon: IconName;
    ltrToken?: string;
    titleTail?: string;
  }>;
  closingLead: string;
  closingHighlight: string;
  closingTail: string;
};

const trainerContent: Record<"ar" | "en", TrainerContent> = {
  ar: {
    badge: "فريق التدريب",
    titleLead: "مش أي حد بيتكلم إنجليزي…",
    titleHighlight: "يعرف يعلّمه",
    imageAlt: "مدرب يقدم جلسة تدريب تفاعلية لمجموعة من الطلاب",
    stats: [
      { value: "+30", label: "مدرب", icon: "team" },
      { value: "+5", label: "سنوات خبرة", icon: "experience" },
      { value: "CELTA & TEFL", icon: "certificate" },
    ],
    message: "مدرب يفهم ترددك… ويعرف يطلع أفضل ما عندك",
    support:
      "بيئة مريحة تشجعك تتكلم، تجرّب، وتتحسن من غير خوف من الغلط.",
    points: [
      {
        title: "أنشطة تخليك تشارك",
        description:
          "تمارين تفاعلية تخليك تستخدم الإنجليزي طول المحاضرة.",
        icon: "activity",
      },
      {
        title: "مواقف ومحادثات حقيقية",
        description:
          "تدريب على مواقف الشغل والدراسة والسفر والحياة اليومية.",
        icon: "conversation",
      },
      {
        title: "تصحيح يدعمك",
        description:
          "تصحيح واضح يساعدك تتطور من غير ما يهز ثقتك.",
        icon: "correction",
      },
      {
        title: "",
        ltrToken: "Feedback",
        titleTail: "واضح",
        description:
          "تعرف تقدّمك، ونقاط قوتك، وإيه اللي محتاج تركز عليه.",
        icon: "feedback",
      },
    ],
    closingLead: "مش هدفنا تحفظ الإنجليزي… هدفنا ",
    closingHighlight: "تستخدمه بثقة",
    closingTail: " وقت ما تحتاجه.",
  },
  en: {
    badge: "Training Team",
    titleLead: "Not Everyone Who Speaks English",
    titleHighlight: "Knows How to Teach It",
    imageAlt:
      "Trainer leading an interactive English session with a group of students",
    stats: [
      { value: "30+", label: "Trainers", icon: "team" },
      { value: "5+", label: "Years of Experience", icon: "experience" },
      { value: "CELTA & TEFL", icon: "certificate" },
    ],
    message:
      "A Trainer Who Understands Your Hesitation—and Knows How to Bring Out Your Best",
    support:
      "A comfortable environment that helps you speak, try, and improve without fear of mistakes.",
    points: [
      {
        title: "Interactive Activities",
        description:
          "Activities that keep you using English throughout the session.",
        icon: "activity",
      },
      {
        title: "Real-Life Situations and Conversations",
        description:
          "Practice for work, study, travel, and everyday life.",
        icon: "conversation",
      },
      {
        title: "Supportive Correction",
        description:
          "Clear correction that helps you improve without damaging your confidence.",
        icon: "correction",
      },
      {
        title: "Clear Feedback",
        description:
          "Understand your progress, strengths, and what to focus on next.",
        icon: "feedback",
      },
    ],
    closingLead: "Our Goal Isn’t for You to Memorise English—it’s for You to ",
    closingHighlight: "Use It Confidently",
    closingTail: " When You Need It.",
  },
};

function TrainerIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: IconName;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (icon === "team") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.5-3.4 2.3-5 5.5-5s5 1.6 5.5 5" />
        <circle cx="17.5" cy="9" r="2.2" />
        <path d="M15.5 14.5c2.9-.8 4.7.5 5 3.5" />
      </svg>
    );
  }

  if (icon === "experience") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5v5l3.5 2M8.5 3.8 7 2.5M15.5 3.8 17 2.5" />
      </svg>
    );
  }

  if (icon === "certificate") {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="13" rx="2" />
        <path d="m9 9 2 2 4-4M9 16l-1 5 4-2 4 2-1-5" />
      </svg>
    );
  }

  if (icon === "activity") {
    return (
      <svg {...common}>
        <path d="M4 5.5h16v10H9l-5 4v-14Z" />
        <path d="M8 10h2M12 10h4" />
      </svg>
    );
  }

  if (icon === "conversation") {
    return (
      <svg {...common}>
        <path d="M3.5 5h12v9H8l-4.5 3.5V5Z" />
        <path d="M9 17h6l4.5 3.5V9H18M7 9h5" />
      </svg>
    );
  }

  if (icon === "correction") {
    return (
      <svg {...common}>
        <path d="M12 3 4.5 6v5c0 4.7 2.8 8.2 7.5 10 4.7-1.8 7.5-5.3 7.5-10V6L12 3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 4h14v13H9l-4 3V4Z" />
      <path d="M8 8h8M8 11h6M8 14h4" />
    </svg>
  );
}

export function TrainersSection({ locale }: LandingSectionProps) {
  const content = trainerContent[locale];
  const isArabic = locale === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setPrefersReducedMotion(media.matches);
      if (media.matches) setIsVisible(true);
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
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncPreference);
    };
  }, []);

  const revealStyle = (delay: number): CSSProperties => ({
    opacity: isVisible ? 1 : 0,
    transform: `translateY(${isVisible ? 0 : 6}px)`,
    transitionDelay: prefersReducedMotion ? "0ms" : `${delay}ms`,
  });

  const motionClass = prefersReducedMotion
    ? "transition-none"
    : "transition-[opacity,transform] duration-[360ms] ease-out";

  return (
    <section
      ref={sectionRef}
      id="trainers"
      className="relative overflow-hidden bg-[#FBFAFC] px-5 pb-[116px] pt-12 sm:px-6 sm:pb-[120px] sm:pt-14 lg:px-8 lg:py-10"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1240px]">
        <div
          className={`grid gap-5 sm:gap-6 lg:grid-rows-[auto_auto] lg:gap-7 lg:gap-x-12 lg:gap-y-0 ${
            isArabic
              ? "lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]"
              : "lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]"
          }`}
          dir="ltr"
        >
          <header
            className={`${isArabic ? "lg:col-start-2" : "lg:col-start-1"} ${motionClass}`}
            dir={isArabic ? "rtl" : "ltr"}
            style={revealStyle(0)}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#391B68]/10 bg-[#eee9f4] px-3.5 py-1.5 text-[13px] font-black text-[#391B68] sm:px-4 sm:py-2 sm:text-[14px]">
              <TrainerIcon icon="team" className="h-4 w-4 text-[#EC911F]" />
              {content.badge}
            </span>
            <h2
              className={`mt-4 max-w-[760px] text-[clamp(32px,8.4vw,36px)] font-black leading-[1.2] text-[#391B68] sm:text-[38px] md:text-[40px] lg:leading-[1.15] ${
                isArabic ? "lg:text-[42px]" : "lg:text-[40px]"
              }`}
            >
              {isArabic ? (
                <>
                  <span className="block">{content.titleLead}</span>{" "}
                  <span className="block text-[#EC911F]">
                    {content.titleHighlight}
                  </span>
                </>
              ) : (
                <>
                  <span>{content.titleLead}</span>{" "}
                  <span className="text-[#EC911F]">
                    {content.titleHighlight}
                  </span>
                </>
              )}
            </h2>
          </header>

          <div
            className={`${isArabic ? "lg:col-start-1" : "lg:col-start-2"} ${motionClass} relative mx-auto flex h-[clamp(280px,calc(50vw+100px),310px)] w-full max-w-[620px] items-end justify-center overflow-visible sm:h-[380px] md:h-[400px] lg:row-span-2 lg:row-start-1 lg:h-[540px] lg:max-w-none lg:self-end`}
            dir={isArabic ? "rtl" : "ltr"}
            style={revealStyle(80)}
          >
            <div className="relative h-full max-w-full aspect-[1122/1402] overflow-visible">
              <Image
                src="/images/trainer-model.png"
                alt={content.imageAlt}
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-contain object-bottom"
              />
              <span
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[8%] bg-gradient-to-b from-[#FBFAFC] to-transparent"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[10%] bg-gradient-to-t from-[#FBFAFC] to-transparent"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[8%] bg-gradient-to-r from-[#FBFAFC] to-transparent"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[8%] bg-gradient-to-l from-[#FBFAFC] to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>

          <div
            className={`${isArabic ? "lg:col-start-2" : "lg:col-start-1"} min-w-0`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:mt-4 lg:grid-cols-3">
              {content.stats.map((stat, index) => (
                <div
                  key={stat.value}
                  className={`${motionClass} flex min-h-[80px] gap-2.5 rounded-[18px] border border-[#391B68]/10 bg-white px-3 py-3 shadow-[0_8px_22px_rgba(57,27,104,0.06)] sm:items-center sm:px-4 lg:min-h-[88px] ${
                    index === 2
                      ? "col-span-2 flex-row items-center lg:col-span-1"
                      : "flex-row items-center"
                  }`}
                  style={revealStyle(140 + index * 60)}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eee9f4] text-[#391B68]">
                    <TrainerIcon icon={stat.icon} />
                  </span>
                  <strong className="min-w-0 text-[19px] font-black leading-[1.2] text-[#391B68] lg:text-[20px]">
                    <span className="[unicode-bidi:isolate]" dir="ltr">
                      {stat.value}
                    </span>
                    {stat.label ? <span> {stat.label}</span> : null}
                  </strong>
                </div>
              ))}
            </div>

            <div
              className={`${motionClass} mt-5 sm:mt-6 lg:mt-4`}
              style={revealStyle(340)}
            >
              <h3 className="max-w-[680px] text-[24px] font-black leading-[1.35] text-[#391B68]">
                {content.message}
              </h3>
              <p className="mt-2 max-w-[720px] text-[15px] font-bold leading-[1.65] text-[#6d6578] sm:text-[16px]">
                {content.support}
              </p>
            </div>

            <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:mt-4 lg:gap-2.5">
              {content.points.map((point, index) => (
                <article
                  key={`${point.title}${point.ltrToken ?? ""}`}
                  className={`${motionClass} flex gap-3 rounded-[19px] border border-[#dcd3e8] bg-white px-4 py-3.5 sm:p-[15px] lg:p-[14px]`}
                  style={revealStyle(420 + index * 55)}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eee9f4] text-[#391B68]">
                    <TrainerIcon icon={point.icon} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-black leading-[1.35] text-[#391B68] lg:text-[16px]">
                      {point.ltrToken ? (
                        <>
                          <span
                            className="[unicode-bidi:isolate]"
                            dir="ltr"
                          >
                            {point.ltrToken}
                          </span>{" "}
                          {point.titleTail}
                        </>
                      ) : (
                        point.title
                      )}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] font-bold leading-[1.52] text-[#6d6578] sm:text-[14px] lg:text-[13.5px]">
                      {point.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`${motionClass} mt-7 rounded-[20px] bg-[#391B68] px-5 py-[18px] text-center text-[19px] font-black leading-[1.55] text-white shadow-[0_16px_34px_rgba(57,27,104,0.16)] sm:px-7 sm:text-[21px] lg:mt-4 lg:py-3.5 lg:text-[22px]`}
          style={revealStyle(680)}
        >
          {content.closingLead}
          <span className="text-[#EC911F]">{content.closingHighlight}</span>
          {content.closingTail}
        </div>
      </div>
    </section>
  );
}
