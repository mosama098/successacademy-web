import type { Locale } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/page-metadata";

export function buildHomepageStructuredData(locale: Locale, siteUrl = getSiteUrl()) {
  if (!siteUrl) return null;
  const socialProfiles = [process.env.NEXT_PUBLIC_FACEBOOK_URL, process.env.NEXT_PUBLIC_INSTAGRAM_URL, process.env.NEXT_PUBLIC_TIKTOK_URL, process.env.NEXT_PUBLIC_YOUTUBE_URL, process.env.NEXT_PUBLIC_LINKEDIN_URL]
    .map((value) => value?.trim()).filter((value): value is string => Boolean(value?.startsWith("https://")));
  const provider = { "@type": "EducationalOrganization", "@id": `${siteUrl}/#organization`, name: "Success Academy", url: siteUrl };
  return { "@context": "https://schema.org", "@graph": [
    { ...provider, logo: `${siteUrl}/logo.png`, foundingDate: "2015", ...(socialProfiles.length ? { sameAs: socialProfiles } : {}) },
    { "@type": "Course", name: locale === "ar" ? "برنامج الإنجليزي Group Live Online" : "Group Live Online English Programme", description: locale === "ar" ? "برنامج إنجليزي Live وتفاعلي أونلاين لمجموعة من 7–10 متدربين." : "An interactive Live Online English programme for a group of 7–10 learners.", inLanguage: locale, courseMode: "online", provider },
    { "@type": "Course", name: locale === "ar" ? "برنامج الإنجليزي Private 1:1 Live Online" : "Private 1:1 Live Online English Programme", description: locale === "ar" ? "برنامج إنجليزي فردي Live أونلاين بين متدرب واحد ومدرب واحد." : "A Live Online English programme for one learner with one trainer.", inLanguage: locale, courseMode: "online", provider },
  ] };
}

export function HomepageStructuredData({ locale }: { locale: Locale }) {
  const data = buildHomepageStructuredData(locale);
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
