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
      ? "اعرف مستواك مجانا وابدأ طريق واضح لتعلم الإنجليزية مع متابعة من Success Manager."
      : "Get your free level check and start a clear English learning direction with Success Manager follow-up.",
  };
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return <LandingPage locale={locale as Locale} />;
}
