"use client";

import Script from "next/script";
import { createElement, useEffect, useRef, useState } from "react";
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
    ctaSupport: "جاهز تبدأ قصتك أنت؟",
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
    ctaSupport: "Ready to start your own story?",
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

export function TestimonialsSection({ locale }: LandingSectionProps) {
  const content = testimonialsContent[locale];
  const isArabic = locale === "ar";
  const playerRef = useRef<WistiaPlayerElement | null>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const isPlayerReadyRef = useRef(false);
  const isMutedRef = useRef(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

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

  return (
    <section
      id="student-stories"
      className="relative overflow-hidden bg-[#391B68] px-5 pb-[calc(112px+env(safe-area-inset-bottom))] pt-16 text-white sm:px-6 md:py-20 lg:px-8 lg:py-[84px]"
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
        className={`relative mx-auto grid max-w-[1220px] items-start gap-x-12 gap-y-6 lg:gap-x-16 ${
          isArabic
            ? "lg:grid-cols-[minmax(340px,0.45fr)_minmax(0,0.55fr)]"
            : "lg:grid-cols-[minmax(0,0.55fr)_minmax(340px,0.45fr)]"
        }`}
      >
        <header
          className={`max-w-[700px] ${
            isArabic ? "lg:col-start-2" : "lg:col-start-1"
          } lg:row-start-1`}
        >
          <span className="inline-flex rounded-full border border-[#EC911F]/35 bg-[#EC911F]/10 px-4 py-2 text-[13px] font-black text-[#f2b35f] sm:text-[14px]">
            {content.badge}
          </span>
          <h2 className="mt-4 text-[31px] font-black leading-[1.23] sm:text-[39px] lg:text-[46px] lg:leading-[1.16]">
            <span className="block text-white">{content.headingLead}</span>
            <span className="mt-1 block text-[#EC911F]">
              {content.headingHighlight}
            </span>
          </h2>
          <p className="mt-3.5 max-w-[680px] text-[15px] font-bold leading-7 text-white/72 sm:text-[17px] sm:leading-8">
            {content.description}
          </p>
        </header>

        <div
          className={`mx-auto mt-1 w-full max-w-[350px] lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-[380px] lg:self-center ${
            isArabic ? "lg:col-start-1" : "lg:col-start-2"
          }`}
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
        >
          <article className="relative overflow-hidden rounded-[24px] border border-[#EC911F]/25 bg-[#F8F6FB] p-5 text-[#391B68] shadow-[0_16px_38px_rgba(10,3,22,0.2)] sm:px-6 sm:py-5">
            <span
              className="absolute inset-y-0 start-0 w-1.5 bg-[#EC911F]"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-black text-[#EC911F] sm:text-[14px]">
                <RichText parts={content.featured.category} />
              </span>
              <span className="text-[#391B68]/25">
                <QuoteIcon large />
              </span>
            </div>
            <blockquote className="mt-2.5 max-w-[650px] text-[20px] font-black leading-[1.58] sm:text-[22px] lg:text-[23px]">
              <RichText parts={content.featured.quote} />
            </blockquote>
            <p className="mt-3 text-[13px] font-bold text-[#6d6578] sm:text-[14px]">
              <RichText parts={content.featured.source} />
            </p>
          </article>

          <div className="mt-3 grid gap-2.5">
            {content.supporting.map((testimonial, index) => (
              <article
                key={index}
                className="rounded-[20px] border border-white/12 bg-[#F8F6FB] px-5 py-3.5 text-[#391B68] shadow-[0_8px_22px_rgba(10,3,22,0.14)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#EC911F]/35 motion-reduce:transform-none motion-reduce:transition-none sm:px-6"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-[#391B68]/25">
                    <QuoteIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-black text-[#EC911F] sm:text-[13px]">
                      <RichText parts={testimonial.category} />
                    </span>
                    <blockquote className="mt-1 text-[16px] font-black leading-6 sm:text-[17px] sm:leading-[1.55]">
                      <RichText parts={testimonial.quote} />
                    </blockquote>
                    <p className="mt-1.5 text-[12px] font-bold text-[#716878] sm:text-[13px]">
                      <RichText parts={testimonial.source} />
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-3.5 max-w-[700px] text-[12px] font-bold leading-6 text-white/58 sm:text-[13px]">
            {content.privacy}
          </p>

          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="text-[15px] font-black text-white">
              {content.ctaSupport}
            </p>
            <CtaLink
              href={bookingHref}
              locale={locale}
              source="student_testimonials"
              className="h-[56px] w-full shrink-0 rounded-[16px] px-7 text-[16px] shadow-[0_10px_24px_rgba(236,145,31,0.2)] sm:w-auto"
            >
              {content.cta}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
