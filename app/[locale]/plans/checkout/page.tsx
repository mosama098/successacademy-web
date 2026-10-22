import { notFound } from "next/navigation";
import { SitePageShell } from "@/components/site-page-shell";
import { CheckoutFoundation } from "@/features/plans/components/checkout-foundation";
import {
  getPlanRecommendation,
  isAttendanceMode,
  isLearningLevel,
  isLearningPackageId,
  resolveProgramType,
} from "@/features/plans/config";
import { plansCopy } from "@/features/plans/copy";
import { getPlacementPlanContext } from "@/features/plans/server/placement-plan-context";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ program?: string; start?: string; target?: string; package?: string; attendance?: string }>;
};

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = plansCopy[locale as Locale];
  return createPageMetadata({
    title: copy.checkout.metaTitle,
    description: copy.checkout.metaDescription,
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
  const programType = resolveProgramType(query.program);
  const startMatchesContext = !placementContext || query.start === placementContext.startLevel;
  const recommendation = programType && startMatchesContext && isLearningLevel(query.start) && isLearningLevel(query.target)
    ? getPlanRecommendation(programType, query.start, query.target)
    : null;
  const validRecommendation = isLearningPackageId(query.package) && recommendation?.package.id === query.package
    ? recommendation
    : null;
  const initialAttendanceMode = isAttendanceMode(query.attendance) ? query.attendance : null;
  const pagePath = validRecommendation
    ? `plans/checkout?program=${validRecommendation.programType}&start=${validRecommendation.startLevel}&target=${validRecommendation.targetLevel}&package=${validRecommendation.package.id}${initialAttendanceMode ? `&attendance=${initialAttendanceMode}` : ""}`
    : "plans/checkout";

  return (
    <SitePageShell
      locale={currentLocale}
      page="plans_checkout"
      pagePath={pagePath}
      whatsappContext="package_review"
      whatsappDetails={{ packageName: validRecommendation?.package.name[currentLocale] }}
      whatsappSource="plans_checkout_floating_help"
    >
      <CheckoutFoundation
        locale={currentLocale}
        recommendation={validRecommendation}
        hasExistingLead={Boolean(placementContext?.hasLeadReference)}
        initialAttendanceMode={initialAttendanceMode}
      />
    </SitePageShell>
  );
}
