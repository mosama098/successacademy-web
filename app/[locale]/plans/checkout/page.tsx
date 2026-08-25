import { notFound } from "next/navigation";
import { SitePageShell } from "@/components/site-page-shell";
import { CheckoutFoundation } from "@/features/plans/components/checkout-foundation";
import { getPlanRecommendation, isLearningLevel } from "@/features/plans/config";
import { plansCopy } from "@/features/plans/copy";
import { getPlacementPlanContext } from "@/features/plans/server/placement-plan-context";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ current?: string; target?: string; package?: string }>;
};

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = plansCopy[locale as Locale];
  return createPageMetadata({
    title: `${copy.checkoutBadge} | Success Academy`,
    description: copy.checkoutDescription,
    path: `/${locale}/plans/checkout`,
  });
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const [{ locale }, query, placementContext] = await Promise.all([
    params,
    searchParams,
    getPlacementPlanContext(),
  ]);
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const recommendation = isLearningLevel(query.current) && isLearningLevel(query.target)
    ? getPlanRecommendation(query.current, query.target)
    : null;
  const validRecommendation = recommendation?.package.id === query.package ? recommendation : null;
  const pagePath = validRecommendation
    ? `plans/checkout?current=${validRecommendation.currentLevel}&target=${validRecommendation.targetLevel}&package=${validRecommendation.package.id}`
    : "plans/checkout";

  return (
    <SitePageShell locale={currentLocale} page="plans_checkout" pagePath={pagePath}>
      <CheckoutFoundation
        locale={currentLocale}
        recommendation={validRecommendation}
        hasExistingLead={Boolean(placementContext?.hasLeadReference)}
      />
    </SitePageShell>
  );
}
