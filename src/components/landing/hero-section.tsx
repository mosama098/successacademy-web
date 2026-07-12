import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { getWhatsAppHref } from "@/lib/utm";
import { bookingHref, type LandingSectionProps } from "./types";

const arHero = {
  titleStart: "معظم الناس مش بتفشل في تعلّم الإنجليزية...",
  titleSecond: "هي بس بتبدأ من",
  titleAccent: "المكان الغلط",
  subtitle:
    "لو بدأت كذا مرة ووقفت، غالبًا المشكلة مش في قدرتك.\nالمشكلة إنك محتاج تعرف مستواك الحقيقي، وهدفك من اللغة، والطريق المناسب ليك.",
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

      @keyframes hero-glow {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.72; }
        50% { transform: translate3d(18px, -12px, 0) scale(1.04); opacity: 0.95; }
      }

      @keyframes hero-star-drift {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.34; }
        50% { transform: translate3d(8px, -10px, 0) scale(1.18); opacity: 0.9; }
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

      .hero-glow {
        animation: hero-glow 9s ease-in-out infinite;
      }

      .hero-star {
        animation: hero-star-drift 6.5s ease-in-out infinite;
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
        .hero-glow,
        .hero-star,
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
        </span>
      </span>
    </>
  );
}

function HeroVisual() {
  return (
    <div
      className="hero-visual-float relative mx-auto h-[clamp(300px,58vw,420px)] w-full max-w-[430px] sm:h-[520px] sm:max-w-[560px] lg:mx-0 lg:h-[clamp(560px,72vh,760px)] lg:max-w-none lg:self-end"
      aria-hidden="true"
    >
      <div className="hero-glow absolute bottom-[8%] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#EC911F]/18 blur-3xl sm:h-[420px] sm:w-[420px] lg:left-[clamp(80px,8vw,150px)] lg:h-[520px] lg:w-[520px] lg:-translate-x-0" />
      <div className="absolute bottom-[18%] left-[28%] h-[64%] w-[68%] rounded-full bg-[#E32F54]/10 blur-3xl lg:left-[clamp(120px,12vw,210px)]" />
      <div className="absolute inset-x-10 bottom-0 h-20 rounded-full bg-[#120720]/34 blur-3xl sm:h-24 lg:left-[clamp(60px,7vw,130px)] lg:right-auto lg:h-32 lg:w-[520px]" />

      <span className="hero-star absolute left-[18%] top-[16%] h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.75)]" />
      <span className="hero-star absolute right-[20%] top-[22%] h-2 w-2 rounded-full bg-[#EC911F]/80 shadow-[0_0_22px_rgba(236,145,31,0.75)]" style={{ animationDelay: "900ms" }} />
      <span className="hero-star absolute bottom-[24%] left-[10%] h-2 w-2 rounded-full bg-[#E32F54]/80 shadow-[0_0_22px_rgba(227,47,84,0.72)]" style={{ animationDelay: "1600ms" }} />
      <span className="hero-star absolute bottom-[34%] right-[8%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.65)]" style={{ animationDelay: "2400ms" }} />

      <img
        src="/hero-model.png"
        alt=""
        className="absolute bottom-0 left-1/2 h-[clamp(300px,58vw,420px)] w-auto max-w-[96%] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_34px_40px_rgba(13,5,28,0.44)] sm:h-[520px] sm:max-w-[108%] lg:bottom-[-8px] lg:left-[clamp(80px,8vw,150px)] lg:h-[clamp(560px,72vh,760px)] lg:max-w-none lg:translate-x-0"
      />
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

      <div className="relative mx-auto grid max-w-[1440px] gap-8 px-6 py-14 [direction:ltr] sm:py-16 lg:min-h-[600px] lg:grid-cols-[44%_56%] lg:items-center lg:gap-0 lg:px-12 lg:py-0">
        <AnimatedSection
          delay={60}
          className={`order-1 max-w-[640px] ${isArabic ? "[direction:rtl] text-right lg:col-start-2 lg:justify-self-start" : "lg:col-start-1"}`}
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
