"use client";

import { useEffect, useRef, useState } from "react";
import type { LandingSectionProps } from "./types";

const learnerTarget = 100_000;

function animatedLearnerLabel(value: number, locale: "ar" | "en", finalLabel: string) {
  if (value >= learnerTarget) return finalLabel;

  const thousands = Math.floor(value / 1_000);
  return locale === "ar"
    ? `+${thousands} ألف متدرب وثقوا فينا`
    : `${thousands}K+ learners trusted us`;
}

export function AboutSuccessAcademySection({ locale, copy }: LandingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [learnerCount, setLearnerCount] = useState(0);
  const isArabic = locale === "ar";
  const content = copy.about;

  useEffect(() => {
    const section = sectionRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;

    const finishImmediately = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      setLearnerCount(learnerTarget);
      observer?.disconnect();
    };

    const handleMotionPreference = () => {
      if (media.matches) finishImmediately();
    };

    media.addEventListener("change", handleMotionPreference);

    if (!section || media.matches) {
      finishImmediately();
      return () => media.removeEventListener("change", handleMotionPreference);
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer?.disconnect();
        const startedAt = performance.now();
        const duration = 900;

        const tick = (now: number) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          setLearnerCount(Math.round(learnerTarget * easedProgress));

          if (progress < 1) {
            frameRef.current = requestAnimationFrame(tick);
          } else {
            frameRef.current = null;
          }
        };

        frameRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0.22 },
    );

    observer.observe(section);

    return () => {
      observer?.disconnect();
      media.removeEventListener("change", handleMotionPreference);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const learnerLabel = animatedLearnerLabel(learnerCount, locale, content.stats[1]);

  return (
    <section
      ref={sectionRef}
      id="about-success-academy"
      className="bg-[#FBFAFC] px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-16"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        className="mx-auto grid max-w-[1180px] items-center gap-5 sm:gap-6 lg:grid-cols-[minmax(220px,0.3fr)_minmax(0,0.7fr)] lg:gap-12"
        dir="ltr"
      >
        <header className="lg:col-start-2 lg:row-start-1" dir={isArabic ? "rtl" : "ltr"}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#391B68]/10 bg-[#EEE9F4] px-3.5 py-1.5 text-[13px] font-black text-[#391B68] sm:text-[14px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EC911F]" aria-hidden="true" />
            {content.badge}
          </span>
          <h2 className="mt-3.5 max-w-[780px] text-[30px] font-black leading-[1.2] text-[#391B68] sm:mt-4 sm:text-[38px] lg:text-[43px] lg:leading-[1.16]">
            {content.title}
          </h2>
          <p className="mt-3 max-w-[790px] text-[14.5px] font-bold leading-[1.65] text-[#655A70] sm:mt-4 sm:text-[16px] sm:leading-[1.75]">
            {content.description}
          </p>
        </header>

        <div className="flex min-h-[108px] items-center justify-center sm:min-h-[132px] lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:min-h-0" dir="ltr">
          <div
            role="img"
            aria-label="Success Academy"
            className="inline-flex items-center gap-3 sm:gap-3.5"
          >
            <span className="relative grid h-[72px] w-[72px] place-items-center rounded-[22px] bg-[#391B68] text-[22px] font-black text-white shadow-[0_16px_34px_rgba(57,27,104,0.18)] sm:h-[92px] sm:w-[92px] sm:rounded-[26px] sm:text-[27px]">
              SA
              <span className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-full bg-[#EC911F]" aria-hidden="true" />
            </span>
            <span className="text-start text-[21px] font-black leading-[1.08] text-[#391B68] sm:text-[26px]">
              Success
              <span className="block text-[#EC911F]">Academy</span>
            </span>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:col-start-2 lg:row-start-2" dir={isArabic ? "rtl" : "ltr"}>
          {content.stats.map((stat, index) => (
            <li
              key={stat}
              className={`flex h-[92px] items-center justify-center rounded-[16px] border px-2 text-center text-[12.5px] font-black leading-[1.4] text-[#391B68] sm:h-[82px] sm:rounded-[18px] sm:px-4 sm:text-[15px] lg:h-[84px] lg:text-[15.5px] ${
                index === 1
                  ? "border-[#EC911F]/35 bg-[#FFF8EF] shadow-[0_10px_24px_rgba(236,145,31,0.1)]"
                  : "border-[#391B68]/10 bg-white shadow-[0_8px_22px_rgba(57,27,104,0.05)]"
              }`}
            >
              {index === 1 ? (
                <>
                  <span aria-hidden="true">{learnerLabel}</span>
                  <span className="sr-only">{stat}</span>
                </>
              ) : (
                stat
              )}
            </li>
          ))}
        </ul>

        <p
          className="rounded-[18px] border border-[#391B68]/10 bg-[#EEE9F4]/70 px-4 py-3 text-center text-[17px] font-black leading-[1.45] text-[#391B68] sm:px-5 sm:py-3.5 sm:text-[20px] lg:col-start-2 lg:row-start-3 lg:text-start"
          dir="ltr"
          style={{ borderInlineStartColor: "#EC911F", borderInlineStartWidth: 3 }}
        >
          {content.slogan}
        </p>
      </div>
    </section>
  );
}

