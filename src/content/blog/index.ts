import type { Locale } from "@/lib/i18n";
import { arBlogArticles } from "./ar";
import { enBlogArticles } from "./en";

export type { BlogArticle, BlogContentBlock } from "./types";

export const blogArticles = {
  ar: arBlogArticles,
  en: enBlogArticles,
} satisfies Record<Locale, typeof arBlogArticles>;

export function getBlogArticle(locale: Locale, slug: string) {
  return blogArticles[locale].find((article) => article.slug === slug);
}
