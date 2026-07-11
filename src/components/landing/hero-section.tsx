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
  visualTitle: "ابدأ بتقييم مجاني",
  visualSubtitle: "اعرف مستواك الحقيقي قبل اختيار البرنامج",
  visualStops: ["تقييم", "هدف", "خطة"],
  visualPills: ["تقييم مجاني", "هدف واضح", "خطة مناسبة"],
};

const enHero = {
  visualTitle: "Start with a free level check",
  visualSubtitle: "Know your real level before choosing a program",
  visualStops: ["Check", "Goal", "Plan"],
  visualPills: ["Free check", "Clear goal", "Right plan"],
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

      @keyframes hero-path-dot {
        0%, 100% { transform: translateX(0); opacity: 0.7; }
        50% { transform: translateX(94px); opacity: 1; }
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

      .hero-path-dot {
        animation: hero-path-dot 4.8s ease-in-out infinite;
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
        .hero-path-dot,
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
    <div className="hero-visual-float relative mx-auto h-[420px] max-w-[470px] sm:h-[470px]">
      <div className="hero-glow absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EC911F]/18 blur-3xl" />
      <div className="absolute bottom-12 left-8 h-48 w-48 rounded-full bg-[#E32F54]/16 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-65" viewBox="0 0 430 440" fill="none" aria-hidden="true">
        <path
          className="hero-route-line"
          d="M82 310 C130 236 174 260 216 190 C254 128 304 132 354 88"
          stroke="url(#heroRoute)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="heroRoute" x1="82" y1="310" x2="354" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC911F" />
            <stop offset="0.58" stopColor="#E32F54" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.86" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute left-1/2 top-1/2 w-[min(88vw,390px)] -translate-x-1/2 -translate-y-1/2 rounded-[34px] border border-white/18 bg-[#2f1558]/55 p-4 shadow-2xl shadow-black/22 backdrop-blur-2xl">
        <div className={`relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-white to-[#fff8f0] p-7 text-[#391B68] shadow-xl shadow-black/10 ${isArabic ? "text-right" : ""}`}>
          <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#EC911F]/12 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-[#E32F54]/10 blur-3xl" />
          <span className={`absolute top-6 grid h-9 w-9 place-items-center rounded-full border border-[#EC911F]/20 bg-[#EC911F]/10 text-[#EC911F] ${isArabic ? "left-6" : "right-6"}`} aria-hidden="true">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="m8 12 3 3 5-7" />
            </svg>
          </span>

          <div className="relative max-w-[280px]">
            <h2 className="text-2xl font-black">{visualCopy.visualTitle}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{visualCopy.visualSubtitle}</p>
          </div>

          <div className="relative mt-10 px-1 pb-1 pt-5">
            <div className="absolute left-6 right-6 top-[38px] h-1 rounded-full bg-[#391B68]/10" />
            <div className="absolute left-6 right-1/2 top-[38px] h-1 rounded-full bg-gradient-to-r from-[#EC911F] to-[#E32F54]" />
            <div className="hero-path-dot absolute left-6 top-[31px] z-20 h-4 w-4 rounded-full bg-white ring-[5px] ring-[#EC911F] shadow-[0_0_26px_rgba(236,145,31,0.48)]" />

            <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
              {visualCopy.visualStops.map((stop, index) => (
                <div key={stop} className="grid justify-items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full border ${
                    index === 0
                      ? "border-[#EC911F]/35 bg-[#EC911F]/12 text-[#EC911F]"
                      : index === 1
                        ? "border-[#E32F54]/28 bg-[#E32F54]/10 text-[#E32F54]"
                        : "border-[#391B68]/18 bg-[#391B68]/8 text-[#391B68]"
                  }`}>
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                  </span>
                  <span className="text-sm font-black text-[#391B68]">{stop}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-2">
            {visualCopy.visualPills.map((pill) => (
              <span key={pill} className="rounded-2xl border border-[#391B68]/10 bg-[#391B68]/[0.04] px-2 py-3 text-center text-[12px] font-black text-[#391B68]">
                {pill}
              </span>
            ))}
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
          <HeroVisual isArabic={isArabic} />
        </AnimatedSection>
      </div>
    </section>
  );
}
