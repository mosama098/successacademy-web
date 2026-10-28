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
      ? "Success Academy | مش مجرد كورس... اتجاه"
      : "Success Academy | Not Just A Course... A Direction",
    description: isArabic
      ? "اتعلم الإنجليزي Live أونلاين على Zoom، في Group من 7–10 أو Private 1:1، وابدأ باختبار تحديد مستوى مجاني."
      : "Learn English Live Online on Zoom in a group of 7–10 or Private 1:1, starting with a free Placement Test.",
  };
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return <LandingPage locale={locale as Locale} />;
}
