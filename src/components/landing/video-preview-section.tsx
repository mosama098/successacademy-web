"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

const journeyContent = {
  ar: {
    badge: "رحلتك معانا",
    title: "من أول تقييم... لحد ما تستخدم الإنجليزي بثقة",
    introduction: "كل مرحلة مبنية على مستواك وهدفك، من تحديد نقطة البداية لحد التدريب العملي والمتابعة المستمرة.",
    cta: "ابدأ رحلتك بتقييم مجاني",
    steps: [
      {
        image: "/journey/assessment.png",
        title: "التقييم المجاني",
        description: "اعرف مستواك الحقيقي، ونحدد معاك نقطة البداية المناسبة قبل ما تختار أي برنامج.",
        alt: "طالب يبدأ التقييم المجاني مع Success Academy",
      },
      {
        image: "/journey/training.png",
        title: "التدريب المناسب",
        description: "نرشح لك نظام تدريب يناسب هدفك، وقتك، ومستواك الحالي.",
        alt: "تدريب إنجليزي مناسب لمستوى وهدف الطالب",
      },
      {
        image: "/journey/practice.png",
        title: "الممارسة والتطبيق",
        description: "تستخدم اللغة في مهام ومواقف عملية علشان تتحول المعرفة لاستخدام حقيقي.",
        alt: "ممارسة اللغة الإنجليزية في مواقف عملية",
      },
      {
        image: "/journey/follow-up.png",
        title: "المتابعة والتطوير",
        description: "فريق المتابعة يساعدك تحافظ على التزامك، يقيس تقدمك، ويعدل الخطة عند الحاجة.",
        alt: "متابعة تقدم الطالب وتطوير خطة تعلم الإنجليزية",
      },
    ],
  },
  en: {
    badge: "Your Journey",
    title: "From your first assessment to using English with confidence",
    introduction:
      "Every stage is built around your level and goal, from identifying your starting point to practical training and continuous support.",
    cta: "Start with a Free Assessment",
    steps: [
      {
        image: "/journey/assessment.png",
        title: "Free Assessment",
        description: "Discover your real English level and identify the right starting point before choosing a programme.",
        alt: "A learner starting the free Success Academy assessment",
      },
      {
        image: "/journey/training.png",
        title: "The Right Training",
        description: "Get a training direction that matches your goal, schedule, and current level.",
        alt: "English training matched to a learner's level and goal",
      },
      {
        image: "/journey/practice.png",
        title: "Practice and Application",
        description: "Use English through practical tasks and real situations, not passive memorisation.",
        alt: "Learners practising English in a real situation",
      },
      {
        image: "/journey/follow-up.png",
        title: "Support and Progress",
        description: "Your Success Manager helps you stay committed, track progress, and adjust the plan when needed.",
        alt: "A Success Manager supporting a learner's progress",
      },
    ],
  },
} as const;

export function VideoPreviewSection({ locale }: LandingSectionProps) {
  const content = journeyContent[locale];
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const isArabic = locale === "ar";

  useEffect(() => {
    const observedSteps = stepRefs.current.filter((step): step is HTMLElement => Boolean(step));
    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (activeEntry) {
          setActiveStep(Number((activeEntry.target as HTMLElement).dataset.step));
        }
      },
      {
        rootMargin: "-28% 0px -46% 0px",
        threshold: [0, 0.2, 0.45, 0.7],
      },
    );

    observedSteps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [locale]);

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#faf8fd_100%)] px-5 py-14 sm:px-6 lg:px-10 lg:py-24">
      <div
        className={`mx-auto grid max-w-[1320px] [direction:ltr] lg:items-start lg:gap-12 ${
          isArabic ? "lg:grid-cols-[1.18fr_0.82fr]" : "lg:grid-cols-[0.82fr_1.18fr]"
        }`}
      >
        <div
          className={`relative hidden min-w-0 lg:block ${isArabic ? "lg:col-start-1" : "lg:col-start-2"}`}
          aria-live="polite"
        >
          <div className="sticky top-[120px]">
            <div className="absolute -inset-5 -z-10 rounded-[36px] bg-gradient-to-br from-[#391B68]/10 via-[#E32F54]/5 to-[#EC911F]/15 blur-2xl" />
            <div className="relative aspect-[7/4] overflow-hidden rounded-[28px] border border-[#391B68]/10 bg-[#291342] shadow-[0_28px_70px_rgba(57,27,104,0.18)]">
              {content.steps.map((step, index) => (
                <Image
                  key={step.image}
                  src={step.image}
                  alt={step.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1023px) 100vw, 58vw"
                  className={`object-contain object-center transition-[opacity,transform] duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-opacity motion-reduce:duration-150 ${
                    index === activeStep ? "scale-100 opacity-100" : "pointer-events-none scale-[1.015] opacity-0"
                  }`}
                />
              ))}
            </div>
            <div className={`mt-4 flex items-center gap-3 ${isArabic ? "justify-end [direction:rtl]" : "justify-start"}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#EC911F] to-[#E32F54] shadow-[0_0_14px_rgba(236,145,31,0.35)]" />
              <p className="text-sm font-black text-[#391B68]">
                {String(activeStep + 1).padStart(2, "0")} / {String(content.steps.length).padStart(2, "0")} · {content.steps[activeStep].title}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`min-w-0 ${
            isArabic ? "[direction:rtl] lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:row-start-1"
          }`}
        >
          <div className="text-center lg:text-start">
            <span className="inline-flex items-center rounded-full border border-[#391B68]/10 bg-[#391B68]/[0.06] px-4 py-2 text-[12px] font-black text-[#391B68]">
              {content.badge}
            </span>
            <h2 className="mx-auto mt-5 max-w-[650px] text-[29px] font-black leading-[1.25] text-[#391B68] sm:text-4xl lg:mx-0 lg:text-[46px]">
              {content.title}
            </h2>
            <p className="mx-auto mt-5 max-w-[610px] text-[16px] font-bold leading-8 text-slate-600 lg:mx-0 lg:text-[18px]">
              {content.introduction}
            </p>
          </div>

          <div className="mt-9 lg:mt-12">
            {content.steps.map((step, index) => {
              const isActive = activeStep === index;

              return (
                <article
                  key={step.image}
                  ref={(element) => {
                    stepRefs.current[index] = element;
                  }}
                  data-step={index}
                  className={`border-b border-b-[#391B68]/10 py-8 transition-[opacity,transform,border-color] duration-500 motion-reduce:transform-none motion-reduce:transition-none lg:flex lg:min-h-[46vh] lg:items-center ${
                    isArabic ? "lg:border-r-4 lg:pr-7" : "lg:border-l-4 lg:pl-7"
                  } ${
                    isActive
                      ? `${isArabic ? "lg:border-r-[#EC911F]" : "lg:border-l-[#EC911F]"} opacity-100 lg:translate-x-0`
                      : `${isArabic ? "lg:border-r-transparent" : "lg:border-l-transparent"} opacity-75 lg:translate-y-2 lg:opacity-50`
                  }`}
                >
                  <div className="w-full">
                    <div className="relative mb-6 aspect-[7/4] overflow-hidden rounded-[20px] border border-[#391B68]/10 bg-[#291342] shadow-[0_18px_42px_rgba(57,27,104,0.14)] lg:hidden">
                      <Image
                        src={step.image}
                        alt={step.alt}
                        fill
                        sizes="(max-width: 1023px) 100vw, 1px"
                        className="object-contain object-center"
                      />
                    </div>
                    <span className={`text-[12px] font-black tracking-[0.18em] ${isActive ? "text-[#E32F54]" : "text-[#391B68]/45"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-[25px] font-black leading-tight text-[#391B68] sm:text-[29px]">{step.title}</h3>
                    <p className="mt-3 max-w-[560px] text-[16px] font-bold leading-8 text-slate-600 lg:text-[17px]">
                      {step.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <CtaLink
            href={bookingHref}
            locale={locale}
            source="journey_scroll"
            className="mt-9 h-[56px] w-full px-8 sm:w-auto lg:mt-12"
          >
            {content.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}

