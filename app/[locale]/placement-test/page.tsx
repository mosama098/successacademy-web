import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PlacementPageFrame } from "@/features/placement-test/components/placement-page-frame";
import { PlacementRegistration } from "@/features/placement-test/components/placement-registration";
import { getPublicAttemptState } from "@/features/placement-test/server/attempt-service";
import { PLACEMENT_ATTEMPT_COOKIE } from "@/features/placement-test/server/cookie";
import type { PlacementLocale } from "@/features/placement-test/types";
import { locales } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type PlacementRegistrationPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PlacementRegistrationPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as PlacementLocale)) return {};
  const isArabic = locale === "ar";
  return createPageMetadata({
    title: isArabic ? "اختبار تحديد مستوى الإنجليزي | Success Academy" : "English Placement Assessment | Success Academy",
    description: isArabic
      ? "سجل وابدأ تقييم منظم في الاستماع والقراءة واستخدام اللغة لتحديد أنسب مستوى تبدأ منه."
      : "Register for a structured Listening, Reading, and Language Use assessment to find your most suitable starting level.",
    path: `/${locale}/placement-test`,
  });
}

export default async function PlacementRegistrationPage({ params }: PlacementRegistrationPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as PlacementLocale)) notFound();
  const currentLocale = locale as PlacementLocale;
  const token = (await cookies()).get(PLACEMENT_ATTEMPT_COOKIE)?.value;
  const existingState = token ? await getPublicAttemptState(token).catch(() => null) : null;

  return (
    <PlacementPageFrame locale={currentLocale} route="registration">
      <PlacementRegistration locale={currentLocale} existingState={existingState} />
    </PlacementPageFrame>
  );
}
