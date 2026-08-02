"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { LandingSectionProps } from "./types";

const learnerTarget = 100;

function formatLearnerCount(value: number, locale: "ar" | "en") {
  return locale === "ar" ? `+${value}K` : `${value}K+`;
}

function StatIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 13h3M8 16h6" stroke="#EC911F" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5 16 4-4 3 3 7-8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 7h5v5" stroke="#EC911F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" stroke="#EC911F" strokeWidth="1.8" />
    </svg>
  );
}

export function AboutSuccessAcademySection({ locale, copy }: LandingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);
  const [learnerCount, setLearnerCount] = useState(0);
  const isArabic = locale === "ar";
  const content = copy.about;

  useEffect(() => {
    const section = sectionRef.current;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;

    const showFinalValue = () => {
      hasAnimatedRef.current = true;
      observer?.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      setLearnerCount(learnerTarget);
    };

    const handleMotionPreference = () => {
      if (motionQuery.matches) showFinalValue();
    };

    motionQuery.addEventListener("change", handleMotionPreference);

    if (!section || motionQuery.matches) {
      showFinalValue();
      return () => motionQuery.removeEventListener("change", handleMotionPreference);
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return;

        hasAnimatedRef.current = true;
        observer?.disconnect();
        const startedAt = performance.now();
        const duration = 1_000;

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
      { threshold: 0.4 },
    );

    observer.observe(section);

    return () => {
      observer?.disconnect();
      motionQuery.removeEventListener("change", handleMotionPreference);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const contentColumn = isArabic ? "lg:col-start-2" : "lg:col-start-1";
  const logoColumn = isArabic ? "lg:col-start-1" : "lg:col-start-2";
  const desktopColumns = isArabic
    ? "lg:grid-cols-[minmax(0,0.29fr)_minmax(0,0.71fr)]"
    : "lg:grid-cols-[minmax(0,0.71fr)_minmax(0,0.29fr)]";
  const desktopHeadingSize = isArabic ? "lg:text-[40px]" : "lg:text-[36px]";
  const desktopDescriptionType = isArabic
    ? "lg:text-[15.5px] lg:leading-[1.75]"
    : "lg:text-[15px] lg:leading-[1.65]";

  return (
    <section
      ref={sectionRef}
      id="about-success-academy"
      className="bg-[#FBFAFC] px-5 py-14 sm:px-6 lg:px-8 lg:py-[38px]"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        className={`mx-auto grid max-w-[1100px] items-center gap-x-16 gap-y-5 lg:gap-y-[14px] ${desktopColumns}`}
        dir="ltr"
      >
        <header className={`${contentColumn} lg:row-start-1`} dir={isArabic ? "rtl" : "ltr"}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#391B68]/10 bg-[#EEE9F4] px-3.5 py-1.5 text-[13px] font-black text-[#391B68] sm:text-[14px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EC911F]" aria-hidden="true" />
            {content.badge}
          </span>
          <h2 className={`mt-4 max-w-[760px] text-balance text-[30px] font-black leading-[1.25] text-[#391B68] sm:text-[35px] lg:leading-[1.2] ${desktopHeadingSize}`}>
            {content.title}
          </h2>
          <p className={`mt-3.5 max-w-[680px] text-[14.5px] font-semibold leading-[1.7] text-[#685A75] sm:text-[15.5px] ${desktopDescriptionType}`}>
            {content.description}
          </p>
        </header>

        <div className={`relative flex items-center justify-center py-1 ${logoColumn} lg:row-span-3 lg:row-start-1 lg:py-0`}>
          <span className="absolute h-28 w-28 rounded-full bg-[#EC911F]/[0.06] blur-2xl sm:h-36 sm:w-36" aria-hidden="true" />
          <div className="relative w-[205px] lg:w-[260px]">
            <Image
              src="/logo.png"
              alt={isArabic ? "شعار Success Academy" : "Success Academy logo"}
              width={260}
              height={130}
              sizes="(min-width: 1024px) 260px, 205px"
              className="object-contain"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>

        <ul className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${contentColumn} lg:row-start-2`} dir={isArabic ? "rtl" : "ltr"}>
          {content.stats.map((stat, index) => {
            const isLearnerCard = index === 1;
            const mobilePosition = index === 1
              ? "col-span-2 row-start-2 md:col-span-1 md:row-auto"
              : index === 2
                ? "col-start-2 row-start-1 md:col-auto md:row-auto"
                : "col-start-1 row-start-1 md:col-auto md:row-auto";

            return (
              <li
                key={stat.label}
                className={`flex h-[112px] items-start gap-3 rounded-[20px] border p-3.5 sm:h-[122px] sm:p-4 ${mobilePosition} ${
                  isLearnerCard
                    ? "border-[#391B68] bg-[#391B68] text-white shadow-[0_14px_30px_rgba(57,27,104,0.2)]"
                    : "border-[#391B68]/12 bg-white text-[#391B68] shadow-[0_10px_25px_rgba(57,27,104,0.06)]"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${
                    isLearnerCard ? "bg-white/12 text-white" : "bg-[#EEE9F4] text-[#391B68]"
                  }`}
                  aria-hidden="true"
                >
                  <span className="h-5 w-5"><StatIcon index={index} /></span>
                </span>

                <div className="min-w-0 self-center">
                  {isLearnerCard ? (
                    <>
                      <span className="block text-[34px] font-black leading-none tracking-[0] text-white sm:text-[37px]" aria-hidden="true">
                        {formatLearnerCount(learnerCount, locale)}
                      </span>
                      <span className="sr-only">{`${stat.value} ${stat.label}`}</span>
                    </>
                  ) : (
                    <span className={`block font-black leading-[1.15] ${index === 2 ? "text-[17px] sm:text-[19px]" : "text-[25px] sm:text-[28px]"}`}>
                      {stat.value}
                    </span>
                  )}
                  <span className={`mt-1 block text-[12px] font-bold leading-[1.35] sm:text-[13.5px] ${isLearnerCard ? "text-white/80" : "text-[#6D6178]"}`}>
                    {stat.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className={`flex items-center gap-3 ${contentColumn} lg:row-start-3`} dir="ltr">
          <span className="h-px min-w-5 flex-1 bg-[#DCD3E7]" aria-hidden="true" />
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
          <p className="shrink-0 text-center text-[17px] font-black leading-[1.4] text-[#391B68] sm:text-[20px]">
            {content.slogan}
          </p>
          <span className="h-px min-w-5 flex-1 bg-[#DCD3E7]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

