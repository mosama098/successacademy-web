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
  visualTitle: "تقييم مجاني",
  visualSubtitle: "ابدأ من نقطة واضحة",
};

const enHero = {
  visualTitle: "Free Level Check",
  visualSubtitle: "Start from a clear point",
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

      @keyframes hero-line-dash {
        to { stroke-dashoffset: -72; }
      }

      @keyframes hero-ring {
        from { stroke-dashoffset: 120; }
        to { stroke-dashoffset: 44; }
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

      .hero-route-line {
        stroke-dasharray: 12 14;
        animation: hero-line-dash 6.5s linear infinite;
      }

      .hero-progress-ring {
        stroke-dasharray: 160;
        animation: hero-ring 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
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
        .hero-route-line,
        .hero-progress-ring,
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

function HeroVisual({ isArabic }: { isArabic: boolean }) {
  const visualCopy = isArabic ? arHero : enHero;

  return (
    <div className="hero-visual-float relative mx-auto h-[390px] max-w-[430px] sm:h-[440px]">
      <div className="hero-glow absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EC911F]/18 blur-3xl" />
      <div className="absolute bottom-12 left-8 h-48 w-48 rounded-full bg-[#E32F54]/16 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-75" viewBox="0 0 430 440" fill="none" aria-hidden="true">
        <path
          className="hero-route-line"
          d="M82 304 C134 232 172 258 214 190 C254 126 304 132 354 86"
          stroke="url(#heroRoute)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="82" cy="304" r="5" fill="#EC911F" />
        <circle cx="354" cy="86" r="5" fill="#E32F54" />
        <defs>
          <linearGradient id="heroRoute" x1="82" y1="304" x2="354" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC911F" />
            <stop offset="0.58" stopColor="#E32F54" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.86" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute left-1/2 top-1/2 w-[min(84vw,330px)] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-white/22 bg-white/12 p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <div className={`rounded-[26px] border border-white/22 bg-white/92 p-6 text-[#391B68] shadow-xl shadow-black/10 ${isArabic ? "text-right" : ""}`}>
          <div className={`mb-7 flex items-start justify-between gap-5 ${isArabic ? "flex-row-reverse" : ""}`}>
            <div>
              <h2 className="text-2xl font-black">{visualCopy.visualTitle}</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">{visualCopy.visualSubtitle}</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#EC911F] to-[#E32F54] text-white shadow-lg shadow-[#E32F54]/18">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
                <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />
              </svg>
            </span>
          </div>

          <div className="mx-auto grid h-36 w-36 place-items-center">
            <svg className="absolute h-36 w-36" viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <circle cx="60" cy="60" r="48" stroke="#391B68" strokeOpacity="0.1" strokeWidth="9" />
              <circle
                className="hero-progress-ring"
                cx="60"
                cy="60"
                r="48"
                stroke="url(#heroProgress)"
                strokeWidth="9"
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="heroProgress" x1="18" y1="24" x2="98" y2="96" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EC911F" />
                  <stop offset="1" stopColor="#E32F54" />
                </linearGradient>
              </defs>
            </svg>
            <span className="h-4 w-4 rounded-full bg-[#391B68] shadow-[0_0_28px_rgba(57,27,104,0.32)]" />
          </div>
        </div>
      </div>
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

      <div className="relative mx-auto grid max-w-[1180px] gap-9 px-6 py-16 [direction:ltr] sm:py-20 lg:min-h-[660px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:px-10">
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
          <HeroVisual isArabic={isArabic} />
        </AnimatedSection>
      </div>
    </section>
  );
}
