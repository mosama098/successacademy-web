import Image from "next/image";
import Link from "next/link";
import type { BlogArticle } from "@/content/blog";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";

function ArrowIcon({ isArabic }: { isArabic: boolean }) {
  return (
    <svg className={isArabic ? "size-4 rotate-180" : "size-4"} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function ArticleMeta({ article, locale }: { article: BlogArticle; locale: Locale }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-bold text-[#786C81] sm:text-[12.5px]">
      <span className="rounded-full bg-[#EEE9F4] px-2.5 py-1 text-[#391B68]">{article.category}</span>
      <span className="text-[#B7ACC3]" aria-hidden="true">•</span>
      <time dateTime={article.publishDate}>{formatDate(locale, article.publishDate)}</time>
      <span className="text-[#B7ACC3]" aria-hidden="true">•</span>
      <span>{article.readingTime}</span>
    </div>
  );
}

function ArticleCard({ article, locale }: { article: BlogArticle; locale: Locale }) {
  const copy = sitePagesContent[locale].blog;
  const isArabic = locale === "ar";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#391B68]/12 bg-white shadow-[0_12px_34px_rgba(57,27,104,0.06)] transition-[border-color,box-shadow] hover:border-[#391B68]/24 hover:shadow-[0_18px_42px_rgba(57,27,104,0.1)] focus-within:border-[#391B68]/35 focus-within:ring-2 focus-within:ring-[#EC911F]/45">
      <div className="relative aspect-[16/8.5] overflow-hidden bg-[#F3EEF7]">
        <Image src={article.image} alt={article.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02]" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <ArticleMeta article={article} locale={locale} />
        <h2 className="mt-3 text-[21px] font-black leading-[1.45] text-[#391B68]">{article.title}</h2>
        <p className="mt-2.5 flex-1 text-[14.5px] font-semibold leading-[1.75] text-[#6B5E76]">{article.excerpt}</p>
        <Link href={`/${locale}/blog/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#391B68] px-4 text-[14px] font-black text-white transition-colors hover:bg-[#4A287A] focus-visible:outline-none" aria-label={`${copy.readArticle}: ${article.title}`}>
          {copy.readArticle}
          <ArrowIcon isArabic={isArabic} />
        </Link>
      </div>
    </article>
  );
}

function FeaturedArticle({ article, locale }: { article: BlogArticle; locale: Locale }) {
  const copy = sitePagesContent[locale].blog;
  const isArabic = locale === "ar";

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#391B68]/14 bg-white shadow-[0_16px_44px_rgba(57,27,104,0.08)] transition-[border-color,box-shadow] hover:border-[#391B68]/26 hover:shadow-[0_20px_52px_rgba(57,27,104,0.11)] focus-within:ring-2 focus-within:ring-[#EC911F]/45 md:grid md:grid-cols-[1.05fr_0.95fr] md:items-stretch">
      <div className="relative aspect-[16/9] overflow-hidden bg-[#F3EEF7] md:aspect-auto md:min-h-[330px]">
        <Image src={article.image} alt={article.title} fill priority sizes="(min-width: 768px) 52vw, 100vw" className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02]" />
      </div>
      <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
        <ArticleMeta article={article} locale={locale} />
        <h2 className="mt-4 text-[25px] font-black leading-[1.4] text-[#391B68] sm:text-[29px]">{article.title}</h2>
        <p className="mt-3 text-[15px] font-semibold leading-[1.8] text-[#6B5E76]">{article.excerpt}</p>
        <Link href={`/${locale}/blog/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#391B68] px-5 text-[14px] font-black text-white transition-colors hover:bg-[#4A287A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]" aria-label={`${copy.readArticle}: ${article.title}`}>
          {copy.readArticle}
          <ArrowIcon isArabic={isArabic} />
        </Link>
      </div>
    </article>
  );
}

export function BlogIndex({ locale, articles }: { locale: Locale; articles: BlogArticle[] }) {
  const copy = sitePagesContent[locale].blog;

  return (
    <>
      <section className="border-b border-[#391B68]/10 bg-white px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]">
        <div className="mx-auto max-w-[1120px] text-center">
          <span className="inline-flex rounded-full bg-[#EEE9F4] px-4 py-2 text-[13px] font-black text-[#391B68]">{copy.badge}</span>
          <h1 className="mx-auto mt-4 max-w-[820px] text-balance text-[34px] font-black leading-[1.2] text-[#391B68] sm:text-[42px] lg:text-[48px]">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-[680px] text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">{copy.description}</p>
        </div>
      </section>

      <section className="px-5 py-11 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1120px]">
          <FeaturedArticle article={articles[0]} locale={locale} />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {articles.slice(1).map((article) => <ArticleCard key={article.slug} article={article} locale={locale} />)}
          </div>

          <aside className="mt-10 rounded-[22px] border border-[#391B68]/12 bg-[#EEE9F4] px-5 py-6 text-center sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7 sm:text-start">
            <p className="text-[19px] font-black leading-[1.5] text-[#391B68] sm:text-[21px]">{copy.indexCtaTitle}</p>
            <Link href={`/${locale}#lead-form`} className="mt-4 inline-flex min-h-[50px] shrink-0 items-center justify-center rounded-[14px] bg-[#EC911F] px-6 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(236,145,31,0.2)] transition-colors hover:bg-[#D98113] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#391B68] sm:mt-0">
              {copy.assessmentCta}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
