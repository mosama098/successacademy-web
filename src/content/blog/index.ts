import type { Locale } from "@/lib/i18n";
import { getStoryblokBlogArticle, getStoryblokBlogArticles } from "@/lib/storyblok";
import type { BlogArticle } from "./types";

export type { BlogArticle } from "./types";

export const BLOG_ARTICLES_PER_PAGE = 9;

function getPublicationTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;

  return timestamp;
}

function compareArticles(left: BlogArticle, right: BlogArticle) {
  const featuredDifference = Number(right.featured) - Number(left.featured);
  if (featuredDifference !== 0) return featuredDifference;

  const dateDifference = (getPublicationTimestamp(right.publishDate) ?? 0) - (getPublicationTimestamp(left.publishDate) ?? 0);
  return dateDifference || left.slug.localeCompare(right.slug);
}

function isCompleteStoryblokArticle(article: BlogArticle) {
  return (
    article.storyblokBody.type === "doc" &&
    article.slug.trim().length > 0 &&
    article.title.trim().length > 0 &&
    article.excerpt.trim().length > 0 &&
    article.category.trim().length > 0 &&
    article.readingTime.trim().length > 0 &&
    getPublicationTimestamp(article.publishDate) !== null
  );
}

export async function getPublishedBlogArticles(locale: Locale, now = new Date()) {
  return (await getStoryblokBlogArticles(locale)).filter((article) => {
    const publishTimestamp = getPublicationTimestamp(article.publishDate);

    return (
      isCompleteStoryblokArticle(article) &&
      publishTimestamp !== null &&
      publishTimestamp <= now.getTime()
    );
  }).toSorted(compareArticles);
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

export async function getBlogArticle(locale: Locale, slug: string, now = new Date()) {
  const storyblokArticle = await getStoryblokBlogArticle(locale, slug);
  const storyblokPublishTimestamp = storyblokArticle
    ? getPublicationTimestamp(storyblokArticle.publishDate)
    : null;

  if (
    storyblokArticle &&
    isCompleteStoryblokArticle(storyblokArticle) &&
    storyblokPublishTimestamp !== null &&
    storyblokPublishTimestamp <= now.getTime()
  ) {
    return storyblokArticle;
  }

  return undefined;
}
