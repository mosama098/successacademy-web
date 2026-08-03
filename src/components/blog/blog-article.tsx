import Link from "next/link";
import type { BlogArticle as BlogArticleData } from "@/content/blog";
import { sitePagesContent } from "@/content/site-pages";
import type { Locale } from "@/lib/i18n";

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BlogArticle({ locale, article }: { locale: Locale; article: BlogArticleData }) {
  const copy = sitePagesContent[locale].blog;

  return (
    <article className="bg-[#FBFAFC] px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[820px]">
        <nav aria-label={locale === "ar" ? "مسار الصفحة" : "Breadcrumb"} className="mb-7 flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#766980]">
          <Link className="rounded-sm hover:text-[#391B68]" href={`/${locale}`}>{copy.breadcrumbHome}</Link>
          <span aria-hidden="true">/</span>
          <Link className="rounded-sm hover:text-[#391B68]" href={`/${locale}/blog`}>{copy.breadcrumbBlog}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#391B68]" aria-current="page">{article.title}</span>
        </nav>

        <header className="border-b border-[#391B68]/12 pb-8">
          <span className="inline-flex rounded-full bg-[#EEE9F4] px-3 py-1.5 text-[13px] font-black text-[#391B68]">
            {article.category}
          </span>
          <h1 className="mt-4 text-balance text-[34px] font-black leading-[1.25] text-[#391B68] sm:text-[42px] lg:text-[48px]">
            {article.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[13px] font-bold text-[#766980]">
            <time dateTime={article.publishDate}>{formatDate(locale, article.publishDate)}</time>
            <span aria-hidden="true">•</span>
            <span>{article.readingTime}</span>
          </div>
        </header>

        <div className="py-8 text-[16px] font-medium leading-[1.9] text-[#51465B] sm:text-[17px]">
          {article.content.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h2 key={`${block.type}-${index}`} className="mb-3 mt-9 text-[25px] font-black leading-[1.4] text-[#391B68] sm:text-[28px]">
                  {block.text}
                </h2>
              );
            }

            if (block.type === "list") {
              return (
                <ul key={`${block.type}-${index}`} className="my-5 grid gap-3">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_6px_20px_rgba(57,27,104,0.04)]">
                      <span className="mt-[0.7em] size-2 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            return <p key={`${block.type}-${index}`} className="my-4">{block.text}</p>;
          })}
        </div>

        <aside className="rounded-[22px] bg-[#391B68] px-5 py-7 text-center text-white sm:px-8 sm:py-8">
          <p className="text-[20px] font-black leading-[1.5] sm:text-[22px]">{copy.assessmentCta}</p>
          <Link
            href={`/${locale}#lead-form`}
            className="mt-5 inline-flex min-h-[50px] items-center justify-center rounded-[14px] bg-[#EC911F] px-6 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(236,145,31,0.24)] transition-colors hover:bg-[#D98113] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {copy.assessmentCta}
          </Link>
        </aside>
      </div>
    </article>
  );
}
