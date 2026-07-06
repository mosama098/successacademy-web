import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { locales, type Locale } from "@/lib/i18n";

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

  const isArabic = locale === "ar";

  return {
    title: isArabic
      ? "Success Academy | كورسات إنجليزي"
      : "Success Academy | English Courses",
    description: isArabic
      ? "احجز تقييمك وحدد اتجاهك في تعلم الإنجليزية مع Success Academy."
      : "Book your assessment and choose a clearer direction for English learning with Success Academy.",
  };
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return <LandingPage locale={locale as Locale} />;
}
