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

const stageAngles = [
  [-35, 35],
  [55, 125],
  [145, 215],
  [235, 305],
] as const;

const orbitalLabelPositions = [
  "left-1/2 top-0 -translate-x-1/2",
  "-right-2 top-1/2 -translate-y-1/2",
  "bottom-0 left-1/2 -translate-x-1/2",
  "-left-2 top-1/2 -translate-y-1/2",
] as const;

function polarPoint(angle: number, radius = 190) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 260 + radius * Math.cos(radians),
    y: 260 + radius * Math.sin(radians),
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarPoint(startAngle);
  const end = polarPoint(endAngle);
  return `M ${start.x} ${start.y} A 190 190 0 0 1 ${end.x} ${end.y}`;
}

const orbitalArcs = stageAngles.map(([start, end]) => describeArc(start, end));

export function VideoPreviewSection({ locale }: LandingSectionProps) {
  const content = journeyContent[locale];
  const [activeStage, setActiveStage] = useState(0);
  const desktopTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isArabic = locale === "ar";
  const panelId = `journey-stage-panel-${locale}`;
  const gradientId = `journey-orbit-gradient-${locale}`;
  const glowId = `journey-orbit-glow-${locale}`;

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

  const activateArcFromKeyboard = (event: KeyboardEvent<SVGPathElement>, index: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectStage(index);
  };

  const stageImages = (
    <>
      {content.stages.map((stage, index) => (
        <Image
          key={stage.image}
          src={stage.image}
          alt={content.imageAlt.replace("{stage}", stage.title)}
          fill
          priority={index === 0}
          sizes="(max-width: 1023px) 320px, 340px"
          className={`object-cover object-center transition-[opacity,transform] duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-opacity motion-reduce:duration-100 ${
            activeStage === index ? "scale-100 opacity-100" : "pointer-events-none scale-[1.02] opacity-0"
          }`}
        />
      ))}
    </>
  );

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#faf8fd_100%)] px-5 py-14 sm:px-6 lg:px-10 lg:py-24">
      <div
        className={`mx-auto grid max-w-[1240px] items-center gap-x-16 gap-y-9 [direction:ltr] lg:grid-cols-[1.06fr_0.94fr] lg:gap-y-0 ${
          isArabic ? "" : "lg:grid-cols-[0.94fr_1.06fr]"
        }`}
      >
        <div
          className={`order-1 text-center lg:row-start-1 lg:self-end lg:text-start ${
            isArabic ? "[direction:rtl] lg:col-start-2" : "lg:col-start-1"
          }`}
        >
          <span className="inline-flex items-center rounded-full border border-[#391B68]/10 bg-[#391B68]/[0.06] px-4 py-2 text-[12px] font-black text-[#391B68]">
            {content.badge}
          </span>
          <h2 className="mx-auto mt-5 max-w-[570px] text-[30px] font-black leading-[1.22] text-[#391B68] sm:text-4xl lg:mx-0 lg:text-[48px]">
            {content.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[550px] text-[16px] font-bold leading-8 text-slate-600 lg:mx-0 lg:text-[18px]">
            {content.intro}
          </p>
        </div>

        <div
          className={`order-2 lg:row-span-2 lg:row-start-1 ${isArabic ? "lg:col-start-1" : "lg:col-start-2"}`}
        >
          <div className="relative mx-auto hidden aspect-square w-full max-w-[600px] lg:block" role="group" aria-label={isArabic ? "مراحل رحلتك" : "Your journey stages"}>
            <div className="absolute inset-[22%] rounded-full bg-[#391B68]/12 blur-3xl" aria-hidden="true" />

            <svg className="absolute inset-[12.5%] h-[75%] w-[75%] overflow-visible" viewBox="0 0 520 520" fill="none" aria-hidden="false">
              <defs>
                <linearGradient id={gradientId} x1="90" y1="70" x2="430" y2="450" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EC911F" />
                  <stop offset="0.52" stopColor="#E32F54" />
                  <stop offset="1" stopColor="#391B68" />
                </linearGradient>
                <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {content.stages.map((stage, index) => {
                const isActive = activeStage === index;

                return (
                  <path
                    key={stage.image}
                    d={orbitalArcs[index]}
                    fill="none"
                    stroke={isActive ? `url(#${gradientId})` : "#e8e2f0"}
                    strokeWidth={isActive ? 32 : 28}
                    strokeLinecap="round"
                    role="button"
                    tabIndex={0}
                    aria-label={`${String(index + 1).padStart(2, "0")} ${stage.title}`}
                    aria-pressed={isActive}
                    aria-controls={panelId}
                    onMouseEnter={() => selectStage(index)}
                    onFocus={() => selectStage(index)}
                    onClick={() => selectStage(index)}
                    onKeyDown={(event) => activateArcFromKeyboard(event, index)}
                    filter={isActive ? `url(#${glowId})` : undefined}
                    className="cursor-pointer transition-[stroke,stroke-width,filter] duration-300 focus-visible:outline-none motion-reduce:transition-none"
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 z-10 aspect-square w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[6px] border-white bg-[#291342] shadow-[0_26px_65px_rgba(33,16,53,0.28)]">
              {stageImages}
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
            </div>

            <div role="tablist" aria-label={isArabic ? "اختيار مرحلة الرحلة" : "Choose a journey stage"}>
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
                    className={`absolute z-20 flex min-h-[48px] w-[142px] items-center justify-center gap-2 rounded-full border bg-white px-3 py-2 text-center text-[13px] font-black leading-5 shadow-[0_10px_28px_rgba(57,27,104,0.1)] transition-[color,border-color,box-shadow,transform] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#EC911F] ${orbitalLabelPositions[index]} ${
                      isActive
                        ? "border-[#E32F54]/40 text-[#391B68] shadow-[0_12px_34px_rgba(227,47,84,0.18)]"
                        : "border-[#391B68]/10 text-[#391B68]/75 hover:-translate-y-0.5 hover:border-[#391B68]/25 hover:text-[#391B68]"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] transition-colors duration-300 ${
                        isActive
                          ? "bg-[linear-gradient(135deg,#EC911F,#E32F54_60%,#391B68)] text-white"
                          : "bg-[#f0ebf5] text-[#391B68]"
                      }`}
                      dir="ltr"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{stage.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:hidden">
            <div className="relative mx-auto aspect-square w-[min(76vw,320px)] overflow-hidden rounded-full border-[5px] border-white bg-[#291342] shadow-[0_22px_55px_rgba(57,27,104,0.22)]">
              {stageImages}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5" role="tablist" aria-label={isArabic ? "مراحل رحلتك" : "Your journey stages"}>
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
          id={panelId}
          role="tabpanel"
          aria-live="polite"
          className={`order-3 text-center lg:row-start-2 lg:self-start lg:text-start ${
            isArabic ? "[direction:rtl] lg:col-start-2" : "lg:col-start-1"
          }`}
        >
          <div className="mx-auto max-w-[550px] border-t border-[#391B68]/10 pt-7 lg:mx-0 lg:mt-7">
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

          <CtaLink href={bookingHref} locale={locale} source="journey_orbit" className="mx-auto mt-8 h-[56px] w-full px-8 sm:w-auto lg:mx-0">
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

