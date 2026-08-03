import { notFound } from "next/navigation";
import { BusinessPageContent } from "@/components/business/business-page";
import { SitePageShell } from "@/components/site-page-shell";
import { sitePagesContent } from "@/content/site-pages";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type BusinessPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BusinessPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = sitePagesContent[locale as Locale].business;
  return createPageMetadata({
    title: `${copy.badge} | Success Academy`,
    description: copy.heroDescription,
    path: `/${locale}/business`,
  });
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  return (
    <SitePageShell locale={currentLocale} page="business" pagePath="business">
      <BusinessPageContent locale={currentLocale} />
    </SitePageShell>
  );
}
