import Link from "next/link";
import { alternateLocale, localeDirection, type Locale } from "@/lib/i18n";
import { content } from "@/content";

type LandingPageProps = {
  locale: Locale;
};

const bookingHref = "#assessment";
const whatsappHref = "https://wa.me/200000000000";

export function LandingPage({ locale }: LandingPageProps) {
  const t = content[locale];
  const dir = localeDirection[locale];
  const alt = alternateLocale[locale];

  return (
    <main lang={locale} dir={dir} className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="Success Academy">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#391B68] text-lg font-black text-white">
              SA
            </span>
            <span>
              <span className="block text-base font-black text-[#391B68]">Success Academy</span>
              <span className="block text-xs font-semibold text-[#EC911F]">{t.footer.slogan}</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
            <a href="#why" className="transition hover:text-[#391B68]">
              {t.nav.why}
            </a>
            <a href="#assessment" className="transition hover:text-[#391B68]">
              {t.nav.assessment}
            </a>
            <a href="#process" className="transition hover:text-[#391B68]">
              {t.nav.process}
            </a>
            <a href="#faq" className="transition hover:text-[#391B68]">
              {t.nav.faq}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${alt}`}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-[#391B68] hover:text-[#391B68]"
            >
              {t.nav.language}
            </Link>
            <a
              href={bookingHref}
              className="hidden rounded-full bg-[#391B68] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#391B68]/20 transition hover:bg-[#2d1454] sm:inline-flex"
            >
              {t.nav.book}
            </a>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-[#391B68] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(236,145,31,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(227,47,84,0.3),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 w-fit rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white/90">
              {t.hero.eyebrow}
            </span>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={bookingHref}
                className="inline-flex items-center justify-center rounded-full bg-[#EC911F] px-7 py-3.5 text-base font-black text-white shadow-xl shadow-black/15 transition hover:bg-[#d87f13]"
              >
                {t.hero.primaryCta}
              </a>
              <a
                href={whatsappHref}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-base font-black text-white transition hover:bg-white/18"
              >
                {t.hero.whatsappCta}
              </a>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/70">{t.hero.note}</p>
          </div>

          <div className="rounded-2xl border border-white/14 bg-white p-5 text-slate-950 shadow-2xl shadow-black/20">
            <div className="rounded-xl bg-slate-50 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#E32F54] px-4 py-2 text-sm font-black text-white">
                  {t.hero.badge}
                </span>
                <span className="text-sm font-bold text-[#391B68]">English Courses</span>
              </div>
              <div className="mt-8 space-y-4">
                {t.steps.items.slice(0, 3).map((item, index) => (
                  <div key={item.title} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#391B68] text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section id="why" eyebrow={t.footer.slogan} title={t.why.title} subtitle={t.why.subtitle}>
        <div className="grid gap-5 md:grid-cols-3">
          {t.why.items.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-[#391B68]">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <section id="assessment" className="bg-slate-50 px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl bg-[#391B68] p-6 text-white md:grid-cols-[0.9fr_1.1fr] md:p-10">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#EC911F]">{t.nav.assessment}</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">{t.assessment.title}</h2>
            <p className="mt-4 leading-8 text-white/78">{t.assessment.description}</p>
          </div>
          <div className="rounded-xl bg-white p-5 text-slate-950">
            <ul className="space-y-3">
              {t.assessment.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-base font-semibold leading-7">
                  <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#EC911F]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://calendly.com/success-academy/assessment"
              className="mt-6 inline-flex w-full justify-center rounded-full bg-[#E32F54] px-6 py-3.5 text-base font-black text-white transition hover:bg-[#ca294b]"
            >
              {t.assessment.cta}
            </a>
          </div>
        </div>
      </section>

      <Section id="process" title={t.steps.title}>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.steps.items.map((item, index) => (
            <article key={item.title} className="rounded-xl border border-slate-200 p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#EC911F] text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <section className="bg-[#391B68] px-5 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-3xl font-black sm:text-4xl">{t.delivery.title}</h2>
          </div>
          <InfoBlock title="Online" text={t.delivery.online} />
          <InfoBlock title={locale === "ar" ? "فرع الدقي" : "Dokki branch"} text={t.delivery.branch} />
          <p className="text-sm leading-6 text-white/70 md:col-start-2 md:col-span-2">{t.delivery.note}</p>
        </div>
      </section>

      <Section title={t.successManager.title} subtitle={t.successManager.description}>
        <div className="grid gap-4 md:grid-cols-3">
          {t.successManager.points.map((point) => (
            <div key={point} className="rounded-xl bg-slate-50 p-5 text-lg font-bold text-slate-800">
              {point}
            </div>
          ))}
        </div>
      </Section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-slate-950 p-8 text-center text-white md:p-12">
          <h2 className="text-3xl font-black sm:text-4xl">{t.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-8 text-white/72">{t.cta.description}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={bookingHref} className="rounded-full bg-[#EC911F] px-7 py-3.5 font-black text-white">
              {t.cta.primary}
            </a>
            <a href={whatsappHref} className="rounded-full border border-white/25 px-7 py-3.5 font-black text-white">
              {t.cta.secondary}
            </a>
          </div>
        </div>
      </section>

      <Section id="faq" title={t.faq.title}>
        <div className="grid gap-4 md:grid-cols-2">
          {t.faq.items.map((item) => (
            <details key={item.question} className="group rounded-xl border border-slate-200 p-5">
              <summary className="cursor-pointer list-none text-lg font-black text-[#391B68]">
                {item.question}
              </summary>
              <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <footer className="border-t border-slate-200 px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-black text-[#391B68]">{t.footer.slogan}</p>
          <p>{t.footer.rights}</p>
        </div>
      </footer>
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
        <div className="mb-9 max-w-3xl">
          {eyebrow ? <p className="mb-3 text-sm font-black uppercase tracking-wide text-[#E32F54]">{eyebrow}</p> : null}
          <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">{title}</h2>
          {subtitle ? <p className="mt-4 leading-8 text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-white/15 bg-white/10 p-6">
      <h3 className="text-xl font-black text-[#EC911F]">{title}</h3>
      <p className="mt-3 leading-7 text-white/78">{text}</p>
    </article>
  );
}
