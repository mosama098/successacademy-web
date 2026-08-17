import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PlacementAssessment } from "@/features/placement-test/components/placement-assessment";
import { PlacementPageFrame } from "@/features/placement-test/components/placement-page-frame";
import { getPublicAttemptState } from "@/features/placement-test/server/attempt-service";
import { PLACEMENT_ATTEMPT_COOKIE } from "@/features/placement-test/server/cookie";
import type { PlacementLocale } from "@/features/placement-test/types";
import { locales } from "@/lib/i18n";

type PlacementAssessmentPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "English Placement Assessment | Success Academy",
  robots: { index: false, follow: false },
};

export default async function PlacementAssessmentPage({ params }: PlacementAssessmentPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as PlacementLocale)) notFound();
  const currentLocale = locale as PlacementLocale;
  const token = (await cookies()).get(PLACEMENT_ATTEMPT_COOKIE)?.value;
  if (!token) redirect(`/${currentLocale}/placement-test`);

  const state = await getPublicAttemptState(token).catch(() => null);
  if (!state) redirect(`/${currentLocale}/placement-test`);

  return (
    <PlacementPageFrame locale={currentLocale} route="assessment">
      <PlacementAssessment locale={currentLocale} initialState={state} />
    </PlacementPageFrame>
  );
}
