import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { HomepageStructuredData } from "@/components/seo/homepage-structured-data";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

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

  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const currentLocale = locale as Locale;
  const isArabic = currentLocale === "ar";
  return createPageMetadata({
    locale: currentLocale,
    title: isArabic
      ? "كورس إنجليزي أونلاين Live | اختبار تحديد مستوى مجاني | Success Academy"
      : "Live Online English Course & Free Placement Test | Success Academy",
    description: isArabic
      ? "اتعلم الإنجليزي Live أونلاين على Zoom في Group من 7–10 أو Private 1:1، وابدأ باختبار تحديد مستوى مجاني."
      : "Learn English Live Online on Zoom in a group of 7–10 or Private 1:1, starting with a free Placement Test.",
    path: `/${currentLocale}`,
    image: "/hero-model.png",
  });
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  return <><HomepageStructuredData locale={currentLocale} /><LandingPage locale={currentLocale} /></>;
}
