import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/blog-index";
import { SitePageShell } from "@/components/site-page-shell";
import { getPublishedBlogArticles, paginateBlogArticles } from "@/content/blog";
import { sitePagesContent } from "@/content/site-pages";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type BlogPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

function parseRequestedPage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d+$/.test(candidate)) return 1;

  const page = Number(candidate);
  return Number.isSafeInteger(page) ? page : 1;
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const currentLocale = locale as Locale;
  const copy = sitePagesContent[currentLocale].blog;
  const publishedArticles = getPublishedBlogArticles(currentLocale);
  return createPageMetadata({
    title: `${copy.badge} | Success Academy`,
    description: copy.description,
    path: `/${locale}/blog`,
    image: publishedArticles[0]?.image,
  });
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const [{ locale }, { page }] = await Promise.all([params, searchParams]);
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const publishedArticles = getPublishedBlogArticles(currentLocale);
  const paginatedArticles = paginateBlogArticles(publishedArticles, parseRequestedPage(page));
  const pagePath = paginatedArticles.currentPage > 1 ? `blog?page=${paginatedArticles.currentPage}` : "blog";

  return (
    <SitePageShell locale={currentLocale} page="blog" pagePath={pagePath}>
      <BlogIndex locale={currentLocale} {...paginatedArticles} />
    </SitePageShell>
  );
}
