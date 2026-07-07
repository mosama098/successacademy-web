import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { getWhatsAppHref } from "@/lib/utm";
import { bookingHref, type LandingSectionProps } from "./types";

export function HeroSection({ locale, copy }: LandingSectionProps) {
  const isArabic = locale === "ar";
  const whatsappHref = getWhatsAppHref(locale);

  return (
    <section className="relative overflow-hidden bg-[#391B68] text-white">
      <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#EC911F]/30 blur-3xl" />
      <div className="absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-[#E32F54]/25 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[length:28px_28px] opacity-60" />

      <div className="relative mx-auto grid max-w-[1180px] gap-12 px-6 py-20 lg:min-h-[680px] lg:grid-cols-2 lg:items-center lg:px-10">
        <AnimatedSection delay={60} className={`max-w-[620px] ${isArabic ? "lg:col-start-1 lg:justify-self-end lg:text-right" : ""}`}>
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[13px] font-black text-white shadow-xl">
            {copy.hero.eyebrow}
          </span>
          <h1 className="mt-7 max-w-[620px] whitespace-pre-line text-[38px] font-black leading-[1.08] text-white lg:text-[58px]">
            {copy.hero.title}
          </h1>
          <p className="mt-6 max-w-[560px] text-[16px] font-bold leading-8 text-white/80 lg:text-[19px]">
            {copy.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <CtaLink href={bookingHref} locale={locale} source="hero_primary" className="h-[56px] px-8">
              {copy.hero.primaryCta}
            </CtaLink>
            <CtaLink href={whatsappHref} locale={locale} source="hero_secondary" event="whatsapp" variant="secondary" className="h-[56px] px-8">
              {copy.hero.whatsappCta}
            </CtaLink>
          </div>
          <p className="mt-5 max-w-[560px] text-[15px] font-bold leading-7 text-white/70">{copy.hero.note}</p>
        </AnimatedSection>

        <AnimatedSection delay={140} className={isArabic ? "lg:col-start-2 lg:row-start-1" : ""}>
          <div className="mx-auto max-w-[460px] rounded-[32px] bg-white p-6 text-slate-950 shadow-2xl shadow-black/25 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[#391B68] px-4 py-2 text-[13px] font-black text-white">{copy.hero.cardLabel}</span>
              <span className="rounded-full bg-[#EC911F]/15 px-4 py-2 text-[13px] font-black text-[#391B68]">{copy.hero.badge}</span>
            </div>
            <div className="grid gap-4">
              {copy.hero.directionRows.map((item, index) => (
                <div key={item.title} className="flex gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-lg shadow-slate-950/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#EC911F]/50 hover:bg-white hover:shadow-xl">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#391B68] to-[#E32F54] text-lg font-black text-white">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="block text-xl font-black text-[#391B68]">{item.title}</strong>
                    <span className="mt-1 block text-[15px] font-bold leading-7 text-slate-600">{item.description}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
