"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

const journeySlides = {
  ar: [
    {
      image: "/journey/assessment.png",
      title: "التقييم المجاني",
      caption: "اعرف مستواك الحقيقي ونقطة البداية المناسبة ليك.",
    },
    {
      image: "/journey/training.png",
      title: "التدريب المناسب",
      caption: "نحدد معاك النظام الأنسب حسب هدفك ووقتك.",
    },
    {
      image: "/journey/practice.png",
      title: "الممارسة والتطبيق",
      caption: "تتدرب بشكل عملي علشان تستخدم اللغة بثقة.",
    },
    {
      image: "/journey/follow-up.png",
      title: "المتابعة والتطوير",
      caption: "فريق المتابعة يساعدك تكمل وتحقق تقدم واضح.",
    },
  ],
  en: [
    {
      image: "/journey/assessment.png",
      title: "Free level check",
      caption: "Understand your real level and the right starting point.",
    },
    {
      image: "/journey/training.png",
      title: "The right training",
      caption: "Choose a learning format that fits your goal and schedule.",
    },
    {
      image: "/journey/practice.png",
      title: "Practice and application",
      caption: "Train practically until English becomes something you can use.",
    },
    {
      image: "/journey/follow-up.png",
      title: "Follow-up and progress",
      caption: "Our follow-up team helps you stay consistent and keep improving.",
    },
  ],
} as const;

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VideoPreviewSection({ locale, copy }: LandingSectionProps) {
  const slides = journeySlides[locale];
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const isArabic = locale === "ar";

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const showPrevious = () => setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  const showNext = () => setActiveSlide((current) => (current + 1) % slides.length);

  const handleTouchEnd = (endX: number) => {
    if (touchStartX.current === null) return;

    const distance = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 40) return;
    if (distance > 0) showPrevious();
    else showNext();
  };

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#faf8fd_100%)] px-5 py-14 sm:px-6 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1220px] gap-9 [direction:ltr] lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
        <div
          className={`order-1 text-center lg:row-start-1 lg:text-start ${isArabic ? "[direction:rtl] lg:col-start-2" : "lg:col-start-1"}`}
        >
          <span className="inline-flex items-center rounded-full border border-[#391B68]/10 bg-[#391B68]/[0.06] px-4 py-2 text-[12px] font-black text-[#391B68]">
            {isArabic ? "رحلتك مع Success Academy" : "Your Success Academy journey"}
          </span>

          <h2 className="mt-5 text-[32px] font-black leading-[1.2] text-[#391B68] sm:text-4xl lg:text-[48px]">
            {isArabic ? "شوف رحلتك خطوة بخطوة" : copy.videoPreview.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[16px] font-bold leading-8 text-slate-600 lg:mx-0 lg:text-[18px]">
            {copy.videoPreview.subtitle}
          </p>

          <div className="mx-auto mt-6 flex w-fit items-center justify-center gap-2.5 lg:mx-0 lg:justify-start" aria-label={isArabic ? "مراحل الرحلة" : "Journey stages"}>
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EC911F] ${
                  index === activeSlide
                    ? "w-8 bg-gradient-to-r from-[#EC911F] to-[#E32F54] shadow-[0_3px_10px_rgba(227,47,84,0.2)]"
                    : "w-2.5 bg-[#391B68]/20 hover:bg-[#391B68]/40"
                }`}
                aria-label={`${isArabic ? "اعرض" : "Show"} ${slide.title}`}
                aria-current={index === activeSlide ? "step" : undefined}
              />
            ))}
          </div>

          <CtaLink href={bookingHref} locale={locale} source="journey_carousel" className="mx-auto mt-7 h-[56px] px-8 lg:mx-0">
            {copy.videoPreview.cta}
          </CtaLink>
        </div>

        <div className={`order-2 min-w-0 ${isArabic ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1"}`}>
          <div
            className="group relative mx-auto w-full max-w-[700px] rounded-[32px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EC911F]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") showPrevious();
              if (event.key === "ArrowRight") showNext();
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
            role="region"
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label={isArabic ? "رحلة التعلم" : "Learning journey"}
          >
            <div className="absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-[#391B68]/10 via-[#E32F54]/5 to-[#EC911F]/15 blur-2xl" />

            <div className="relative aspect-[7/4] overflow-hidden rounded-[26px] border border-[#391B68]/10 bg-[#291342] shadow-[0_28px_70px_rgba(57,27,104,0.2)] sm:rounded-[32px]">
              {slides.map((slide, index) => (
                <Image
                  key={slide.image}
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1023px) 100vw, 56vw"
                  className={`object-contain object-center transition-[opacity,transform] duration-700 ease-out ${
                    index === activeSlide ? "scale-100 opacity-100" : "pointer-events-none scale-[1.025] opacity-0"
                  }`}
                />
              ))}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#211035]/95 via-[#211035]/55 to-transparent" />

              <div className={`absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 ${isArabic ? "text-right [direction:rtl]" : "text-left"}`} aria-live="polite">
                <div className="flex items-end justify-between gap-5">
                  <div className="min-w-0">
                    <span className="text-[11px] font-black tracking-[0.16em] text-[#EC911F]">
                      {String(activeSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </span>
                    <h3 className="mt-1 text-[21px] font-black sm:text-[26px]">{slides[activeSlide].title}</h3>
                    <p className="mt-1 max-w-[470px] text-[13px] font-bold leading-6 text-white/80 sm:text-[15px]">
                      {slides[activeSlide].caption}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={showPrevious}
                      className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
                      aria-label={isArabic ? "الصورة السابقة" : "Previous image"}
                    >
                      <ArrowIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      className="grid h-11 w-11 place-items-center rounded-full bg-[#EC911F] text-white shadow-lg shadow-[#EC911F]/25 transition hover:-translate-y-0.5 hover:bg-[#E32F54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      aria-label={isArabic ? "الصورة التالية" : "Next image"}
                    >
                      <ArrowIcon direction="right" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={showPrevious}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#391B68]/15 bg-white text-[#391B68] shadow-sm transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
                aria-label={isArabic ? "الصورة السابقة" : "Previous image"}
              >
                <ArrowIcon direction="left" />
              </button>
              <div className="flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.image}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "w-7 bg-[#EC911F]" : "w-2.5 bg-[#391B68]/20"}`}
                    aria-label={`${isArabic ? "اعرض" : "Show"} ${slide.title}`}
                    aria-current={index === activeSlide ? "step" : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={showNext}
                className="grid h-11 w-11 place-items-center rounded-full bg-[#391B68] text-white shadow-sm transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
                aria-label={isArabic ? "الصورة التالية" : "Next image"}
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

