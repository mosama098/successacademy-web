import { notFound } from "next/navigation";
import { LegalPageContent } from "@/components/legal/legal-page";
import { SitePageShell } from "@/components/site-page-shell";
import { sitePagesContent } from "@/content/site-pages";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type LegalPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LegalPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = sitePagesContent[locale as Locale].legal;
  return createPageMetadata({
    title: `${copy.title} | Success Academy`,
    description: copy.description,
    path: `/${locale}/legal`,
  });
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  return (
    <SitePageShell locale={currentLocale} page="legal" pagePath="legal">
      <LegalPageContent locale={currentLocale} />
    </SitePageShell>
  );
}
