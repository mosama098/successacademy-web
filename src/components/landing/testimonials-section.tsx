
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
    badge: "طھط¬ط§ط±ط¨ ط­ظ‚ظٹظ‚ظٹط©",
    headingLead: "ظ…ط´ ظƒظ„ط§ظ… طھط³ظˆظٹظ‚â€¦",
    headingHighlight: "ط¯ظٹ طھط¬ط§ط±ط¨ ظ†ط§ط³ ط¨ط¯ط£طھ ط²ظٹظƒ",
    description:
      "ط·ظ„ط§ط¨ ط¯ط®ظ„ظˆط§ ط¨ط£ظ‡ط¯ط§ظپ ظ…ط®طھظ„ظپط©طŒ ظ„ظƒظ† ط§طھظپظ‚ظˆط§ ط¹ظ„ظ‰ ظپط±ظ‚ ظˆط§ط­ط¯: ظ†ط¸ط§ظ… ظˆط§ط¶ط­طŒ ظ…طھط§ط¨ط¹ط© ط­ظ‚ظٹظ‚ظٹط©طŒ ظˆطھط·ظˆط± ط­ط³ظ‘ظˆظ‡ ظپظٹ ط§ط³طھط®ط¯ط§ظ…ظ‡ظ… ظ„ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ.",
    videoLabel: "طھط¬ط§ط±ط¨ ط·ظ„ط§ط¨ ط­ظ‚ظٹظ‚ظٹط©",
    soundOn: "طھط´ط؛ظٹظ„ ط§ظ„طµظˆطھ",
    soundOff: "ظƒطھظ… ط§ظ„طµظˆطھ",
    ctaHeadline: "ط¬ط§ظ‡ط² طھط¨ط¯ط£ ظ‚طµطھظƒ ط£ظ†طھطں",
    ctaSupport:
      "ط§ط¨ط¯ط£ ظ…ظ† ظ…ط³طھظˆط§ظƒ ط§ظ„ط­ظ‚ظٹظ‚ظٹطŒ ظˆط¥ط­ظ†ط§ ظ†ط³ط§ط¹ط¯ظƒ طھط­ط¯ط¯ ط§ظ„ط·ط±ظٹظ‚ ط§ظ„ظ…ظ†ط§ط³ط¨ ظ„ظ‡ط¯ظپظƒ.",
    cta: "ط§ط¨ط¯ط£ ط¨طھظ‚ظٹظٹظ… ظ…ط³طھظˆط§ظƒ ظ…ط¬ط§ظ†ظ‹ط§",
    privacy:
      "طھظ… ط§ط®طھطµط§ط± ط¨ط¹ط¶ ط§ظ„ط±ط³ط§ط¦ظ„ ظ…ط¹ ط§ظ„ط­ظپط§ط¸ ط¹ظ„ظ‰ ظ…ط¹ظ†ط§ظ‡ط§طŒ ظˆط¥ط®ظپط§ط، ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ط®طµظٹط© ط­ظپط§ط¸ظ‹ط§ ط¹ظ„ظ‰ ط®طµظˆطµظٹط© ط§ظ„ط·ظ„ط§ط¨.",
    featured: {
      category: [{ text: "طھط·ظˆط± ط­ظ‚ظٹظ‚ظٹ" }],
      quote: [
        {
          text: "ظˆط§ظ„ظ„ظ‡ ط§ظ„طھط·ظˆط± ط¯ظ‡ ط¥ظ†طھظˆط§ ط§ظ„ط³ط¨ط¨ ظپظٹظ‡ ط¨ط¬ط¯â€¦ ط§ط¹طھظ…ط§ط¯ظٹ ط§ظ„ط£ط³ط§ط³ظٹ ظƒط§ظ† ط¹ظ„ظ‰ ط§ظ„ظƒظˆط±ط³.",
        },
      ],
      source: [{ text: "ط·ط§ظ„ط¨ط© ظپظٹ " }, { text: "Success Academy", ltr: true }],
    },
    supporting: [
      {
        category: [{ text: "ط³ظٹط³طھظ… ظˆط§ط¶ط­" }],
        quote: [
          {
            text: "ط£ظƒطھط± ط­ط§ط¬ط© ط¹ط¬ط¨طھظ†ظٹ ط¥ظ† ظپظٹظ‡ ط³ظٹط³طھظ…طŒ ظˆظ…طھط§ط¨ط¹ط© ط£ظˆظ„ ط¨ط£ظˆظ„طŒ ظˆظ…ظ†ظ‡ط¬ ظ†ظ‚ط¯ط± ظ†ط±ط¬ط¹ ظ„ظ‡.",
          },
        ],
        source: [
          { text: "ط·ط§ظ„ط¨ط© â€“ " },
          { text: "B1", ltr: true },
          { text: " ط¥ظ„ظ‰ " },
          { text: "B2", ltr: true },
        ],
      },
      {
        category: [{ text: "ط¯ط¹ظ… ظˆظ…طھط§ط¨ط¹ط©" }],
        quote: [
          {
            text: "ط§ظ„ظ…طھط§ط¨ط¹ط© ظƒط§ظ†طھ ظ…ط®طھظ„ظپط© ط¬ط¯ظ‹ط§â€¦ ظˆظ„ظˆ ط¹ظ†ط¯ظٹ ط£ظٹ ط§ط³طھظپط³ط§ط± ط¨ظ„ط§ظ‚ظٹ ط±ط¯ ط¨ط³ظ‡ظˆظ„ط©.",
          },
        ],
        source: [{ text: "ط·ط§ظ„ط¨ط© â€“ " }, { text: "Level B2", ltr: true }],
      },
      {
        category: [{ text: "ظ‡ط¯ظپ ط§ظ„ظ€ " }, { text: "Speaking", ltr: true }],
        quote: [
          { text: "ط¯ط®ظ„طھ ط§ظ„ظƒظˆط±ط³ ط¹ظ„ط´ط§ظ† ط£ط­ط³ظ† ط§ظ„ظ€ " },
          { text: "Speaking", ltr: true },
          { text: "طŒ ظˆظپط¹ظ„ط§ظ‹ ط­ظ‚ظ‚طھ ط§ظ„ظ‡ط¯ظپ." },
        ],
        source: [
          { text: "ط·ط§ظ„ط¨ط© â€“ " },
          { text: "Online Programme", ltr: true },
        ],
      },
      {
        category: [{ text: "طھط¬ط±ط¨ط© ط£ظˆظ†ظ„ط§ظٹظ†" }],
        quote: [
          {
            text: "ط¯ظٹ ظƒط§ظ†طھ ط£ظˆظ„ ظ…ط±ط© ط£ط®ط¯ ظƒظˆط±ط³ ط£ظˆظ†ظ„ط§ظٹظ†طŒ ظˆظƒط§ظ†طھ ظ…ظ† ط£ط­ظ„ظ‰ ط§ظ„طھط¬ط§ط±ط¨â€¦ ظˆظƒط§ظ†ظˆط§ ظ…ط¹ط§ظ†ط§ ظپظٹ ظƒظ„ ط®ط·ظˆط©.",
          },
        ],
        source: [
          { text: "ط·ط§ظ„ط¨ط© â€“ " },
          { text: "Online Programme", ltr: true },
        ],
      },
      {
        category: [{ text: "طھط¹ظ„ظ… ط¹ظ…ظ„ظٹ" }],
        quote: [
          {
            text: "ط§ظ„ط´ط±ط­ ظƒط§ظ† ط¨ط³ظٹط·طŒ ظˆط§ظ„ط£ظ†ط´ط·ط© ظƒط§ظ†طھ ظ…ظ…طھط¹ط© ظˆط³ط§ط¹ط¯طھظ†ظٹ ط£ظپطھظƒط± ط§ظ„ظƒظ„ظ…ط§طھ ظˆط£ط³طھط®ط¯ظ…ظ‡ط§ ط¨ط³ظ‡ظˆظ„ط©.",
          },
        ],
        source: [{ text: "ط·ط§ظ„ط¨ط© ظپظٹ " }, { text: "Success Academy", ltr: true }],
      },
    ],
  },
  en: {
    badge: "Real Student Stories",
    headingLead: "Not Marketing Claims â€”",
    headingHighlight: "Real Experiences From Students Like You",
    description:
      "Students joined with different goals, but experienced the same difference: a clear system, real follow-up, and progress they could genuinely feel.",
    videoLabel: "Real Student Stories",
    soundOn: "Turn Sound On",
    soundOff: "Mute",
    ctaHeadline: "Ready to Start Your Own Story?",
    ctaSupport:
      "Start from your real level, and weâ€™ll help you identify the right path for your goal.",
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
            text: "This was my first online course, and it became one of my best experiences. The team was with us at every step.",
          },
        ],
        source: [{ text: "Online Programme Student" }],
      },
      {
        category: [{ text: "Practical Learning" }],
        quote: [
          {
            text: "The explanations were clear, and the activities helped me remember and use the language more easily.",
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

function CarouselArrow({ direction }: { direction: "left" | "right" }) {
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
      {direction === "left" ? (
        <>
          <path d="m15 18-6-6 6-6" />
          <path d="M21 12H9" />
        </>
      ) : (
        <>
          <path d="m9 18 6-6-6-6" />
          <path d="M3 12h12" />
        </>
      )}
    </svg>
  );
}

export function TestimonialsSection({ locale }: LandingSectionProps) {
  const content = testimonialsContent[locale];
  const isArabic = locale === "ar";
  const testimonials = [content.featured, ...content.supporting];
  const playerRef = useRef<WistiaPlayerElement | null>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const carouselHoveredRef = useRef(false);
  const carouselFocusedRef = useRef(false);
  const isVisibleRef = useRef(false);
  const isPlayerReadyRef = useRef(false);
  const isMutedRef = useRef(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
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
    if (prefersReducedMotion || isCarouselPaused || !isPageVisible) return;

    const interval = window.setInterval(() => {
      setActiveTestimonial(
        (current) => (current + 1) % testimonials.length,
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, [
    isCarouselPaused,
    isPageVisible,
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
  };

  const showNextTestimonial = () => {
    setActiveTestimonial((current) => (current + 1) % testimonials.length);
  };

  const handleCarouselPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
    setIsCarouselPaused(true);
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

    setIsCarouselPaused(
      carouselHoveredRef.current || carouselFocusedRef.current,
    );
  };

  return (
    <section
      id="student-stories"
      className="relative overflow-hidden bg-[#391B68] px-5 pb-[calc(112px+env(safe-area-inset-bottom))] pt-14 text-white sm:px-6 sm:pt-16 md:py-16 lg:px-8 lg:py-14"
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
        className={`relative mx-auto grid max-w-[1240px] items-start gap-x-10 gap-y-4 lg:gap-x-12 ${
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
          <h2 className="mt-3.5 text-[30px] font-black leading-[1.23] sm:text-[38px] lg:text-[40px] lg:leading-[1.17]">
            <span className="block text-white lg:whitespace-nowrap">
              {content.headingLead}
            </span>
            <span className="mt-1 block text-[#EC911F] lg:whitespace-nowrap">
              {content.headingHighlight}
            </span>
          </h2>
          <p className="mt-3 max-w-[620px] text-[15px] font-bold leading-[1.65] text-white/72 sm:text-[16px]">
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
            onMouseEnter={() => {
              carouselHoveredRef.current = true;
              setIsCarouselPaused(true);
            }}
            onMouseLeave={() => {
              carouselHoveredRef.current = false;
              setIsCarouselPaused(carouselFocusedRef.current);
            }}
            onFocusCapture={() => {
              carouselFocusedRef.current = true;
              setIsCarouselPaused(true);
            }}
            onBlurCapture={(event) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              carouselFocusedRef.current = false;
              setIsCarouselPaused(carouselHoveredRef.current);
            }}
            onPointerDown={handleCarouselPointerDown}
            onPointerUp={handleCarouselPointerUp}
            onPointerCancel={() => {
              swipeStartRef.current = null;
              setIsCarouselPaused(
                carouselHoveredRef.current || carouselFocusedRef.current,
              );
            }}
          >
            <div
              className="relative h-[280px] sm:h-[290px] lg:h-[300px]"
              aria-roledescription={isArabic ? "ط¹ط§ط±ط¶ ط´ظ‡ط§ط¯ط§طھ" : "testimonial carousel"}
            >
              {testimonials.map((testimonial, index) => {
                const position =
                  (index - activeTestimonial + testimonials.length) %
                  testimonials.length;
                const isActive = position === 0;
                const transforms = [
                  "translateY(0px) scale(1)",
                  "translateY(22px) scale(0.96)",
                  "translateY(43px) scale(0.92)",
                  "translateY(61px) scale(0.88)",
                ];
                const opacities = [1, 0.82, 0.58, 0.25];
                const isInVisibleStack = position <= 3;

                return (
                  <article
                    key={index}
                    role="group"
                    aria-roledescription={isArabic ? "ط´ظ‡ط§ط¯ط©" : "slide"}
                    aria-label={
                      isArabic
                        ? `ط§ظ„ط´ظ‡ط§ط¯ط© ${index + 1} ظ…ظ† ${testimonials.length}`
                        : `Testimonial ${index + 1} of ${testimonials.length}`
                    }
                    aria-hidden={!isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={`absolute inset-x-0 top-0 origin-top overflow-hidden rounded-[24px] border bg-[#F8F6FB] p-5 text-[#391B68] shadow-[0_18px_42px_rgba(10,3,22,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EC911F] sm:p-6 lg:px-7 lg:py-6 ${
                      isActive
                        ? "border-[#EC911F]/35"
                        : "border-white/18 max-lg:invisible"
                    } ${
                      prefersReducedMotion
                        ? "transition-opacity duration-0"
                        : "transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    } ${position === 1 ? "max-lg:visible" : ""}`}
                    style={{
                      opacity: isInVisibleStack ? opacities[position] : 0,
                      pointerEvents: isActive ? "auto" : "none",
                      transform: isInVisibleStack
                        ? transforms[position]
                        : "translateY(68px) scale(0.86)",
                      zIndex: isInVisibleStack ? 40 - position : 0,
                    }}
                  >
                    <span
                      className="absolute inset-y-0 start-0 w-1.5 bg-[#EC911F]"
                      aria-hidden="true"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[12px] font-black text-[#EC911F] sm:text-[13px]">
                        <RichText parts={testimonial.category} />
                      </span>
                      <span className="text-[#391B68]/22">
                        <QuoteIcon />
                      </span>
                    </div>
                    <blockquote className="mt-2 text-[18px] font-black leading-[1.55] sm:text-[20px] lg:text-[22px]">
                      <RichText parts={testimonial.quote} />
                    </blockquote>
                    <p className="mt-3 border-t border-[#391B68]/10 pt-2 text-[12px] font-bold text-[#6d6578] sm:text-[13px]">
                      <RichText parts={testimonial.source} />
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={showPreviousTestimonial}
                aria-label={isArabic ? "ط§ظ„ط´ظ‡ط§ط¯ط© ط§ظ„ط³ط§ط¨ظ‚ط©" : "Previous testimonial"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition-[background-color,border-color] duration-200 hover:border-[#EC911F]/50 hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
              >
                <CarouselArrow direction={isArabic ? "right" : "left"} />
              </button>

              <div className="flex items-center gap-1" aria-label={isArabic ? "ظ…ظˆط¶ط¹ ط§ظ„ط´ظ‡ط§ط¯ط©" : "Testimonial position"}>
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveTestimonial(index)}
                    aria-label={
                      isArabic
                        ? `ط§ط¹ط±ط¶ ط§ظ„ط´ظ‡ط§ط¯ط© ${index + 1} ظ…ظ† ${testimonials.length}`
                        : `Show testimonial ${index + 1} of ${testimonials.length}`
                    }
                    aria-current={index === activeTestimonial ? "true" : undefined}
                    className="group inline-flex h-11 w-7 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#EC911F]"
                  >
                    <span
                      className={`block rounded-full transition-[background-color,width] duration-200 ${
                        index === activeTestimonial
                          ? "h-2 w-5 bg-[#EC911F]"
                          : "h-2 w-2 bg-white/35 group-hover:bg-white/65"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={showNextTestimonial}
                aria-label={isArabic ? "ط§ظ„ط´ظ‡ط§ط¯ط© ط§ظ„طھط§ظ„ظٹط©" : "Next testimonial"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition-[background-color,border-color] duration-200 hover:border-[#EC911F]/50 hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
              >
                <CarouselArrow direction={isArabic ? "left" : "right"} />
              </button>
            </div>
          </div>

          <p className="mt-3 max-w-[700px] text-[12px] font-bold leading-[1.55] text-white/68 sm:text-[13px]">
            {content.privacy}
          </p>

          <div className="mt-3 rounded-[22px] border border-[#EC911F]/25 bg-[#F8F6FB] p-4 text-[#391B68] shadow-[0_14px_34px_rgba(10,3,22,0.2)] sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h3 className="text-[26px] font-black leading-[1.2] sm:text-[28px]">
                {content.ctaHeadline}
              </h3>
              <p className="mt-2 max-w-[520px] text-[14.5px] font-bold leading-[1.55] text-[#6d6578] sm:text-[15px]">
                {content.ctaSupport}
              </p>
            </div>
            <CtaLink
              href={bookingHref}
              locale={locale}
              source="student_testimonials"
              className="mt-4 h-[56px] w-full shrink-0 rounded-[17px] px-7 text-[16px] shadow-[0_12px_28px_rgba(236,145,31,0.3)] sm:mt-0 sm:w-auto"
            >
              {content.cta}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}

