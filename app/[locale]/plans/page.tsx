import { notFound } from "next/navigation";
import { SitePageShell } from "@/components/site-page-shell";
import { RecommendedPlanPage } from "@/features/plans/components/recommended-plan-page";
import { isLearningLevel } from "@/features/plans/config";
import { plansCopy } from "@/features/plans/copy";
import { getPlacementPlanContext } from "@/features/plans/server/placement-plan-context";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type PlansPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string; source?: string }>;
};

export async function generateMetadata({ params }: PlansPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = plansCopy[locale as Locale];
  return createPageMetadata({
    title: `${copy.badge} | Success Academy`,
    description: copy.heroDescription,
    path: `/${locale}/plans`,
  });
}

export default async function PlansPage({ params, searchParams }: PlansPageProps) {
  const [{ locale }, query, placementContext] = await Promise.all([
    params,
    searchParams,
    getPlacementPlanContext(),
  ]);
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const initialCurrentLevel = placementContext?.currentLevel ?? (isLearningLevel(query.level) ? query.level : null);
  const fromAssessment = Boolean(placementContext || (initialCurrentLevel && query.source === "placement"));
  const pagePath = fromAssessment
    ? `plans?level=${initialCurrentLevel}&source=placement`
    : initialCurrentLevel
      ? `plans?level=${initialCurrentLevel}`
      : "plans";

  return (
    <SitePageShell locale={currentLocale} page="plans" pagePath={pagePath}>
      <RecommendedPlanPage
        locale={currentLocale}
        initialCurrentLevel={initialCurrentLevel}
        fromAssessment={fromAssessment}
      />
    </SitePageShell>
  );
}
