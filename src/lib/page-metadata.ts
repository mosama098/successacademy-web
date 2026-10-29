import type { Metadata } from "next";
import { alternateLocale, locales, type Locale } from "@/lib/i18n";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  locale?: Locale;
  index?: boolean;
  languageAlternates?: boolean;
};

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || null;
}

export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  image,
  locale,
  index = true,
  languageAlternates = true,
}: PageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = siteUrl ? `${siteUrl}${path}` : undefined;
  const imageUrl = image?.startsWith("https://") ? image : siteUrl && image ? `${siteUrl}${image}` : undefined;
  const pathLocale = locales.find((candidate) => path === `/${candidate}` || path.startsWith(`/${candidate}/`));
  const currentLocale = locale ?? pathLocale;
  const alternatePath = currentLocale
    ? path.replace(new RegExp(`^/${currentLocale}(?=/|$)`), `/${alternateLocale[currentLocale]}`)
    : null;
  const languages = siteUrl && currentLocale && alternatePath && languageAlternates
    ? {
        [currentLocale]: canonical!,
        [alternateLocale[currentLocale]]: `${siteUrl}${alternatePath}`,
        "x-default": `${siteUrl}${path.replace(new RegExp(`^/${currentLocale}(?=/|$)`), "/ar")}`,
      }
    : undefined;

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical, ...(languages ? { languages } : {}) } } : {}),
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type,
      siteName: "Success Academy",
      ...(currentLocale ? {
        locale: currentLocale === "ar" ? "ar_EG" : "en_US",
        alternateLocale: [currentLocale === "ar" ? "en_US" : "ar_EG"],
      } : {}),
      ...(canonical ? { url: canonical } : {}),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: title }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
