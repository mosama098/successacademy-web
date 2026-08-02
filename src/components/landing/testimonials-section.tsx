"use client";

import Script from "next/script";
import {
  createElement,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CtaLink } from "@/components/ui/cta-link";
import { bookingHref, type LocalizedSectionProps } from "./types";

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
  videoLabel: string;
  soundOn: string;
  soundOff: string;
  ctaHeadline: string;
  ctaSupport: string;
  cta: string;
  privacy: string;
  featured: Testimonial;
  supporting: Testimonial[];
};

type WistiaPlayerElement = HTMLElement & {
  muted: boolean;
  pause: () => void;
  play: () => Promise<void> | void;
};

type WistiaMuteChangeEvent = CustomEvent<{
  isMuted: boolean;
}>;

const wistiaMediaId = "doak9uwru1";
const wistiaSwatch =
  "https://fast.wistia.com/embed/medias/doak9uwru1/swatch";

const testimonialsContent: Record<"ar" | "en", TestimonialsContent> = {
  ar: {
    badge: "تجارب حقيقية",
    headingLead: "مش كلام تسويق…",
    headingHighlight: "دي تجارب ناس بدأت زيك",
    description:
      "طلاب دخلوا بأهداف مختلفة، لكن اتفقوا على فرق واحد: نظام واضح، متابعة حقيقية، وتطور حسّوه في استخدامهم للإنجليزي.",
    videoLabel: "تجارب طلاب حقيقية",
    soundOn: "تشغيل الصوت",
    soundOff: "كتم الصوت",
    ctaHeadline: "جاهز تبدأ قصتك أنت؟",
    ctaSupport:
      "ابدأ من مستواك الحقيقي، وإحنا نساعدك نحدد الطريق المناسب لهدفك.",
    cta: "ابدأ بتقييم مستواك مجانًا",
    privacy:
      "تم اختصار بعض الرسائل مع الحفاظ على معناها، وإخفاء البيانات الشخصية حفاظًا على خصوصية الطلاب.",
    featured: {
      category: [{ text: "تطور حقيقي" }],
      quote: [
        {
          text: "والله التطور ده إنتوا السبب فيه بجد… اعتمادي الأساسي كان على الكورس.",
        },
      ],
      source: [{ text: "طالبة في " }, { text: "Success Academy", ltr: true }],
    },
    supporting: [
      {
        category: [{ text: "سيستم واضح" }],
        quote: [
          {
            text: "أكتر حاجة عجبتني إن فيه سيستم، ومتابعة أول بأول، ومنهج نقدر نرجع له.",
          },
        ],
        source: [
          { text: "طالبة – " },
          { text: "B1", ltr: true },
          { text: " إلى " },
          { text: "B2", ltr: true },
        ],
      },
      {
        category: [{ text: "دعم ومتابعة" }],
        quote: [
          {
            text: "المتابعة كانت مختلفة جدًا… ولو عندي أي استفسار بلاقي رد بسهولة.",
          },
        ],
        source: [{ text: "طالبة – " }, { text: "Level B2", ltr: true }],
      },
      {
        category: [{ text: "هدف الـ " }, { text: "Speaking", ltr: true }],
        quote: [
          { text: "دخلت الكورس علشان أحسن الـ " },
          { text: "Speaking", ltr: true },
          { text: "، وفعلاً حققت الهدف." },
        ],
        source: [
          { text: "طالبة – " },
          { text: "Online Programme", ltr: true },
        ],
      },
      {
        category: [{ text: "تجربة أونلاين" }],
        quote: [
          {
            text: "دي كانت أول مرة أخد كورس أونلاين، وكانت من أحلى التجارب… وكانوا معانا في كل خطوة.",
          },
        ],
        source: [
          { text: "طالبة – " },
          { text: "Online Programme", ltr: true },
        ],
      },
      {
        category: [{ text: "تعلم عملي" }],
        quote: [
          {
            text: "الشرح كان بسيط، والأنشطة كانت ممتعة وساعدتني أفتكر الكلمات وأستخدمها بسهولة.",
          },
        ],
        source: [{ text: "طالبة في " }, { text: "Success Academy", ltr: true }],
      },
    ],
  },
  en: {
    badge: "Real Student Stories",
    headingLead: "Not Marketing Claims —",
    headingHighlight: "Real Experiences From Students Like You",
    description:
      "Students joined with different goals, but experienced the same difference: a clear system, real follow-up, and progress they could genuinely feel.",
    videoLabel: "Real Student Stories",
    soundOn: "Turn Sound On",
    soundOff: "Mute",
    ctaHeadline: "Ready to Start Your Own Story?",
    ctaSupport:
      "Start from your real level, and we’ll help you choose the right path for your goal.",
    cta: "Start Your Free Assessment",
    privacy:
      "Some messages have been shortened without changing their meaning, and personal details have been hidden to protect student privacy.",
    featured: {
      category: [{ text: "Real Progress" }],
      quote: [
        {
          text: "You are genuinely the reason behind this progress. I relied mainly on the course.",
        },
      ],
      source: [{ text: "Success Academy Student" }],
    },
    supporting: [
      {
        category: [{ text: "Clear System" }],
        quote: [
          {
            text: "What I liked most was having a clear system, continuous follow-up, and a course structure we could return to.",
          },
        ],
        source: [{ text: "B1 to B2 Student" }],
      },
      {
        category: [{ text: "Real Support" }],
        quote: [
          {
            text: "The follow-up was completely different. Whenever I had a question, I could easily get support.",
          },
        ],
        source: [{ text: "Level B2 Student" }],
      },
      {
        category: [{ text: "Speaking Goal" }],
        quote: [
          {
            text: "I joined to improve my speaking, and I genuinely achieved that goal.",
          },
        ],
        source: [{ text: "Online Programme Student" }],
      },
      {
        category: [{ text: "Online Experience" }],
        quote: [
          {
            text: "This was my first online course, and it became one of my best experiences. The team supported us at every step.",
          },
        ],
        source: [{ text: "Online Programme Student" }],
      },
      {
        category: [{ text: "Practical Learning" }],
        quote: [
          {
            text: "The explanations were simple, and the activities helped me remember and use new words more easily.",
          },
        ],
        source: [{ text: "Success Academy Student" }],
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

function QuoteIcon({ large = false }: { large?: boolean }) {
  return (
    <svg
      className={large ? "h-7 w-7" : "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M8.5 11H4.8A5.2 5.2 0 0 1 10 5.8V8a3 3 0 0 0-3 3v.2h1.5V17H3v-4.5A7.5 7.5 0 0 1 10.5 5v2A5.5 5.5 0 0 0 5 12.5V15h3.5v-4ZM19.5 11h-3.7A5.2 5.2 0 0 1 21 5.8V8a3 3 0 0 0-3 3v.2h1.5V17H14v-4.5A7.5 7.5 0 0 1 21.5 5v2a5.5 5.5 0 0 0-5.5 5.5V15h3.5v-4Z" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <>
          <path d="m17 9 4 4" />
          <path d="m21 9-4 4" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

export function TestimonialsSection({ locale }: LocalizedSectionProps) {
  const content = testimonialsContent[locale];
  const isArabic = locale === "ar";
  const testimonials = [content.featured, ...content.supporting];
  const playerRef = useRef<WistiaPlayerElement | null>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const sliderStageRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const isVisibleRef = useRef(false);
  const isPlayerReadyRef = useRef(false);
  const isMutedRef = useRef(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [autoplayCycle, setAutoplayCycle] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(media.matches);

    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);

    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    const syncVisibility = () =>
      setIsPageVisible(document.visibilityState === "visible");

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);

    return () =>
      document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    const stage = sliderStageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSliderVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.3,
        );
      },
      { threshold: [0, 0.3, 0.6] },
    );

    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      prefersReducedMotion ||
      !isSliderVisible ||
      !isPageVisible ||
      isSwiping
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveTestimonial(
        (current) => (current + 1) % testimonials.length,
      );
    }, 4500);

    return () => window.clearInterval(interval);
  }, [
    autoplayCycle,
    isPageVisible,
    isSliderVisible,
    isSwiping,
    prefersReducedMotion,
    testimonials.length,
  ]);

  useEffect(() => {
    const frame = videoFrameRef.current;
    const player = playerRef.current;

    if (!frame || !player) return;

    const safelyPlay = () => {
      if (!isPlayerReadyRef.current || !isVisibleRef.current) return;

      player.muted = isMutedRef.current;

      try {
        const result = player.play();
        if (result instanceof Promise) {
          void result.catch(() => undefined);
        }
      } catch {
        // The player can reject autoplay while its media pipeline is settling.
      }
    };

    const safelyPause = () => {
      if (!isPlayerReadyRef.current) return;

      try {
        player.pause();
      } catch {
        // Ignore a pause request made while the player is being initialized.
      }
    };

    const handleApiReady = () => {
      isPlayerReadyRef.current = true;
      isMutedRef.current = true;
      player.muted = true;
      setIsMuted(true);
      setIsPlayerReady(true);
      safelyPlay();
    };

    const handleMuteChange = (event: Event) => {
      const { isMuted: nextMuted } =
        (event as WistiaMuteChangeEvent).detail ?? {};

      if (typeof nextMuted !== "boolean") return;

      isMutedRef.current = nextMuted;
      setIsMuted(nextMuted);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current =
          entry.isIntersecting && entry.intersectionRatio >= 0.425;

        if (isVisibleRef.current) {
          safelyPlay();
        } else {
          safelyPause();
        }
      },
      { threshold: [0, 0.425, 0.75] },
    );

    player.addEventListener("api-ready", handleApiReady);
    player.addEventListener("mute-change", handleMuteChange);
    observer.observe(frame);

    return () => {
      observer.disconnect();
      safelyPause();
      player.removeEventListener("api-ready", handleApiReady);
      player.removeEventListener("mute-change", handleMuteChange);
      isVisibleRef.current = false;
      isPlayerReadyRef.current = false;
    };
  }, []);

  const toggleSound = () => {
    const player = playerRef.current;
    if (!player || !isPlayerReadyRef.current) return;

    const nextMuted = !player.muted;
    player.muted = nextMuted;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (isVisibleRef.current) {
      try {
        const result = player.play();
        if (result instanceof Promise) {
          void result.catch(() => undefined);
        }
      } catch {
        // The sound state remains valid even if playback is momentarily blocked.
      }
    }
  };


  const showPreviousTestimonial = () => {
    setActiveTestimonial(
      (current) => (current - 1 + testimonials.length) % testimonials.length,
    );
    setAutoplayCycle((current) => current + 1);
  };

  const showNextTestimonial = () => {
    setActiveTestimonial((current) => (current + 1) % testimonials.length);
    setAutoplayCycle((current) => current + 1);
  };

  const showTestimonial = (index: number) => {
    setActiveTestimonial(index);
    setAutoplayCycle((current) => current + 1);
  };

  const handleCarouselPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
    setIsSwiping(true);
  };

  const handleCarouselPointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;

    if (start) {
      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;

      if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        const movedTowardNext = isArabic ? deltaX > 0 : deltaX < 0;

        if (movedTowardNext) {
          showNextTestimonial();
        } else {
          showPreviousTestimonial();
        }
      }
    }

    setIsSwiping(false);
  };

  return (
    <section
      id="student-stories"
      className="relative overflow-hidden bg-[#391B68] px-5 pb-[calc(112px+env(safe-area-inset-bottom))] pt-14 text-white sm:px-6 sm:pt-16 md:py-16 lg:px-8 lg:py-12"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Script
        id="wistia-aurora-player"
        src="https://fast.wistia.com/player.js"
        strategy="afterInteractive"
      />
      <Script
        id={`wistia-media-${wistiaMediaId}`}
        src={`https://fast.wistia.com/embed/${wistiaMediaId}.js`}
        strategy="afterInteractive"
        type="module"
      />

      <div
        className="pointer-events-none absolute start-[8%] top-[28%] h-52 w-52 rounded-full bg-[#EC911F]/[0.08] blur-[72px]"
        aria-hidden="true"
      />

      <div
        className={`relative mx-auto grid max-w-[1260px] items-start gap-x-10 gap-y-4 lg:gap-x-14 ${
          isArabic
            ? "lg:grid-cols-[320px_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(0,1fr)_320px]"
        }`}
        dir="ltr"
      >
        <header
          className={`max-w-[820px] lg:row-start-1 ${
            isArabic ? "lg:col-start-2" : "lg:col-start-1"
          }`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <span className="inline-flex rounded-full border border-[#EC911F]/35 bg-[#EC911F]/10 px-4 py-1.5 text-[13px] font-black text-[#f2b35f] sm:text-[14px]">
            {content.badge}
          </span>
          <h2 className="mt-3.5 text-[30px] font-black leading-[1.23] sm:text-[38px] lg:text-[42px] lg:leading-[1.17]">
            <span className="block text-white lg:whitespace-nowrap">
              {content.headingLead}
            </span>
            <span className="mt-1 block text-[#EC911F] lg:whitespace-nowrap">
              {content.headingHighlight}
            </span>
          </h2>
          <p className="mt-3 max-w-[720px] text-[15px] font-bold leading-[1.65] text-white/72 sm:text-[16px]">
            {content.description}
          </p>
        </header>

        <div
          className={`mx-auto mt-1 w-full max-w-[340px] md:max-w-[330px] lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-[320px] lg:self-center ${
            isArabic ? "lg:col-start-1" : "lg:col-start-2"
          }`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div
            ref={videoFrameRef}
            className="relative aspect-[9/16] overflow-hidden rounded-[28px] border border-[#EC911F]/30 bg-[#24103f] shadow-[0_26px_65px_rgba(10,3,22,0.38)]"
            style={{
              backgroundImage: `url("${wistiaSwatch}")`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          >
            <div
              className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[#EC911F]/10 blur-3xl"
              aria-hidden="true"
            />

            {createElement("wistia-player", {
              ref: (node: WistiaPlayerElement | null) => {
                playerRef.current = node;
              },
              "media-id": wistiaMediaId,
              aspect: "0.5625",
              muted: true,
              preload: "metadata",
              "fit-strategy": "contain",
              "end-video-behavior": "loop",
              "player-color": "#EC911F",
              "big-play-button": "false",
              "controls-visible-on-load": "false",
              "fullscreen-control": "true",
              "play-bar-control": "true",
              "play-pause-control": "true",
              "volume-control": "false",
              "rounded-player": "28",
              className: "relative z-10 block h-full w-full",
              style: {
                height: "100%",
                width: "100%",
              },
            })}

            <span className="pointer-events-none absolute inset-x-4 top-4 z-30 inline-flex w-fit rounded-full border border-white/15 bg-[#24103f]/80 px-3 py-2 text-[11px] font-black text-white shadow-sm backdrop-blur sm:text-[12px]">
              {content.videoLabel}
            </span>

            <button
              type="button"
              onClick={toggleSound}
              disabled={!isPlayerReady}
              aria-label={isMuted ? content.soundOn : content.soundOff}
              aria-pressed={!isMuted}
              className="absolute bottom-4 end-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-white/18 bg-[#24103f]/90 px-3.5 py-2.5 text-[12px] font-black text-white shadow-[0_8px_22px_rgba(0,0,0,0.28)] backdrop-blur transition-[background-color,border-color,opacity,transform] duration-200 hover:-translate-y-0.5 hover:border-[#EC911F]/65 hover:bg-[#391B68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] active:translate-y-0 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <SpeakerIcon muted={isMuted} />
              <span>{isMuted ? content.soundOn : content.soundOff}</span>
            </button>
          </div>
        </div>

        <div
          className={`${isArabic ? "lg:col-start-2" : "lg:col-start-1"} lg:row-start-2`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div
            className="touch-pan-y"
            onPointerDown={handleCarouselPointerDown}
            onPointerUp={handleCarouselPointerUp}
            onPointerCancel={() => {
              swipeStartRef.current = null;
              setIsSwiping(false);
            }}
          >
            <div
              ref={sliderStageRef}
              className="relative h-[292px] overflow-hidden sm:h-[275px] lg:h-[255px]"
              aria-roledescription={
                isArabic ? "عارض شهادات الطلاب" : "testimonial carousel"
              }
            >
              {testimonials.map((testimonial, index) => {
                const position =
                  (index - activeTestimonial + testimonials.length) %
                  testimonials.length;
                const isActive = position === 0;
                const isNext = position === 1;
                const isFarNext = position === 2;
                const isPrevious = position === testimonials.length - 1;
                const isFarPrevious = position === testimonials.length - 2;
                const isSideCard = isPrevious || isNext;
                const isFarCard = isFarPrevious || isFarNext;
                const opacity = isActive
                  ? 1
                  : isSideCard
                    ? 0.78
                    : isFarCard
                      ? 0.3
                      : 0;
                const transform =
                  isActive
                    ? "translate(-50%, 0px) scale(1)"
                    : isSideCard
                      ? "translate(-50%, 14px) scale(0.92)"
                      : isFarCard
                        ? "translate(-50%, 26px) scale(0.82)"
                        : "translate(-50%, 34px) scale(0.78)";
                const leftClass = isActive
                  ? "left-1/2"
                  : isPrevious
                    ? "left-[-18%] sm:left-[20%] lg:left-[33%]"
                    : isNext
                      ? "left-[118%] sm:left-[80%] lg:left-[67%]"
                      : isFarPrevious
                        ? "left-[-42%] sm:left-[7%] lg:left-[20%]"
                        : isFarNext
                          ? "left-[142%] sm:left-[93%] lg:left-[80%]"
                          : "left-1/2";

                return (
                  <article
                    key={index}
                    role="group"
                    aria-label={
                      isArabic
                        ? `الشهادة ${index + 1} من ${testimonials.length}`
                        : `Testimonial ${index + 1} of ${testimonials.length}`
                    }
                    aria-hidden={!isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={`absolute top-0 flex h-[260px] w-[74vw] max-w-[250px] flex-col rounded-[20px] border bg-[#F8F6FB] p-[18px] text-[#391B68] shadow-[0_14px_34px_rgba(10,3,22,0.18)] will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EC911F] sm:h-[245px] sm:w-[230px] sm:p-[18px] lg:h-[235px] lg:w-[220px] lg:p-4 ${leftClass} ${
                      isActive
                        ? "border-[#EC911F]/55 shadow-[0_18px_42px_rgba(10,3,22,0.25),0_0_18px_rgba(236,145,31,0.08)]"
                        : "border-[#d9cee8] shadow-[0_10px_24px_rgba(10,3,22,0.14)]"
                    } ${
                      prefersReducedMotion
                        ? "transition-none"
                        : "transition-[left,transform,opacity] duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    }`}
                    style={{
                      opacity,
                      pointerEvents: isActive ? "auto" : "none",
                      transform,
                      zIndex: isActive
                        ? 40
                        : isSideCard
                          ? 30
                          : isFarCard
                            ? 20
                            : 0,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] font-black text-[#EC911F] sm:text-[12px]">
                        <RichText parts={testimonial.category} />
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eee9f5] text-[#391B68]/28">
                        <QuoteIcon />
                      </span>
                    </div>
                    <blockquote className="mt-2.5 text-[15.5px] font-black leading-[1.58] text-[#391B68] sm:text-[16px] lg:text-[16px] lg:leading-[1.52]">
                      <RichText parts={testimonial.quote} />
                    </blockquote>
                    <p className="mt-auto border-t border-[#391B68]/10 pt-2 text-[11.5px] font-bold text-[#6d6578] sm:text-[12px]">
                      <RichText parts={testimonial.source} />
                    </p>
                  </article>
                );
              })}
            </div>

            <div
              className="mt-1 flex items-center justify-center gap-0.5"
              aria-label={isArabic ? "موضع الشهادة" : "Testimonial position"}
            >
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => showTestimonial(index)}
                  aria-label={
                    isArabic
                      ? `عرض الشهادة ${index + 1} من ${testimonials.length}`
                      : `Show testimonial ${index + 1} of ${testimonials.length}`
                  }
                  aria-current={
                    index === activeTestimonial ? "true" : undefined
                  }
                  className="group inline-flex h-11 w-8 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#EC911F]"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-[background-color,width] duration-200 ${
                      index === activeTestimonial
                        ? "w-6 bg-[#EC911F]"
                        : "w-2 bg-white/28 group-hover:bg-white/55"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <p className="mt-2 max-w-[700px] text-[12px] font-bold leading-[1.55] text-white/72 sm:text-[13px]">
            {content.privacy}
          </p>
        </div>
      </div>

      <div
        className="relative mx-auto mt-2 max-w-[1260px] rounded-[22px] border border-[#d9cee8] bg-[#F8F6FB] p-[14px] text-[#391B68] shadow-[0_14px_32px_rgba(10,3,22,0.18)] sm:p-5 lg:flex lg:min-h-[105px] lg:items-center lg:justify-between lg:gap-8 lg:px-7 lg:py-4"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="min-w-0">
          <h3 className="text-[27px] font-black leading-[1.18] text-[#391B68] sm:text-[29px] lg:text-[31px]">
            {content.ctaHeadline}
          </h3>
          <p className="mt-1.5 max-w-[650px] text-[14px] font-bold leading-[1.5] text-[#6d6578] sm:text-[15px]">
            {content.ctaSupport}
          </p>
        </div>
        <CtaLink
          href={bookingHref}
          locale={locale}
          source="student_testimonials"
          className="mt-3 h-[52px] w-full shrink-0 rounded-[16px] px-7 text-[16px] shadow-[0_10px_24px_rgba(236,145,31,0.28)] lg:mt-0 lg:w-auto"
        >
          {content.cta}
        </CtaLink>
      </div>
    </section>
  );
}

