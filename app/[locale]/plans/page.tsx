import { notFound } from "next/navigation";
import { SitePageShell } from "@/components/site-page-shell";
import { PlansLeadGate } from "@/features/plans/components/plans-lead-gate";
import { RecommendedPlanPage } from "@/features/plans/components/recommended-plan-page";
import { isLearningLevel, resolveProgramType } from "@/features/plans/config";
import { plansCopy } from "@/features/plans/copy";
import { getPlansAccessContext } from "@/features/plans/server/plans-access";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type PlansPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string; target?: string; program?: string }>;
};

export async function generateMetadata({ params }: PlansPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = plansCopy[locale as Locale];
  return createPageMetadata({
    title: copy.meta.title,
    description: copy.meta.description,
    path: `/${locale}/plans`,
  });
}

export default async function PlansPage({ params, searchParams }: PlansPageProps) {
  const [{ locale }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const { registered, placementContext } = await getPlansAccessContext();
  const initialProgramType = resolveProgramType(query.program) ?? "group";
  const initialStartLevel = placementContext?.startLevel ?? (isLearningLevel(query.level) ? query.level : null);
  const initialTargetLevel = isLearningLevel(query.target) ? query.target : null;
  const pageQuery = new URLSearchParams();
  if (initialProgramType !== "group") pageQuery.set("program", initialProgramType);
  if (initialStartLevel) pageQuery.set("level", initialStartLevel);
  if (initialTargetLevel) pageQuery.set("target", initialTargetLevel);
  const pagePath = pageQuery.size ? `plans?${pageQuery.toString()}` : "plans";

  return (
    <SitePageShell
      locale={currentLocale}
      page="plans"
      pagePath={pagePath}
      whatsappContext="plans"
      whatsappSource="plans_floating_help"
    >
      {registered ? (
        <RecommendedPlanPage
          locale={currentLocale}
          initialStartLevel={initialStartLevel}
          initialTargetLevel={initialTargetLevel}
          initialProgramType={initialProgramType}
          fromAssessment={Boolean(placementContext)}
        />
      ) : (
        <PlansLeadGate locale={currentLocale} />
      )}
    </SitePageShell>
  );
}
