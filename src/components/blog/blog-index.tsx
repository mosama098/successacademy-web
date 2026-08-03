import Link from "next/link";
import type { BlogArticle } from "@/content/blog";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";

function ArrowIcon({ isArabic }: { isArabic: boolean }) {
  return (
    <svg
      className={isArabic ? "h-4 w-4 rotate-180" : "h-4 w-4"}
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

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BlogIndex({ locale, articles }: { locale: Locale; articles: BlogArticle[] }) {
  const copy = sitePagesContent[locale].blog;
  const isArabic = locale === "ar";

  return (
    <>
      <section className="border-b border-[#391B68]/10 bg-white px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1120px] text-center">
          <span className="inline-flex rounded-full bg-[#EEE9F4] px-4 py-2 text-[13px] font-black text-[#391B68]">
            {copy.badge}
          </span>
          <h1 className="mx-auto mt-4 max-w-[820px] text-balance text-[34px] font-black leading-[1.2] text-[#391B68] sm:text-[42px] lg:text-[48px]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[680px] text-[15px] font-semibold leading-[1.8] text-[#6B5E76] sm:text-[16px]">
            {copy.description}
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-[72px]">
        <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="flex min-h-[330px] flex-col overflow-hidden rounded-[22px] border border-[#391B68]/12 bg-white shadow-[0_14px_40px_rgba(57,27,104,0.07)]"
            >
              <div className="flex h-2" aria-hidden="true">
                <span className="w-1/4 bg-[#EC911F]" />
                <span className="flex-1 bg-[#EEE9F4]" />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-[#766980]">
                  <span className="rounded-full bg-[#EEE9F4] px-3 py-1.5 text-[#391B68]">{article.category}</span>
                  <span aria-hidden="true">•</span>
                  <time dateTime={article.publishDate}>{formatDate(locale, article.publishDate)}</time>
                </div>
                <h2 className="mt-4 text-[22px] font-black leading-[1.45] text-[#391B68]">
                  {article.title}
                </h2>
                <p className="mt-3 flex-1 text-[14.5px] font-semibold leading-[1.75] text-[#6B5E76]">
                  {article.excerpt}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#391B68]/10 pt-4">
                  <span className="text-[12.5px] font-bold text-[#82758B]">{article.readingTime}</span>
                  <Link
                    href={`/${locale}/blog/${article.slug}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#391B68] px-4 text-[14px] font-black text-white transition-colors hover:bg-[#4A287A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]"
                    aria-label={`${copy.readArticle}: ${article.title}`}
                  >
                    {copy.readArticle}
                    <ArrowIcon isArabic={isArabic} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
