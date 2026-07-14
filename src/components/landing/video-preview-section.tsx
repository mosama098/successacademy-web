"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

const journeyContent = {
  ar: {
    badge: "رحلتك معنا",
    title: "شوف رحلتك خطوة بخطوة",
    intro: "من أول تقييم مجاني لحد ما تبدأ خطة مناسبة لمستواك وهدفك.",
    cta: "ابدأ بتقييم مجاني",
    imageAlt: "مرحلة {stage} في رحلة التعلم مع Success Academy",
    stages: [
      {
        image: "/journey/assessment.png",
        title: "التقييم المجاني",
        description: "اعرف مستواك الحقيقي قبل ما تختار أي برنامج.",
      },
      {
        image: "/journey/training.png",
        title: "التدريب المناسب",
        description: "نرشح لك خطة تناسب هدفك ووقتك ومستواك الحالي.",
      },
      {
        image: "/journey/practice.png",
        title: "الممارسة والتطبيق",
        description: "تستخدم اللغة في مهام عملية عشان تتحول لمعرفة بتستخدم فعلاً.",
      },
      {
        image: "/journey/follow-up.png",
        title: "المتابعة والتطوير",
        description: "فريق المتابعة يساعدك تكمل بثبات وتحقق تقدم واضح.",
      },
    ],
  },
  en: {
    badge: "Your Journey",
    title: "See your journey, step by step",
    intro: "From a free assessment to a plan built around your level and goal.",
    cta: "Start with a Free Assessment",
    imageAlt: "The {stage} stage of the Success Academy learning journey",
    stages: [
      {
        image: "/journey/assessment.png",
        title: "Free Assessment",
        description: "Understand your real level before choosing any programme.",
      },
      {
        image: "/journey/training.png",
        title: "The Right Training",
        description: "Get a plan that fits your goal, schedule, and current level.",
      },
      {
        image: "/journey/practice.png",
        title: "Practice and Application",
        description: "Use English in practical tasks so knowledge becomes real ability.",
      },
      {
        image: "/journey/follow-up.png",
        title: "Support and Progress",
        description: "Our follow-up team helps you stay consistent and make clear progress.",
      },
    ],
  },
} as const;

const segmentPositions = [
  "right-0 top-0 rounded-tr-full",
  "bottom-0 right-0 rounded-br-full",
  "bottom-0 left-0 rounded-bl-full",
  "left-0 top-0 rounded-tl-full",
] as const;

const segmentLabelPositions = [
  "top-[15%]",
  "bottom-[15%]",
  "bottom-[15%]",
  "top-[15%]",
] as const;

export function VideoPreviewSection({ locale }: LandingSectionProps) {
  const content = journeyContent[locale];
  const [activeStage, setActiveStage] = useState(0);
  const desktopTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isArabic = locale === "ar";
  const panelId = `journey-stage-panel-${locale}`;

  const selectStage = (index: number) => setActiveStage(index);

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    tabRefs: Array<HTMLButtonElement | null>,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % content.stages.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + content.stages.length) % content.stages.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = content.stages.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    selectStage(nextIndex);
    tabRefs[nextIndex]?.focus();
  };

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#faf8fd_100%)] px-5 py-14 sm:px-6 lg:px-10 lg:py-24">
      <div
        className={`mx-auto grid max-w-[1240px] items-center gap-10 [direction:ltr] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 ${
          isArabic ? "" : "lg:grid-cols-[0.95fr_1.05fr]"
        }`}
      >
        <div className={`${isArabic ? "lg:col-start-1" : "lg:col-start-2"} lg:row-start-1`}>
          <div className="relative mx-auto hidden aspect-square w-full max-w-[570px] lg:block">
            <div className="absolute inset-3 rounded-full bg-[#391B68]/10 blur-3xl" aria-hidden="true" />
            <div
              className="absolute inset-0 overflow-hidden rounded-full border border-[#391B68]/10 bg-white p-[3px] shadow-[0_32px_80px_rgba(57,27,104,0.18)]"
              role="tablist"
              aria-label={isArabic ? "مراحل رحلتك" : "Your journey stages"}
            >
              <div className="relative h-full w-full overflow-hidden rounded-full bg-[#f1edf7]">
                {content.stages.map((stage, index) => {
                  const isActive = activeStage === index;

                  return (
                    <button
                      key={stage.image}
                      ref={(element) => {
                        desktopTabRefs.current[index] = element;
                      }}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={panelId}
                      tabIndex={isActive ? 0 : -1}
                      onMouseEnter={() => selectStage(index)}
                      onFocus={() => selectStage(index)}
                      onClick={() => selectStage(index)}
                      onKeyDown={(event) => handleTabKeyDown(event, index, desktopTabRefs.current)}
                      className={`absolute h-1/2 w-1/2 transition-[background-color,color,box-shadow] duration-500 focus-visible:z-20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-6px] focus-visible:outline-[#EC911F] ${segmentPositions[index]} ${
                        isActive
                          ? "bg-[linear-gradient(135deg,#391B68_0%,#E32F54_58%,#EC911F_100%)] text-white shadow-[inset_0_0_32px_rgba(255,255,255,0.12)]"
                          : "bg-[#eee9f5] text-[#391B68] hover:bg-[#e5ddee]"
                      }`}
                    >
                      <span
                        className={`absolute left-1/2 z-[5] w-[190px] -translate-x-1/2 whitespace-nowrap text-center text-[17px] font-black leading-6 drop-shadow-[0_1px_1px_rgba(255,255,255,0.22)] xl:text-[18px] ${segmentLabelPositions[index]}`}
                        dir={isArabic ? "rtl" : "ltr"}
                      >
                        {stage.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 z-10 aspect-square w-[56%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[7px] border-white bg-[#291342] shadow-[0_22px_55px_rgba(33,16,53,0.32)]">
              {content.stages.map((stage, index) => (
                <Image
                  key={stage.image}
                  src={stage.image}
                  alt={content.imageAlt.replace("{stage}", stage.title)}
                  fill
                  priority={index === 0}
                  sizes="320px"
                  className={`object-cover object-center transition-[opacity,transform] duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-opacity motion-reduce:duration-100 ${
                    activeStage === index ? "scale-100 opacity-100" : "pointer-events-none scale-[1.025] opacity-0"
                  }`}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
            </div>
          </div>

          <div className="lg:hidden">
            <div className="relative mx-auto aspect-square w-[min(78vw,340px)] overflow-hidden rounded-full border-[5px] border-white bg-[#291342] shadow-[0_22px_55px_rgba(57,27,104,0.22)]">
              {content.stages.map((stage, index) => (
                <Image
                  key={stage.image}
                  src={stage.image}
                  alt={content.imageAlt.replace("{stage}", stage.title)}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 767px) 78vw, 340px"
                  className={`object-cover object-center transition-[opacity,transform] duration-500 motion-reduce:transform-none motion-reduce:transition-opacity motion-reduce:duration-100 ${
                    activeStage === index ? "scale-100 opacity-100" : "pointer-events-none scale-[1.025] opacity-0"
                  }`}
                />
              ))}
            </div>

            <div
              className="mt-6 grid grid-cols-2 gap-2.5"
              role="tablist"
              aria-label={isArabic ? "مراحل رحلتك" : "Your journey stages"}
            >
              {content.stages.map((stage, index) => {
                const isActive = activeStage === index;

                return (
                  <button
                    key={stage.image}
                    ref={(element) => {
                      mobileTabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => selectStage(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index, mobileTabRefs.current)}
                    className={`min-h-12 rounded-full border px-3 py-2 text-[13px] font-black leading-5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] ${
                      isActive
                        ? "border-transparent bg-[linear-gradient(135deg,#391B68,#E32F54_65%,#EC911F)] text-white shadow-[0_10px_24px_rgba(57,27,104,0.2)]"
                        : "border-[#391B68]/10 bg-white text-[#391B68] hover:border-[#391B68]/25 hover:bg-[#f7f4fa]"
                    }`}
                  >
                    {stage.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className={`text-center lg:row-start-1 lg:text-start ${
            isArabic ? "[direction:rtl] lg:col-start-2" : "lg:col-start-1"
          }`}
        >
          <span className="inline-flex items-center rounded-full border border-[#391B68]/10 bg-[#391B68]/[0.06] px-4 py-2 text-[12px] font-black text-[#391B68]">
            {content.badge}
          </span>
          <h2 className="mx-auto mt-5 max-w-[580px] text-[30px] font-black leading-[1.22] text-[#391B68] sm:text-4xl lg:mx-0 lg:text-[48px]">
            {content.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] font-bold leading-8 text-slate-600 lg:mx-0 lg:text-[18px]">
            {content.intro}
          </p>

          <div
            id={panelId}
            role="tabpanel"
            aria-live="polite"
            className="mx-auto mt-8 max-w-[560px] border-t border-[#391B68]/10 pt-7 lg:mx-0"
          >
            <span className="inline-block text-[12px] font-black tracking-[0.16em] text-[#E32F54]" dir="ltr">
              {String(activeStage + 1).padStart(2, "0")} / {String(content.stages.length).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-[27px] font-black leading-tight text-[#391B68] sm:text-[31px]">
              {content.stages[activeStage].title}
            </h3>
            <p className="mt-3 text-[16px] font-bold leading-8 text-slate-600 lg:text-[17px]">
              {content.stages[activeStage].description}
            </p>
          </div>

          <CtaLink href={bookingHref} locale={locale} source="journey_circle" className="mx-auto mt-8 h-[56px] w-full px-8 sm:w-auto lg:mx-0">
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

