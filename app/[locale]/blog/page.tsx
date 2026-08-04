import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/blog-index";
import { SitePageShell } from "@/components/site-page-shell";
import { blogArticles } from "@/content/blog";
import { sitePagesContent } from "@/content/site-pages";
import { locales, type Locale } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/page-metadata";

type BlogPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BlogPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  const copy = sitePagesContent[locale as Locale].blog;
  return createPageMetadata({
    title: `${copy.badge} | Success Academy`,
    description: copy.description,
    path: `/${locale}/blog`,
    image: blogArticles[locale as Locale][0].image,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  return (
    <SitePageShell locale={currentLocale} page="blog" pagePath="blog">
      <BlogIndex locale={currentLocale} articles={blogArticles[currentLocale]} />
    </SitePageShell>
  );
}
