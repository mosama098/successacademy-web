import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SitePageShell } from "@/components/site-page-shell";
import { PaymentCheckout } from "@/features/payments/components/payment-checkout";
import { paymentCopy } from "@/features/payments/copy";
import { getLegalPolicyLinks } from "@/features/payments/server/legal-consent";
import { isManualPaymentMethod } from "@/features/payments/validation";
import { getPlanRecommendation, isAttendanceMode, isLearningLevel, isLearningPackageId, resolveProgramType } from "@/features/plans/config";
import { getPlacementPlanContext } from "@/features/plans/server/placement-plan-context";
import { locales, type Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ program?: string; start?: string; target?: string; package?: string; attendance?: string; method?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  return { title: paymentCopy[locale as Locale].title, robots: { index: false, follow: false } };
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const currentLocale = locale as Locale;
  const query = await searchParams;
  const placement = await getPlacementPlanContext();
  const programType = resolveProgramType(query.program);
  const recommendation = programType && (!placement || placement.startLevel === query.start) && isLearningLevel(query.start) && isLearningLevel(query.target)
    ? getPlanRecommendation(programType, query.start, query.target) : null;
  const validPlan = isLearningPackageId(query.package) && recommendation?.package.id === query.package ? recommendation : null;
  const attendance = isAttendanceMode(query.attendance) ? query.attendance : null;
  const initialMethod = isManualPaymentMethod(query.method) ? query.method : null;
  const routeQuery = validPlan ? new URLSearchParams({ program: validPlan.programType, start: validPlan.startLevel, target: validPlan.targetLevel, package: validPlan.package.id }) : null;
  if (routeQuery && !attendance) redirect(`/${locale}/plans/checkout?${routeQuery.toString()}`);
  if (routeQuery && attendance) routeQuery.set("attendance", attendance);
  if (routeQuery && initialMethod) routeQuery.set("method", initialMethod);
  const copy = paymentCopy[currentLocale];

  return (
    <SitePageShell locale={currentLocale} page="plans_payment" pagePath={`plans/payment${routeQuery ? `?${routeQuery}` : ""}`}
      whatsappContext="payment" whatsappDetails={{ packageName: validPlan?.package.name[currentLocale] }} whatsappSource="plans_payment_floating_help">
      {validPlan && attendance ? (
        <PaymentCheckout key={`${locale}:${validPlan.startLevel}:${validPlan.targetLevel}:${attendance}:${initialMethod ?? "none"}`} locale={currentLocale} recommendation={validPlan} attendance={attendance} legalLinks={getLegalPolicyLinks(currentLocale)} initialMethod={initialMethod} />
      ) : (
        <section className="bg-[#f7f3ed] px-5 py-12">
          <div className="mx-auto max-w-xl rounded-[24px] border border-[#321d43]/10 bg-white p-8 text-center">
            <h1 className="text-2xl font-black text-[#321d43]">{copy.invalidTitle}</h1>
            <p className="mt-3 leading-7 text-[#563a64]">{copy.invalidBody}</p>
            <Link href={`/${locale}/plans`} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#321d43] px-6 font-bold !text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{copy.plans}</Link>
          </div>
        </section>
      )}
    </SitePageShell>
  );
}
