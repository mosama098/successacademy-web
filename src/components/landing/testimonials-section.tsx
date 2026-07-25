"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LandingSectionProps } from "./types";

type TextPart = {
  text: string;
  ltr?: boolean;
};

type Testimonial = {
  category: TextPart[];
  quote: TextPart[];
  source: TextPart[];
};

type TestimonialsContent = {
  badge: string;
  headingLead: string;
  headingHighlight: string;
  description: string;
  videoEyebrow: string;
  videoLabel: string;
  videoPlay: string;
  videoDuration: string;
  ctaSupport: string;
  cta: string;
  privacy: string;
  closeModal: string;
  videoUnavailable: string;
  testimonials: Testimonial[];
};

const videoPath = "/videos/student-stories.mp4";

const testimonialsContent: Record<"ar" | "en", TestimonialsContent> = {
  ar: {
    badge: "تجارب حقيقية",
    headingLead: "مش بنقولك وبس…",
    headingHighlight: "شوف طلابنا بيقولوا إيه",
    description: "تجارب حقيقية من طلاب بدأوا، كملوا، وشافوا فرق واضح في مستواهم وثقتهم.",
    videoEyebrow: "من قلب التجربة",
    videoLabel: "طلاب حقيقيون… وتجارب حقيقية",
    videoPlay: "شاهد تجارب الطلاب",
    videoDuration: "تجارب متعددة في فيديو واحد",
    ctaSupport: "جاهز تعرف البداية المناسبة لمستواك وهدفك؟",
    cta: "ابدأ بتقييم مستواك مجانًا",
    privacy: "تم اختصار بعض الرسائل مع الحفاظ على معناها، وإخفاء البيانات الشخصية حفاظًا على خصوصية الطلاب.",
    closeModal: "إغلاق فيديو تجارب الطلاب",
    videoUnavailable: "سيتم إضافة فيديو تجارب الطلاب قريبًا.",
    testimonials: [
      {
        category: [{ text: "تطور ملحوظ" }],
        quote: [{ text: "والله التطور ده إنتوا السبب فيه بجد… اعتمادي الأساسي كان على الكورس." }],
        source: [{ text: "طالبة في " }, { text: "Success Academy", ltr: true }],
      },
      {
        category: [{ text: "سيستم ومتابعة" }],
        quote: [{ text: "أكتر حاجة عجبتني إن فيه سيستم، ومتابعة أول بأول، ومنهج نقدر نرجع له." }],
        source: [{ text: "طالبة – " }, { text: "B1", ltr: true }, { text: " إلى " }, { text: "B2", ltr: true }],
      },
      {
        category: [{ text: "دعم حقيقي" }],
        quote: [{ text: "المتابعة كانت مختلفة جدًا… ولو عندي أي استفسار بلاقي رد بسهولة." }],
        source: [{ text: "طالبة – " }, { text: "Level B2", ltr: true }],
      },
      {
        category: [{ text: "هدف الـ " }, { text: "Speaking", ltr: true }],
        quote: [{ text: "دخلت الكورس علشان أحسن الـ " }, { text: "Speaking", ltr: true }, { text: "، وفعلاً حققت الهدف." }],
        source: [{ text: "طالبة – " }, { text: "Online Programme", ltr: true }],
      },
    ],
  },
  en: {
    badge: "Real Student Stories",
    headingLead: "We Don’t Just Say It —",
    headingHighlight: "Hear It From Our Students",
    description: "Real experiences from students who started, stayed consistent, and saw a clear difference in their English and confidence.",
    videoEyebrow: "From the Real Experience",
    videoLabel: "Real Students. Real Experiences.",
    videoPlay: "Watch Student Stories",
    videoDuration: "Several student stories in one video",
    ctaSupport: "Ready to discover the right starting point for your level and goal?",
    cta: "Start Your Free Assessment",
    privacy: "Some messages have been shortened without changing their meaning, and personal details have been hidden to protect student privacy.",
    closeModal: "Close student stories video",
    videoUnavailable: "The student stories video will be available soon.",
    testimonials: [
      {
        category: [{ text: "Clear Progress" }],
        quote: [{ text: "You are genuinely the reason behind this progress. I relied mainly on the course." }],
        source: [{ text: "Success Academy Student" }],
      },
      {
        category: [{ text: "System and Follow-up" }],
        quote: [{ text: "What I liked most was having a clear system, continuous follow-up, and a course structure we could return to." }],
        source: [{ text: "B1 to B2 Student" }],
      },
      {
        category: [{ text: "Real Support" }],
        quote: [{ text: "The follow-up was completely different. Whenever I had a question, I could easily get support." }],
        source: [{ text: "Level B2 Student" }],
      },
      {
        category: [{ text: "Speaking Goal" }],
        quote: [{ text: "I joined to improve my speaking, and I genuinely achieved that goal." }],
        source: [{ text: "Online Programme Student" }],
      },
    ],
  },
};

function RichText({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.ltr ? (
          <span key={`${part.text}-${index}`} className="[unicode-bidi:isolate]" dir="ltr">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function PlayIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.5 5.6v12.8L18 12 8.5 5.6Z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8.5 11H4.8A5.2 5.2 0 0 1 10 5.8V8a3 3 0 0 0-3 3v.2h1.5V17H3v-4.5A7.5 7.5 0 0 1 10.5 5v2A5.5 5.5 0 0 0 5 12.5V15h3.5v-4ZM19.5 11h-3.7A5.2 5.2 0 0 1 21 5.8V8a3 3 0 0 0-3 3v.2h1.5V17H14v-4.5A7.5 7.5 0 0 1 21.5 5v2a5.5 5.5 0 0 0-5.5 5.5V15h3.5v-4Z" />
    </svg>
  );
}

export function TestimonialsSection({ locale }: LandingSectionProps) {
  const content = testimonialsContent[locale];
  const isArabic = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      videoRef.current?.pause();
      document.removeEventListener("keydown", handleKeyDown);
      playButtonRef.current?.focus();
    };
  }, [isOpen]);

  const openVideo = () => {
    setVideoUnavailable(false);
    setIsOpen(true);
  };

  const closeVideo = () => setIsOpen(false);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) closeVideo();
  };

  return (
    <section
      id="student-stories"
      className="relative overflow-hidden bg-[#391B68] px-5 pb-[calc(112px+env(safe-area-inset-bottom))] pt-16 text-white sm:px-6 md:py-20 lg:px-8 lg:py-24 xl:py-28"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute bottom-[14%] left-[18%] h-56 w-56 rounded-full bg-[#EC911F]/[0.08] blur-[80px]" aria-hidden="true" />

      <div
        className={`relative mx-auto grid max-w-[1220px] gap-x-14 gap-y-8 lg:gap-x-16 ${
          isArabic
            ? "lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]"
            : "lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]"
        }`}
      >
        <header
          className={`${isArabic ? "lg:col-start-2" : "lg:col-start-1"} lg:row-start-1`}
        >
          <span className="inline-flex rounded-full border border-[#EC911F]/35 bg-[#EC911F]/10 px-4 py-2 text-[13px] font-black text-[#f4b663] sm:text-[14px]">
            {content.badge}
          </span>
          <h2 className="mt-4 max-w-[720px] text-[32px] font-black leading-[1.24] sm:text-[40px] lg:text-[48px] lg:leading-[1.16]">
            <span className="block text-white">{content.headingLead}</span>
            <span className="mt-1 block text-[#EC911F]">{content.headingHighlight}</span>
          </h2>
          <p className="mt-4 max-w-[690px] text-[15px] font-bold leading-7 text-white/72 sm:text-[17px] sm:leading-8 lg:text-[18px]">
            {content.description}
          </p>
        </header>

        <div
          className={`${isArabic ? "lg:col-start-1" : "lg:col-start-2"} mx-auto w-full max-w-[320px] lg:row-span-2 lg:row-start-1 lg:max-w-[360px] lg:self-center`}
        >
          <button
            ref={playButtonRef}
            type="button"
            onClick={openVideo}
            aria-haspopup="dialog"
            aria-label={content.videoPlay}
            className="group relative block aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-[26px] border border-white/16 bg-[#24103f] text-start shadow-[0_28px_64px_rgba(12,4,24,0.38)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[#EC911F]/55 hover:shadow-[0_32px_72px_rgba(12,4,24,0.46)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EC911F] active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <span className="absolute inset-0 bg-[#24103f]" aria-hidden="true" />
            <span className="absolute -left-20 top-[18%] h-64 w-64 rounded-full bg-[#EC911F]/12 blur-[62px]" aria-hidden="true" />
            <span className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/65 to-transparent" aria-hidden="true" />

            <span className="absolute inset-x-5 top-5 z-10 text-start">
              <span className="text-[12px] font-black text-[#f4b663] sm:text-[13px]">{content.videoEyebrow}</span>
              <span className="mt-2 block max-w-[250px] text-[23px] font-black leading-[1.3] text-white sm:text-[26px]">
                {content.videoLabel}
              </span>
            </span>

            <span className="absolute inset-0 z-10 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-[#EC911F] text-white shadow-[0_12px_30px_rgba(236,145,31,0.32)] transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none">
                <PlayIcon />
              </span>
            </span>

            <span className="absolute inset-x-5 bottom-5 z-10">
              <span className="block text-[15px] font-black text-white">{content.videoPlay}</span>
              <span className="mt-1 block text-[12px] font-bold text-white/65">{content.videoDuration}</span>
            </span>
          </button>
        </div>

        <div className={`${isArabic ? "lg:col-start-2" : "lg:col-start-1"} lg:row-start-2`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {content.testimonials.map((testimonial, index) => (
              <article
                key={index}
                className="group rounded-[20px] border border-white/10 bg-[#F8F6FB] p-5 text-[#391B68] shadow-[0_12px_30px_rgba(12,4,24,0.16)] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#EC911F]/35 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] font-black text-[#EC911F] sm:text-[13px]">
                    <RichText parts={testimonial.category} />
                  </span>
                  <span className="text-[#391B68]/35">
                    <QuoteIcon />
                  </span>
                </div>
                <blockquote className="mt-3 text-[16px] font-black leading-7 sm:text-[17px]">
                  <RichText parts={testimonial.quote} />
                </blockquote>
                <p className="mt-4 border-t border-[#391B68]/10 pt-3 text-[12px] font-bold text-[#665d75] sm:text-[13px]">
                  <RichText parts={testimonial.source} />
                </p>
              </article>
            ))}
          </div>

          <p className="mt-5 max-w-[720px] text-[12px] font-bold leading-6 text-white/55 sm:text-[13px]">
            {content.privacy}
          </p>

          <div className="mt-6 lg:flex lg:items-center lg:gap-5">
            <p className="mb-3 text-[14px] font-bold leading-6 text-white/72 lg:mb-0 lg:max-w-[320px]">
              {content.ctaSupport}
            </p>
            <CtaLink
              href={bookingHref}
              locale={locale}
              source="student_testimonials"
              className="h-[54px] w-full shrink-0 rounded-[16px] px-7 text-[16px] shadow-[0_10px_24px_rgba(236,145,31,0.2)] sm:w-auto"
            >
              {content.cta}
            </CtaLink>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#0b0710]/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={content.videoLabel}
          onMouseDown={handleBackdropClick}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-[430px] items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeVideo}
              aria-label={content.closeModal}
              className="absolute end-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/65 text-2xl text-white transition hover:bg-[#391B68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
            >
              <span aria-hidden="true">×</span>
            </button>

            {videoUnavailable ? (
              <div className="grid aspect-[9/16] w-full place-items-center bg-[#24103f] px-8 text-center">
                <div>
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EC911F]/15 text-[#EC911F]">
                    <PlayIcon />
                  </span>
                  <p className="mt-5 text-[18px] font-black leading-8 text-white">{content.videoUnavailable}</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="max-h-[92vh] w-full bg-black object-contain"
                src={videoPath}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onError={() => setVideoUnavailable(true)}
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
