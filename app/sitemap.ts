import type { MetadataRoute } from "next";
import { getPublishedBlogArticles } from "@/content/blog";
import { locales } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/page-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];
  const staticPaths = ["", "/placement-test", "/plans", "/business", "/blog", "/legal"];
  const staticEntries = locales.flatMap((locale) => staticPaths.map((path) => ({ url: `${siteUrl}/${locale}${path}`, changeFrequency: path === "/blog" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : path === "/legal" ? 0.2 : 0.7 })));
  const articlesByLocale = await Promise.all(locales.map(async (locale) => ({ locale, articles: await getPublishedBlogArticles(locale) })));
  const articleEntries = articlesByLocale.flatMap(({ locale, articles }) => articles.map((article) => ({ url: `${siteUrl}/${locale}/blog/${article.slug}`, lastModified: article.publishDate, changeFrequency: "monthly" as const, priority: 0.6 })));
  return [...staticEntries, ...articleEntries];
}
