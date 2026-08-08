import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/blog-article";
import { SitePageShell } from "@/components/site-page-shell";
import {
  getBlogArticle,
  getLocalPublishedBlogArticles,
  getPublishedBlogArticles,
} from "@/content/blog";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getLocalPublishedBlogArticles(locale).map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const article = await getBlogArticle(locale as Locale, slug);
  if (!article) return {};

  return createPageMetadata({
    title: article.seoTitle,
    description: article.seoDescription,
    path: `/${locale}/blog/${article.slug}`,
    type: "article",
    image: article.image,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const [article, articles] = await Promise.all([
    getBlogArticle(currentLocale, slug),
    getPublishedBlogArticles(currentLocale),
  ]);
  if (!article) notFound();

  const relatedArticles = articles.filter((candidate) => candidate.slug !== slug).slice(0, 2);

  return (
    <SitePageShell locale={currentLocale} page="blog_article" pagePath={`blog/${slug}`}>
      <BlogArticle locale={currentLocale} article={article} relatedArticles={relatedArticles} />
    </SitePageShell>
  );
}
