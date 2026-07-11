import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { getWhatsAppHref } from "@/lib/utm";
import { bookingHref, type LandingSectionProps } from "./types";

const arHero = {
  titleStart: "معظم الناس مش بتفشل في تعلّم الإنجليزية...",
  titleSecond: "هي بتتعلمها",
  titleAccent: "بالطريقة الغلط.",
  subtitle:
    "لو بدأت كذا مرة ووقفت، غالبًا المشكلة مش في قدرتك. المشكلة إنك بتبدأ من غير تشخيص، من غير هدف واضح، ومن غير متابعة تخليك تستخدم اللغة فعلًا.",
  note: "التقييم مجاني وخارجي، وبعده فريق المتابعة يوضح لك أنسب خطوة جاية.",
  visualTitle: "تقييم مجاني",
  visualSubtitle: "نقطة بداية أوضح",
  progressLabel: "اتجاه التعلم",
  labels: ["تقييم مجاني", "خطة مناسبة", "متابعة حقيقية"],
};

const enHero = {
  visualTitle: "Free Level Check",
  visualSubtitle: "A clearer starting point",
  progressLabel: "Learning direction",
  labels: ["Assessment", "Right plan", "Follow-up"],
};

function HeroMotionStyles() {
  return (
    <style>{`
      @keyframes hero-fade-up {
        from { opacity: 0; transform: translateY(18px); filter: blur(5px); }
        to { opacity: 1; transform: translateY(0); filter: blur(0); }
      }

      @keyframes hero-soft-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-9px); }
      }

      @keyframes hero-orbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes hero-line-dash {
        to { stroke-dashoffset: -60; }
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

      .hero-orbit-ring {
        transform-origin: 50% 50%;
        animation: hero-orbit 18s linear infinite;
      }

      .hero-route-line {
        stroke-dasharray: 10 12;
        animation: hero-line-dash 6s linear infinite;
      }

      .hero-badge-glow::after {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, rgba(236,145,31,0.55), transparent);
        animation: hero-shimmer 4s ease-in-out infinite;
        z-index: -1;
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-enter,
        .hero-visual-float,
        .hero-orbit-ring,
        .hero-route-line,
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
      <span className="block">
        {arHero.titleSecond}{" "}
        <span className="relative inline-block whitespace-nowrap pb-1">
          <span className="relative z-10">{arHero.titleAccent}</span>
          <span className="absolute inset-x-0 bottom-0 h-2 rounded-full bg-gradient-to-r from-[#EC911F] to-[#E32F54] opacity-85 shadow-[0_0_22px_rgba(236,145,31,0.22)]" />
        </span>
      </span>
    </>
  );
}

function HeroVisual({ isArabic }: { isArabic: boolean }) {
  const visualCopy = isArabic ? arHero : enHero;

  return (
    <div className="hero-visual-float relative mx-auto h-[430px] max-w-[440px] sm:h-[470px]">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EC911F]/16 blur-3xl" />
      <div className="absolute bottom-8 left-8 h-48 w-48 rounded-full bg-[#E32F54]/18 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 440 470" fill="none" aria-hidden="true">
        <path
          className="hero-route-line"
          d="M76 318 C132 220 184 260 220 188 C252 126 318 132 364 78"
          stroke="url(#heroRoute)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="heroRoute" x1="76" y1="318" x2="364" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC911F" />
            <stop offset="0.55" stopColor="#E32F54" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute left-1/2 top-1/2 w-[min(88vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-[34px] border border-white/22 bg-white/12 p-5 shadow-2xl shadow-black/22 backdrop-blur-2xl">
        <div className="rounded-[28px] border border-white/20 bg-white/92 p-5 text-[#391B68] shadow-xl shadow-black/10">
          <div className={`mb-5 flex items-start justify-between gap-4 ${isArabic ? "flex-row-reverse text-right" : ""}`}>
            <div>
              <p className="text-sm font-black text-[#E32F54]">{visualCopy.progressLabel}</p>
              <h2 className="mt-1 text-2xl font-black">{visualCopy.visualTitle}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">{visualCopy.visualSubtitle}</p>
            </div>
            <div className="relative grid h-20 w-20 shrink-0 place-items-center">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <circle cx="40" cy="40" r="31" stroke="#391B68" strokeOpacity="0.1" strokeWidth="7" />
                <circle
                  className="hero-orbit-ring"
                  cx="40"
                  cy="40"
                  r="31"
                  stroke="url(#heroRing)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="138 195"
                />
                <defs>
                  <linearGradient id="heroRing" x1="12" y1="18" x2="68" y2="68" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#EC911F" />
                    <stop offset="1" stopColor="#E32F54" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-lg font-black">01</span>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#391B68]/10">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#EC911F] to-[#E32F54]" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {visualCopy.labels.map((label) => (
              <span key={label} className="rounded-2xl border border-[#391B68]/10 bg-[#391B68]/5 px-2 py-3 text-[12px] font-black text-[#391B68]">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-2 top-12 rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-sm font-black text-white shadow-xl shadow-black/14 backdrop-blur-xl">
        {visualCopy.labels[0]}
      </div>
      <div className="absolute right-0 top-28 rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-sm font-black text-white shadow-xl shadow-black/14 backdrop-blur-xl">
        {visualCopy.labels[1]}
      </div>
      <div className="absolute bottom-16 right-8 rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-sm font-black text-white shadow-xl shadow-black/14 backdrop-blur-xl">
        {visualCopy.labels[2]}
      </div>
    </div>
  );
}

export function HeroSection({ locale, copy }: LandingSectionProps) {
  const isArabic = locale === "ar";
  const whatsappHref = getWhatsAppHref(locale);
  const subtitle = isArabic ? arHero.subtitle : copy.hero.subtitle;
  const note = isArabic ? arHero.note : copy.hero.note;

  return (
    <section className="relative overflow-hidden bg-[#391B68] text-white">
      <HeroMotionStyles />
      <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-[#EC911F]/24 blur-3xl" />
      <div className="absolute -left-24 bottom-4 h-96 w-96 rounded-full bg-[#E32F54]/20 blur-3xl" />
      <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-white/8 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)] bg-[length:30px_30px] opacity-55" />

      <div className="relative mx-auto grid max-w-[1180px] gap-10 px-6 py-16 sm:py-20 lg:min-h-[690px] lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-10">
        <AnimatedSection
          delay={60}
          className={`order-1 max-w-[620px] ${isArabic ? "text-right lg:col-start-2 lg:justify-self-end" : "lg:col-start-1"}`}
        >
          <div className={`hero-enter flex flex-wrap items-center gap-3 ${isArabic ? "justify-end" : ""}`} style={{ animationDelay: "80ms" }}>
            <span className="hero-badge-glow relative z-0 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[13px] font-black text-white shadow-xl backdrop-blur-md">
              {copy.hero.eyebrow}
            </span>
            <span className="inline-flex rounded-full border border-[#EC911F]/30 bg-[#EC911F]/15 px-5 py-3 text-[13px] font-black text-white shadow-xl shadow-[#EC911F]/10">
              {copy.hero.badge}
            </span>
          </div>

          <h1
            className={`hero-enter mt-7 max-w-[620px] text-[38px] font-black leading-[1.08] tracking-[-0.01em] text-white sm:text-[48px] lg:text-[62px] ${isArabic ? "ml-auto text-right" : ""}`}
            style={{ animationDelay: "170ms" }}
          >
            <HeroTitle isArabic={isArabic} fallbackTitle={copy.hero.title} />
          </h1>

          <p
            className={`hero-enter mt-6 max-w-[590px] text-[16px] font-bold leading-8 text-white/82 lg:text-[19px] ${isArabic ? "ml-auto text-right" : ""}`}
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

          <p className={`hero-enter mt-5 max-w-[560px] text-[15px] font-bold leading-7 text-white/70 ${isArabic ? "ml-auto text-right" : ""}`} style={{ animationDelay: "440ms" }}>
            {note}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={120} className={`order-2 ${isArabic ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2"}`}>
          <HeroVisual isArabic={isArabic} />
        </AnimatedSection>
      </div>
    </section>
  );
}
