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
    locale: locale as Locale,
    title: locale === "ar" ? "تدريب إنجليزي للشركات | أونلاين وداخل مقر الشركة | Success Academy" : "Corporate English Training | Online, On-site & Hybrid | Success Academy",
    description: locale === "ar" ? "برامج إنجليزي للشركات أونلاين أو داخل مقر العميل أو بنظام Hybrid، مع تقييم مستوى وتقارير متابعة للإدارة." : "Corporate English training delivered Online, on-site at your premises, or in a hybrid format, with level assessment and management progress reports.",
    path: `/${locale}/business`,
  });
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  return (
    <SitePageShell locale={currentLocale} page="business" pagePath="business" whatsappContext="business" whatsappSource="business_floating_help">
      <BusinessPageContent locale={currentLocale} />
    </SitePageShell>
  );
}
