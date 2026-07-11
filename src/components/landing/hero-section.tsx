import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { getWhatsAppHref } from "@/lib/utm";
import { bookingHref, type LandingSectionProps } from "./types";

const arabicHero = {
  titleLines: ["معظم الناس مش بتفشل في", "تعلُّم الإنجليزية...", "هي بتتعلمها", "بالطريقة الغلط."],
  subtitleLines: [
    "لو بدأت كذا مرة ووقفت، غالبًا المشكلة مش في قدرتك.",
    "المشكلة إنك بتبدأ من غير تشخيص، من غير هدف واضح،",
    "ومن غير متابعة تخليك تستخدم اللغة فعلًا.",
  ],
  note: "التقييم مجاني وخارجي، وبعده فريق المتابعة يوضح لك أنسب خطوة جاية.",
};

function HeroMotionStyles() {
  return (
    <style>{`
      @keyframes hero-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
      }

      @keyframes hero-rail-glow {
        0% { transform: translateY(0); opacity: 0; }
        18% { opacity: 1; }
        82% { opacity: 1; }
        100% { transform: translateY(220px); opacity: 0; }
      }

      @keyframes hero-icon-pulse {
        0%, 100% { box-shadow: 0 12px 30px rgba(57, 27, 104, 0.18); transform: scale(1); }
        50% { box-shadow: 0 16px 38px rgba(236, 145, 31, 0.18); transform: scale(1.02); }
      }

      @keyframes hero-stagger-in {
        from { opacity: 0; transform: translateY(16px); filter: blur(5px); }
        to { opacity: 1; transform: translateY(0); filter: blur(0); }
      }

      .hero-float-card {
        animation: hero-float 7s ease-in-out infinite;
      }

      .hero-rail-dot {
        animation: hero-rail-glow 4.8s ease-in-out infinite;
      }

      .hero-path-icon {
        animation: hero-icon-pulse 5.5s ease-in-out infinite;
      }

      .hero-stagger {
        animation: hero-stagger-in 680ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-float-card,
        .hero-rail-dot,
        .hero-path-icon,
        .hero-stagger {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function AssessmentIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 4h6l1 2h3v14H5V6h3l1-2Z" />
      <path d="M9 11h4" />
      <path d="M9 15h2" />
      <circle cx="16" cy="15" r="2.5" />
      <path d="m18 17 2 2" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 18c4 0 4-12 8-12 3 0 3 6 6 6" />
      <path d="M5 18h4" />
      <path d="M16 9l3 3-3 3" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="13" cy="6" r="2" />
    </svg>
  );
}

function FollowUpIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

const pathIcons = [AssessmentIcon, TargetIcon, RouteIcon, FollowUpIcon];
const pathAccents = [
  "from-[#391B68] to-[#6b3bb0]",
  "from-[#EC911F] to-[#E32F54]",
  "from-[#391B68] to-[#EC911F]",
  "from-[#E32F54] to-[#391B68]",
];

function HeroTitle({ isArabic, title }: { isArabic: boolean; title: string }) {
  if (!isArabic) {
    return <>{title}</>;
  }

  return (
    <>
      {arabicHero.titleLines.slice(0, 3).map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
      <span className="relative inline-block pb-1 text-white">
        <span className="relative z-10">{arabicHero.titleLines[3]}</span>
        <span className="absolute inset-x-0 bottom-0 h-2 rounded-full bg-gradient-to-r from-[#EC911F] to-[#E32F54] opacity-80 shadow-[0_0_24px_rgba(236,145,31,0.22)]" />
      </span>
    </>
  );
}

export function HeroSection({ locale, copy }: LandingSectionProps) {
  const isArabic = locale === "ar";
  const whatsappHref = getWhatsAppHref(locale);
  const heroSubtitle = isArabic ? arabicHero.subtitleLines.join("\n") : copy.hero.subtitle;
  const heroNote = isArabic ? arabicHero.note : copy.hero.note;

  return (
    <section className="relative overflow-hidden bg-[#391B68] text-white">
      <HeroMotionStyles />
      <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#EC911F]/30 blur-3xl" />
      <div className="absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-[#E32F54]/25 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[length:28px_28px] opacity-60" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/16 to-transparent" />

      <div className="relative mx-auto grid max-w-[1180px] gap-12 px-6 py-16 sm:py-20 lg:min-h-[700px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16 lg:px-10">
        <AnimatedSection
          delay={60}
          className={`max-w-[620px] ${isArabic ? "text-right lg:col-start-2 lg:justify-self-end" : "lg:col-start-1"}`}
        >
          <div className={`hero-stagger flex flex-wrap items-center gap-3 ${isArabic ? "justify-end" : ""}`} style={{ animationDelay: "80ms" }}>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[13px] font-black text-white shadow-xl backdrop-blur-md">
              {copy.hero.eyebrow}
            </span>
            <span className="inline-flex rounded-full border border-[#EC911F]/30 bg-[#EC911F]/15 px-5 py-3 text-[13px] font-black text-white shadow-xl shadow-[#EC911F]/10">
              {copy.hero.badge}
            </span>
          </div>

          <h1
            className={`hero-stagger mt-7 max-w-[620px] whitespace-pre-line text-[37px] font-black leading-[1.06] tracking-[-0.01em] text-white sm:text-[46px] lg:text-[60px] ${isArabic ? "ml-auto text-right" : ""}`}
            style={{ animationDelay: "170ms" }}
          >
            <HeroTitle isArabic={isArabic} title={copy.hero.title} />
          </h1>

          <p
            className={`hero-stagger mt-6 max-w-[580px] whitespace-pre-line text-[16px] font-bold leading-8 text-white/82 lg:text-[19px] ${isArabic ? "ml-auto text-right" : ""}`}
            style={{ animationDelay: "260ms" }}
          >
            {heroSubtitle}
          </p>

          <div className={`hero-stagger mt-8 flex flex-col gap-4 sm:flex-row ${isArabic ? "lg:justify-end" : ""}`} style={{ animationDelay: "350ms" }}>
            <CtaLink href={bookingHref} locale={locale} source="hero_primary" className="h-[56px] px-8 hover:shadow-2xl hover:shadow-[#EC911F]/25">
              {copy.hero.primaryCta}
            </CtaLink>
            <CtaLink href={whatsappHref} locale={locale} source="hero_secondary" event="whatsapp" variant="secondary" className="h-[56px] px-8">
              {copy.hero.whatsappCta}
            </CtaLink>
          </div>

          <p className={`hero-stagger mt-5 max-w-[560px] text-[15px] font-bold leading-7 text-white/70 ${isArabic ? "ml-auto text-right" : ""}`} style={{ animationDelay: "440ms" }}>
            {heroNote}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={140} className={isArabic ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2"}>
          <div className="hero-float-card relative mx-auto max-w-[440px] overflow-hidden rounded-[32px] border border-white/65 bg-gradient-to-br from-white via-white to-[#fff8ef] p-5 text-slate-950 shadow-2xl shadow-black/24 backdrop-blur lg:p-6">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#EC911F]/12 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#E32F54]/10 blur-3xl" />

            <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#391B68]/10 pb-5">
              <span className="rounded-full bg-[#391B68] px-4 py-2 text-[13px] font-black text-white shadow-lg shadow-[#391B68]/18">{copy.hero.cardLabel}</span>
              <span className="rounded-full border border-[#EC911F]/25 bg-[#EC911F]/10 px-4 py-2 text-[13px] font-black text-[#391B68]">{copy.hero.badge}</span>
            </div>

            <div className="relative grid gap-3">
              <span className={`absolute top-7 bottom-7 w-px bg-gradient-to-b from-[#EC911F]/30 via-[#391B68]/22 to-[#E32F54]/30 ${isArabic ? "right-[23px]" : "left-[23px]"}`} />
              <span className={`hero-rail-dot absolute top-7 h-8 w-px rounded-full bg-gradient-to-b from-[#EC911F] to-[#E32F54] shadow-[0_0_20px_rgba(236,145,31,0.72)] ${isArabic ? "right-[23px]" : "left-[23px]"}`} />

              {copy.hero.directionRows.map((item, index) => {
                const Icon = pathIcons[index] ?? AssessmentIcon;
                const accent = pathAccents[index] ?? pathAccents[0];
                return (
                  <div
                    key={item.title}
                    className={`hero-stagger group relative flex items-start gap-3 rounded-[22px] border border-[#391B68]/8 bg-white/82 p-4 shadow-md shadow-slate-950/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#EC911F]/40 hover:bg-white hover:shadow-xl hover:shadow-[#391B68]/8 ${isArabic ? "flex-row-reverse text-right" : ""}`}
                    style={{ animationDelay: `${260 + index * 95}ms` }}
                  >
                    <span className={`hero-path-icon relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${accent} text-white shadow-lg shadow-[#391B68]/16 ring-4 ring-white transition group-hover:scale-[1.03]`}>
                      <Icon />
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <strong className="block text-[18px] font-black text-[#391B68]">{item.title}</strong>
                      <span className="mt-1 block text-[14px] font-bold leading-6 text-slate-600">{item.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
