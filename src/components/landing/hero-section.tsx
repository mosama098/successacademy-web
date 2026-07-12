import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { getWhatsAppHref } from "@/lib/utm";
import { bookingHref, type LandingSectionProps } from "./types";

const arHero = {
  titleStart: "معظم الناس مش بتفشل في الإنجليزية...",
  titleSecond: "هي بس بتبدأ من",
  titleAccent: "المكان الغلط",
  subtitle:
    "لو بدأت كذا مرة ووقفت، غالبًا المشكلة مش في قدرتك.\nالمشكلة إنك محتاج تعرف مستواك الحقيقي، هدفك من اللغة، والطريق المناسب ليك.",
};

function HeroMotionStyles() {
  return (
    <style>{`
      @keyframes hero-fade-up {
        from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
        to { opacity: 1; transform: translateY(0); filter: blur(0); }
      }

      @keyframes hero-soft-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      @keyframes hero-path-dot {
        0% { offset-distance: 0%; opacity: 0; }
        12% { opacity: 1; }
        78% { opacity: 1; }
        100% { offset-distance: 100%; opacity: 0; }
      }

      @keyframes hero-growth-path {
        to { stroke-dashoffset: -96; }
      }

      @keyframes hero-node-pulse {
        0%, 100% { transform: scale(1); opacity: 0.78; }
        50% { transform: scale(1.08); opacity: 1; }
      }

      @keyframes hero-fragment-drift {
        0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.34; }
        50% { transform: translate3d(6px, -8px, 0); opacity: 0.66; }
      }

      @keyframes hero-glow {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.72; }
        50% { transform: translate3d(18px, -12px, 0) scale(1.04); opacity: 0.95; }
      }

      @keyframes hero-shimmer {
        0%, 100% { opacity: 0.45; transform: translateX(-18%); }
        50% { opacity: 0.9; transform: translateX(18%); }
      }

      .hero-enter {
        animation: hero-fade-up 720ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      .hero-visual-float {
        animation: hero-soft-float 7s ease-in-out infinite;
      }

      .hero-path-dot {
        offset-path: path("M 82 330 C 138 302 162 266 210 250 C 270 230 292 176 370 126");
        animation: hero-path-dot 5.8s ease-in-out infinite;
      }

      .hero-growth-path {
        stroke-dasharray: 18 18;
        animation: hero-growth-path 7s linear infinite;
      }

      .hero-node-pulse {
        transform-box: fill-box;
        transform-origin: center;
        animation: hero-node-pulse 4.8s ease-in-out infinite;
      }

      .hero-fragment-drift {
        animation: hero-fragment-drift 6.5s ease-in-out infinite;
      }

      .hero-glow {
        animation: hero-glow 9s ease-in-out infinite;
      }

      .hero-badge-glow::after {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, rgba(236,145,31,0.48), transparent);
        animation: hero-shimmer 4s ease-in-out infinite;
        z-index: -1;
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-enter,
        .hero-visual-float,
        .hero-path-dot,
        .hero-growth-path,
        .hero-node-pulse,
        .hero-fragment-drift,
        .hero-glow,
        .hero-badge-glow::after {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function HeroTitle({ isArabic, fallbackTitle }: { isArabic: boolean; fallbackTitle: string }) {
  if (!isArabic) {
    return <>{fallbackTitle}</>;
  }

  return (
    <>
      <span className="block">{arHero.titleStart}</span>
      <span className="mt-3 block text-[0.82em] leading-[1.18] text-white/95">
        {arHero.titleSecond}{" "}
        <span className="relative inline-block whitespace-nowrap pb-1">
          <span className="relative z-10">{arHero.titleAccent}</span>
          <span className="absolute inset-x-0 bottom-0 h-2 rounded-full bg-gradient-to-r from-[#EC911F] to-[#E32F54] opacity-80 shadow-[0_0_20px_rgba(236,145,31,0.18)]" />
        </span>.
      </span>
    </>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual-float relative mx-auto h-[420px] w-full max-w-[480px] sm:h-[480px]" aria-hidden="true">
      <div className="hero-glow absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EC911F]/20 blur-3xl" />
      <div className="absolute left-16 top-16 h-64 w-64 rounded-full bg-[#E32F54]/18 blur-3xl" />
      <div className="absolute bottom-16 right-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 480 480" fill="none">
        <defs>
          <radialGradient id="heroGrowthGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(306 178) rotate(90) scale(176)">
            <stop stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.3" stopColor="#EC911F" stopOpacity="0.54" />
            <stop offset="0.68" stopColor="#E32F54" stopOpacity="0.34" />
            <stop offset="1" stopColor="#391B68" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="heroRibbon" x1="82" y1="330" x2="370" y2="126" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="0.24" stopColor="#EC911F" stopOpacity="0.7" />
            <stop offset="0.67" stopColor="#E32F54" stopOpacity="0.82" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.86" />
          </linearGradient>
          <linearGradient id="heroRibbonCore" x1="82" y1="330" x2="370" y2="126" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC911F" />
            <stop offset="0.5" stopColor="#E32F54" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <radialGradient id="heroFinalGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(370 126) rotate(90) scale(74)">
            <stop stopColor="#ffffff" stopOpacity="0.94" />
            <stop offset="0.34" stopColor="#EC911F" stopOpacity="0.58" />
            <stop offset="0.82" stopColor="#E32F54" stopOpacity="0.14" />
            <stop offset="1" stopColor="#E32F54" stopOpacity="0" />
          </radialGradient>
          <filter id="heroSoftShadow" x="36" y="44" width="408" height="396" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="26" stdDeviation="26" floodColor="#120720" floodOpacity="0.3" />
          </filter>
        </defs>

        <circle cx="306" cy="178" r="178" fill="url(#heroGrowthGlow)" opacity="0.78" />

        <g className="hero-fragment-drift">
          <path d="M80 322h28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.34" />
          <path d="M104 350h42" stroke="#EC911F" strokeWidth="3" strokeLinecap="round" opacity="0.42" />
          <path d="M64 374h24" stroke="#E32F54" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <circle cx="126" cy="306" r="4" fill="#ffffff" opacity="0.38" />
          <circle cx="92" cy="288" r="3.5" fill="#EC911F" opacity="0.52" />
          <circle cx="146" cy="378" r="3" fill="#E32F54" opacity="0.58" />
        </g>

        <path
          d="M82 330 C138 302 162 266 210 250 C270 230 292 176 370 126"
          stroke="url(#heroRibbon)"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.22"
          filter="url(#heroSoftShadow)"
        />
        <path
          d="M82 330 C138 302 162 266 210 250 C270 230 292 176 370 126"
          stroke="url(#heroRibbon)"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.78"
        />
        <path
          className="hero-growth-path"
          d="M82 330 C138 302 162 266 210 250 C270 230 292 176 370 126"
          stroke="url(#heroRibbonCore)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />

        <g className="hero-node-pulse">
          <circle cx="82" cy="330" r="10" fill="#391B68" fillOpacity="0.26" />
          <circle cx="82" cy="330" r="5" fill="#EC911F" />
        </g>
        <g className="hero-node-pulse" style={{ animationDelay: "700ms" }}>
          <circle cx="210" cy="250" r="12" fill="#391B68" fillOpacity="0.22" />
          <circle cx="210" cy="250" r="6" fill="#ffffff" fillOpacity="0.9" />
        </g>
        <g className="hero-node-pulse" style={{ animationDelay: "1300ms" }}>
          <circle cx="370" cy="126" r="24" fill="url(#heroFinalGlow)" />
          <circle cx="370" cy="126" r="10" fill="#ffffff" />
          <circle cx="370" cy="126" r="5" fill="#E32F54" />
        </g>

        <g opacity="0.76">
          <path d="M336 156 C354 166 378 164 396 148" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.58" />
          <path d="M328 180 C356 196 392 188 414 162" stroke="#EC911F" strokeWidth="2" strokeLinecap="round" opacity="0.58" />
          <path d="M318 204 C354 226 408 210 432 174" stroke="#E32F54" strokeWidth="1.8" strokeLinecap="round" opacity="0.48" />
        </g>
      </svg>
      <span className="hero-path-dot absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_26px_rgba(236,145,31,0.7)] ring-[5px] ring-[#EC911F]/70" />
    </div>
  );
}

export function HeroSection({ locale, copy }: LandingSectionProps) {
  const isArabic = locale === "ar";
  const whatsappHref = getWhatsAppHref(locale);
  const subtitle = isArabic ? arHero.subtitle : copy.hero.subtitle;

  return (
    <section className="relative overflow-hidden bg-[#391B68] text-white">
      <HeroMotionStyles />
      <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-[#EC911F]/22 blur-3xl" />
      <div className="absolute -left-24 bottom-4 h-96 w-96 rounded-full bg-[#E32F54]/18 blur-3xl" />
      <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-white/7 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[length:32px_32px] opacity-50" />

      <div className="relative mx-auto grid max-w-[1180px] gap-9 px-6 py-16 [direction:ltr] sm:py-20 lg:min-h-[660px] lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-8 lg:px-10">
        <AnimatedSection
          delay={60}
          className={`order-1 max-w-[620px] ${isArabic ? "[direction:rtl] text-right lg:col-start-2 lg:justify-self-end" : "lg:col-start-1"}`}
        >
          <div className={`hero-enter flex flex-wrap items-center gap-3 ${isArabic ? "justify-end" : ""}`} style={{ animationDelay: "80ms" }}>
            <span className="hero-badge-glow relative z-0 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[13px] font-black text-white shadow-xl backdrop-blur-md">
              {copy.hero.eyebrow}
            </span>
          </div>

          <h1
            className={`hero-enter mt-7 max-w-[610px] text-[33px] font-black leading-[1.14] tracking-[-0.01em] text-white sm:text-[43px] lg:text-[54px] ${isArabic ? "ml-auto text-right" : ""}`}
            style={{ animationDelay: "170ms" }}
          >
            <HeroTitle isArabic={isArabic} fallbackTitle={copy.hero.title} />
          </h1>

          <p
            className={`hero-enter mt-6 max-w-[550px] whitespace-pre-line text-[16px] font-semibold leading-8 text-white/80 lg:text-[18px] ${isArabic ? "ml-auto text-right" : ""}`}
            style={{ animationDelay: "260ms" }}
          >
            {subtitle}
          </p>

          <div className={`hero-enter mt-8 flex flex-col gap-4 sm:flex-row ${isArabic ? "lg:justify-end" : ""}`} style={{ animationDelay: "350ms" }}>
            <CtaLink href={bookingHref} locale={locale} source="hero_primary" className="h-[56px] px-8 hover:shadow-2xl hover:shadow-[#EC911F]/25">
              {copy.hero.primaryCta}
            </CtaLink>
            <CtaLink href={whatsappHref} locale={locale} source="hero_secondary" event="whatsapp" variant="secondary" className="h-[56px] px-8">
              {copy.hero.whatsappCta}
            </CtaLink>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={120} className={`order-2 ${isArabic ? "[direction:rtl] lg:col-start-1 lg:row-start-1" : "lg:col-start-2"}`}>
          <HeroVisual />
        </AnimatedSection>
      </div>
    </section>
  );
}
