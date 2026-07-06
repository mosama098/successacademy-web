import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/content";
import { locales, localeDirection, type Locale } from "@/lib/i18n";
import { PageTracker } from "@/components/page-tracker";
import { ThankYouActions } from "@/components/thank-you-actions";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) return {};

  const isArabic = locale === "ar";

  return {
    title: isArabic ? "تم تسجيل طلبك | Success Academy" : "Request received | Success Academy",
    description: isArabic
      ? "وصلنا بياناتك وفريق Success Academy هيتواصل معاك بخصوص التقييم المجاني."
      : "We received your details and the Success Academy team will contact you about the free level check.",
  };
}

export default async function ThankYouPage({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const t = content[currentLocale];

  return (
    <main
      lang={currentLocale}
      dir={localeDirection[currentLocale]}
      className="hero-surface relative min-h-screen overflow-hidden bg-[#391B68] px-5 py-8 text-white lg:px-8"
    >
      <PageTracker locale={currentLocale} page="thank_you" />
      <div className="hero-grid" />
      <div className="hero-glow hero-glow-orange" />
      <div className="hero-glow hero-glow-pink" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center text-center">
        <Link href={`/${currentLocale}`} className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-lg font-black text-[#391B68]">
            SA
          </span>
          <span className="text-start">
            <span className="block font-black">Success Academy</span>
            <span className="block text-xs font-bold text-[#EC911F]">{t.footer.slogan}</span>
          </span>
        </Link>

        <section className="rounded-[2rem] border border-white/18 bg-white/10 p-7 shadow-2xl shadow-black/20 backdrop-blur md:p-12">
          <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#EC911F] to-[#E32F54] text-3xl font-black">
            ✓
          </span>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">{t.thankYou.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/78">{t.thankYou.subtitle}</p>
          <ThankYouActions locale={currentLocale} copy={t.thankYou} />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-white/64">{t.thankYou.note}</p>
        </section>
      </div>
    </main>
  );
}
