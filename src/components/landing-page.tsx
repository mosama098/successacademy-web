import Link from "next/link";
import { alternateLocale, localeDirection, type Locale } from "@/lib/i18n";
import { content } from "@/content";
import { getWhatsAppHref } from "@/lib/utm";
import { LeadForm } from "@/components/lead-form";
import { PageTracker } from "@/components/page-tracker";
import { AnimatedSection } from "@/components/ui/animated-section";
import { CtaLink } from "@/components/ui/cta-link";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { StickyMobileCta } from "@/components/ui/sticky-mobile-cta";

type LandingPageProps = {
  locale: Locale;
};

const bookingHref = "#lead-form";

export function LandingPage({ locale }: LandingPageProps) {
  const t = content[locale];
  const dir = localeDirection[locale];
  const alt = alternateLocale[locale];
  const whatsappHref = getWhatsAppHref(locale);

  return (
    <main lang={locale} dir={dir} className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <PageTracker locale={locale} page="landing" />
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/86 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="Success Academy">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#391B68] text-lg font-black text-white shadow-lg shadow-[#391B68]/20">
              SA
            </span>
            <span>
              <span className="block text-base font-black text-[#391B68]">Success Academy</span>
              <span className="block text-xs font-semibold text-[#EC911F]">{t.footer.slogan}</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
            <a href="#why" className="nav-link">
              {t.nav.why}
            </a>
            <a href="#assessment" className="nav-link">
              {t.nav.assessment}
            </a>
            <a href="#process" className="nav-link">
              {t.nav.process}
            </a>
            <a href="#faq" className="nav-link">
              {t.nav.faq}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <CtaLink href={`/${alt}`} locale={locale} source="navbar_language" event="language" variant="ghost">
              {t.nav.language}
            </CtaLink>
            <CtaLink href={bookingHref} locale={locale} source="navbar" className="hidden sm:inline-flex">
              {t.nav.book}
            </CtaLink>
          </div>
        </nav>
      </header>

      <section className="hero-surface relative overflow-hidden bg-[#391B68] text-white">
        <div className="hero-grid" />
        <div className="hero-glow hero-glow-orange" />
        <div className="hero-glow hero-glow-pink" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-24">
          <AnimatedSection className="flex flex-col justify-center" delay={40}>
            <span className="mb-5 w-fit rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white/90 shadow-lg shadow-black/10">
              {t.hero.eyebrow}
            </span>
            <h1 className="max-w-4xl whitespace-pre-line text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href={bookingHref} locale={locale} source="hero_primary">
                {t.hero.primaryCta}
              </CtaLink>
              <CtaLink href={whatsappHref} locale={locale} source="hero_secondary" event="whatsapp" variant="secondary">
                {t.hero.whatsappCta}
              </CtaLink>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/70">{t.hero.note}</p>
          </AnimatedSection>

          <AnimatedSection className="relative" delay={160}>
            <div className="premium-plan-card relative rounded-[2rem] border border-white/18 bg-white p-5 text-slate-950 shadow-2xl shadow-black/25">
              <div className="absolute -top-5 end-8 rounded-full bg-[#E32F54] px-4 py-2 text-sm font-black text-white shadow-xl shadow-[#E32F54]/30">
                {t.hero.badge}
              </div>
              <div className="rounded-[1.4rem] bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-[#391B68] px-4 py-2 text-sm font-black text-white">
                    {t.hero.cardLabel}
                  </span>
                  <span className="text-sm font-bold text-[#EC911F]">01 → 04</span>
                </div>
                <div className="direction-rail mt-8">
                  {t.steps.items.map((item, index) => (
                    <div key={item.title} className="direction-node">
                      <span>{index + 1}</span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 hidden md:block">
              {t.hero.floatingCards.map((card, index) => (
                <span key={card} className={`floating-chip floating-chip-${index + 1}`}>
                  {card}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 grid max-w-6xl gap-3 px-5 sm:grid-cols-3 lg:px-8">
        {[t.delivery.onlineLabel, t.delivery.branchLabel, t.hero.badge].map((item, index) => (
          <AnimatedSection key={item} delay={index * 80}>
            <div className="rounded-2xl border border-white/70 bg-white/92 p-5 text-center font-black text-[#391B68] shadow-xl shadow-[#391B68]/10 backdrop-blur">
              {item}
            </div>
          </AnimatedSection>
        ))}
      </div>

      <Section id="why" eyebrow={t.footer.slogan} title={t.why.title} subtitle={t.why.subtitle}>
        <div className="grid gap-5 md:grid-cols-3">
          {t.why.items.map((item, index) => (
            <AnimatedSection key={item.title} delay={index * 90}>
              <article className="interactive-card h-full">
                <span className="card-icon">{index + 1}</span>
                <h3 className="text-xl font-black text-[#391B68]">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      <section id="assessment" className="relative bg-slate-50 px-5 py-16 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
        <AnimatedSection className="relative mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-[#391B68] p-6 text-white shadow-2xl shadow-[#391B68]/20 md:grid-cols-[0.9fr_1.1fr] md:p-10">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#EC911F]">{t.nav.assessment}</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{t.assessment.title}</h2>
            <p className="mt-4 leading-8 text-white/78">{t.assessment.description}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-slate-950 shadow-xl">
            <ul className="space-y-3">
              {t.assessment.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-base font-semibold leading-7">
                  <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-[#EC911F] to-[#E32F54]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <CtaLink href={bookingHref} locale={locale} source="assessment_section" className="mt-6 w-full justify-center">
              {t.assessment.cta}
            </CtaLink>
          </div>
        </AnimatedSection>
      </section>

      <Section id="process" title={t.steps.title}>
        <div className="journey-map">
          {t.steps.items.map((item, index) => (
            <AnimatedSection key={item.title} delay={index * 90} className="journey-card">
              <span className="journey-number">{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      <section className="premium-band px-5 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <AnimatedSection className="md:col-span-1">
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">{t.delivery.title}</h2>
          </AnimatedSection>
          <InfoBlock title={t.delivery.onlineLabel} text={t.delivery.online} delay={100} />
          <InfoBlock title={t.delivery.branchLabel} text={t.delivery.branch} delay={180} />
          <AnimatedSection className="text-sm leading-6 text-white/70 md:col-start-2 md:col-span-2" delay={220}>
            {t.delivery.note}
          </AnimatedSection>
        </div>
      </section>

      <Section title={t.successManager.title} subtitle={t.successManager.description}>
        <div className="grid gap-4 md:grid-cols-3">
          {t.successManager.points.map((point, index) => (
            <AnimatedSection key={point} delay={index * 90}>
              <div className="interactive-card h-full text-lg font-bold text-slate-800">
                <span className="card-icon">✓</span>
                {point}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      <LeadForm locale={locale} copy={t.form} />

      <section className="px-5 py-16 lg:px-8">
        <AnimatedSection className="mx-auto max-w-5xl rounded-[2rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-slate-950/20 md:p-12">
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">{t.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-8 text-white/72">{t.cta.description}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaLink href={bookingHref} locale={locale} source="final_cta">
              {t.cta.primary}
            </CtaLink>
            <CtaLink href={whatsappHref} locale={locale} source="final_cta" event="whatsapp" variant="secondary">
              {t.cta.secondary}
            </CtaLink>
          </div>
        </AnimatedSection>
      </section>

      <Section id="faq" title={t.faq.title}>
        <FaqAccordion items={t.faq.items} locale={locale} />
      </Section>

      <footer className="border-t border-slate-200 px-5 py-8 pb-24 lg:px-8 md:pb-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-black text-[#391B68]">{t.footer.slogan}</p>
          <p>{t.footer.rights}</p>
        </div>
      </footer>

      <StickyMobileCta locale={locale} copy={t.sticky} />
    </main>
  );
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedSection className="mb-9 max-w-3xl">
          {eyebrow ? <p className="mb-3 text-sm font-black uppercase tracking-wide text-[#E32F54]">{eyebrow}</p> : null}
          <h2 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{title}</h2>
          {subtitle ? <p className="mt-4 leading-8 text-slate-600">{subtitle}</p> : null}
        </AnimatedSection>
        {children}
      </div>
    </section>
  );
}

function InfoBlock({ title, text, delay }: { title: string; text: string; delay: number }) {
  return (
    <AnimatedSection delay={delay}>
      <article className="interactive-card border-white/15 bg-white/10 text-white hover:border-[#EC911F]/60">
        <span className="card-icon bg-[#EC911F]">↗</span>
        <h3 className="text-xl font-black text-[#EC911F]">{title}</h3>
        <p className="mt-3 leading-7 text-white/78">{text}</p>
      </article>
    </AnimatedSection>
  );
}
