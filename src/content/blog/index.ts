import type { Locale } from "@/lib/i18n";
import { getStoryblokBlogArticles } from "@/lib/storyblok";
import { arBlogArticles } from "./ar";
import { enBlogArticles } from "./en";
import type { BlogArticle, BlogContentBlock } from "./types";

export type { BlogArticle, BlogContentBlock } from "./types";

export const BLOG_ARTICLES_PER_PAGE = 9;

const blogArticleRegistry = {
  ar: arBlogArticles,
  en: enBlogArticles,
} satisfies Record<Locale, BlogArticle[]>;

/*
 * Local migration fallback:
 * 1. Keep matching Arabic and English records in ar.ts and en.ts using the same slug.
 * 2. Store the local cover in public/images/blog/ and set image plus meaningful imageAlt values.
 * 3. Complete every required metadata, SEO, and content field defined by BlogArticle.
 * 4. Set published to true when ready; future publication dates remain hidden until that date.
 * 5. Set featured to true on the one article that should lead page 1. Otherwise, newest content leads.
 * New articles should be published in Storyblok. A matching Storyblok slug overrides this fallback.
 */

function getPublicationTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;

  return timestamp;
}

function isCompleteBlock(block: BlogContentBlock) {
  if (block.type === "list") return block.items.length > 0 && block.items.every((item) => item.trim().length > 0);
  return block.text.trim().length > 0;
}

function isCompleteArticle(article: BlogArticle) {
  const requiredText = [
    article.slug,
    article.title,
    article.excerpt,
    article.publishDate,
    article.readingTime,
    article.category,
    article.image,
    article.imageAlt,
    article.seoTitle,
    article.seoDescription,
  ];

  return (
    requiredText.every((value) => value.trim().length > 0) &&
    article.image.startsWith("/images/blog/") &&
    getPublicationTimestamp(article.publishDate) !== null &&
    article.content.length > 0 &&
    article.content.every(isCompleteBlock)
  );
}

function compareArticles(left: BlogArticle, right: BlogArticle) {
  const featuredDifference = Number(right.featured) - Number(left.featured);
  if (featuredDifference !== 0) return featuredDifference;

  const dateDifference = (getPublicationTimestamp(right.publishDate) ?? 0) - (getPublicationTimestamp(left.publishDate) ?? 0);
  return dateDifference || left.slug.localeCompare(right.slug);
}

export function getLocalPublishedBlogArticles(locale: Locale, now = new Date()) {
  const pairedLocale: Locale = locale === "ar" ? "en" : "ar";
  const pairedArticles = new Map(blogArticleRegistry[pairedLocale].map((article) => [article.slug, article]));

  return blogArticleRegistry[locale]
    .filter((article) => {
      const pairedArticle = pairedArticles.get(article.slug);
      const publishTimestamp = getPublicationTimestamp(article.publishDate);
      const pairedPublishTimestamp = pairedArticle ? getPublicationTimestamp(pairedArticle.publishDate) : null;

      return (
        article.locale === locale &&
        article.published &&
        publishTimestamp !== null &&
        publishTimestamp <= now.getTime() &&
        isCompleteArticle(article) &&
        pairedArticle?.locale === pairedLocale &&
        pairedArticle.published &&
        pairedPublishTimestamp !== null &&
        pairedPublishTimestamp <= now.getTime() &&
        isCompleteArticle(pairedArticle)
      );
    })
    .toSorted(compareArticles);
}

function isCompleteStoryblokArticle(article: BlogArticle) {
  return (
    article.storyblokBody?.type === "doc" &&
    article.slug.trim().length > 0 &&
    article.title.trim().length > 0 &&
    article.excerpt.trim().length > 0 &&
    article.category.trim().length > 0 &&
    article.readingTime.trim().length > 0 &&
    getPublicationTimestamp(article.publishDate) !== null
  );
}

export async function getPublishedBlogArticles(locale: Locale, now = new Date()) {
  const pairedLocale: Locale = locale === "ar" ? "en" : "ar";
  const [localizedStoryblokArticles, pairedStoryblokArticles] = await Promise.all([
    getStoryblokBlogArticles(locale),
    getStoryblokBlogArticles(pairedLocale),
  ]);
  const pairedStoryblokSlugs = new Set(
    pairedStoryblokArticles.filter(isCompleteStoryblokArticle).map((article) => article.slug),
  );
  const storyblokArticles = localizedStoryblokArticles.filter((article) => {
    const publishTimestamp = getPublicationTimestamp(article.publishDate);

    return (
      isCompleteStoryblokArticle(article) &&
      pairedStoryblokSlugs.has(article.slug) &&
      publishTimestamp !== null &&
      publishTimestamp <= now.getTime()
    );
  });
  const articlesBySlug = new Map(
    getLocalPublishedBlogArticles(locale, now).map((article) => [article.slug, article]),
  );

  // Storyblok is authoritative during migration when a published slug exists in both sources.
  for (const article of storyblokArticles) articlesBySlug.set(article.slug, article);

  return Array.from(articlesBySlug.values()).toSorted(compareArticles);
}

export function paginateBlogArticles(articles: BlogArticle[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(articles.length / BLOG_ARTICLES_PER_PAGE));
  const safeRequestedPage = Number.isSafeInteger(requestedPage) ? requestedPage : 1;
  const currentPage = Math.min(Math.max(safeRequestedPage, 1), totalPages);
  const start = (currentPage - 1) * BLOG_ARTICLES_PER_PAGE;

  return {
    articles: articles.slice(start, start + BLOG_ARTICLES_PER_PAGE),
    currentPage,
    totalPages,
  };
}

export async function getBlogArticle(locale: Locale, slug: string) {
  return (await getPublishedBlogArticles(locale)).find((article) => article.slug === slug);
}
