import Image from "next/image";
import Link from "next/link";
import type { BlogArticle } from "@/content/blog";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";

function ArrowIcon({ isArabic }: { isArabic: boolean }) {
  return (
    <svg
      className={isArabic ? "size-4 rotate-180" : "size-4"}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M6.5 2.75v3.5M13.5 2.75v3.5M3 8h14" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.25v4.1l2.7 1.65" strokeLinecap="round" strokeLinejoin="round" />
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] font-bold leading-none text-[#786C81] sm:text-[12.5px]">
      <span className="rounded-full bg-[#EEE9F4] px-2.5 py-1.5 text-[#391B68]">{article.category}</span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <CalendarIcon />
        <time dateTime={article.publishDate}>{formatDate(locale, article.publishDate)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <ClockIcon />
        {article.readingTime}
      </span>
    </div>
  );
}

function ReadArticleLabel({ locale }: { locale: Locale }) {
  const copy = sitePagesContent[locale].blog;

  return (
    <span className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#391B68] px-4 text-[14px] font-black text-white transition-colors group-hover:bg-[#4A287A]">
      {copy.readArticle}
      <ArrowIcon isArabic={locale === "ar"} />
    </span>
  );
}

function ArticleCard({ article, locale }: { article: BlogArticle; locale: Locale }) {
  const copy = sitePagesContent[locale].blog;

  return (
    <article className="h-full">
      <Link
        href={`/${locale}/blog/${article.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#391B68]/12 bg-white shadow-[0_8px_26px_rgba(57,27,104,0.055)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#391B68]/25 hover:shadow-[0_14px_34px_rgba(57,27,104,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#EC911F] motion-reduce:transform-none motion-reduce:transition-none"
        aria-label={`${copy.readArticle}: ${article.title}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#F3EEF7]">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(min-width: 1200px) 580px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <ArticleMeta article={article} locale={locale} />
          <h2 className="mt-3 line-clamp-3 text-[20px] font-black leading-[1.45] text-[#391B68] sm:text-[21px]">{article.title}</h2>
          <p className="mt-2.5 line-clamp-3 flex-1 text-[14.5px] font-semibold leading-[1.75] text-[#6B5E76]">{article.excerpt}</p>
          <div className="mt-5 flex">
            <ReadArticleLabel locale={locale} />
          </div>
        </div>
      </Link>
    </article>
  );
}

function FeaturedArticle({ article, locale }: { article: BlogArticle; locale: Locale }) {
  const copy = sitePagesContent[locale].blog;

  return (
    <article>
      <Link
        href={`/${locale}/blog/${article.slug}`}
        className="group grid overflow-hidden rounded-[22px] border border-[#391B68]/14 bg-white shadow-[0_12px_36px_rgba(57,27,104,0.07)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#391B68]/26 hover:shadow-[0_18px_44px_rgba(57,27,104,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#EC911F] motion-reduce:transform-none motion-reduce:transition-none md:grid-cols-2 md:items-stretch"
        aria-label={`${copy.readArticle}: ${article.title}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#F3EEF7] md:aspect-auto md:min-h-[300px]">
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="(min-width: 1200px) 600px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
          <ArticleMeta article={article} locale={locale} />
          <h2 className="mt-4 text-balance text-[25px] font-black leading-[1.38] text-[#391B68] sm:text-[28px] lg:text-[30px]">{article.title}</h2>
          <p className="mt-3 line-clamp-3 text-[15px] font-semibold leading-[1.75] text-[#6B5E76]">{article.excerpt}</p>
          <div className="mt-5 flex">
            <ReadArticleLabel locale={locale} />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function BlogIndex({ locale, articles }: { locale: Locale; articles: BlogArticle[] }) {
  const copy = sitePagesContent[locale].blog;

  return (
    <>
      <section className="border-b border-[#391B68]/10 bg-white px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-[1200px] text-center">
          <span className="inline-flex rounded-full bg-[#EEE9F4] px-3.5 py-1.5 text-[12.5px] font-black text-[#391B68]">{copy.badge}</span>
          <h1 className="mx-auto mt-3.5 max-w-[780px] text-balance text-[32px] font-black leading-[1.22] text-[#391B68] sm:text-[40px] lg:text-[46px]">{copy.title}</h1>
          <p className="mx-auto mt-3.5 max-w-[670px] text-[15px] font-semibold leading-[1.75] text-[#6B5E76] sm:text-[16px]">{copy.description}</p>
        </div>
      </section>

      <section className="px-5 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-[1200px]">
          <FeaturedArticle article={articles[0]} locale={locale} />

          <div className="mt-6 grid items-stretch gap-5 md:grid-cols-2 lg:gap-6">
            {articles.slice(1).map((article) => (
              <ArticleCard key={article.slug} article={article} locale={locale} />
            ))}
          </div>

          <aside className="mt-8 rounded-[20px] border border-[#391B68]/12 bg-[#EEE9F4] px-5 py-5 text-center sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7 sm:text-start lg:px-8">
            <p className="text-balance text-[18px] font-black leading-[1.5] text-[#391B68] sm:max-w-[650px] sm:text-[20px]">{copy.indexCtaTitle}</p>
            <Link
              href={`/${locale}#lead-form`}
              className="mt-4 inline-flex min-h-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EC911F] px-6 text-[15px] font-black text-white shadow-[0_8px_20px_rgba(236,145,31,0.18)] transition-colors hover:bg-[#D98113] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#391B68] sm:mt-0"
            >
              {copy.assessmentCta}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
