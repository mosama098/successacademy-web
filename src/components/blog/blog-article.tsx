import Image from "next/image";
import Link from "next/link";
import { blogArticles, type BlogArticle as BlogArticleData } from "@/content/blog";
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

function ArrowIcon({ isArabic }: { isArabic: boolean }) {
  return (
    <svg className={isArabic ? "size-4 rotate-180" : "size-4"} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BlogArticle({ locale, article }: { locale: Locale; article: BlogArticleData }) {
  const copy = sitePagesContent[locale].blog;
  const isArabic = locale === "ar";
  const relatedArticles = blogArticles[locale].filter((item) => item.slug !== article.slug).slice(0, 2);
  const separator = isArabic ? "←" : "→";

  return (
    <article className="bg-[#FBFAFC] px-5 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1040px]">
        <nav aria-label={isArabic ? "مسار الصفحة" : "Breadcrumb"} className="mb-6 flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#766980]">
          <Link className="rounded-sm transition-colors hover:text-[#391B68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]" href={`/${locale}`}>{copy.breadcrumbHome}</Link>
          <span aria-hidden="true">{separator}</span>
          <Link className="rounded-sm transition-colors hover:text-[#391B68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]" href={`/${locale}/blog`}>{copy.breadcrumbBlog}</Link>
          <span aria-hidden="true">{separator}</span>
          <span className="max-w-full truncate text-[#391B68]" aria-current="page">{article.title}</span>
        </nav>

        <header className="mx-auto max-w-[820px] text-center">
          <span className="inline-flex rounded-full bg-[#EEE9F4] px-3 py-1.5 text-[13px] font-black text-[#391B68]">{article.category}</span>
          <h1 className="mt-4 text-balance text-[34px] font-black leading-[1.25] text-[#391B68] sm:text-[42px] lg:text-[48px]">{article.title}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[13px] font-bold text-[#766980]">
            <time dateTime={article.publishDate}>{formatDate(locale, article.publishDate)}</time>
            <span className="text-[#B7ACC3]" aria-hidden="true">•</span>
            <span>{article.readingTime}</span>
            <span className="text-[#B7ACC3]" aria-hidden="true">•</span>
            <span>{copy.author}</span>
          </div>
          <p className="mx-auto mt-5 max-w-[720px] text-[16px] font-semibold leading-[1.8] text-[#65596F] sm:text-[17px]">{article.excerpt}</p>
        </header>

        <div className="relative mt-8 aspect-[16/8.5] overflow-hidden rounded-[24px] border border-[#391B68]/12 bg-[#F3EEF7] shadow-[0_16px_44px_rgba(57,27,104,0.08)]">
          <Image src={article.image} alt={article.title} fill priority sizes="(min-width: 1024px) 1040px, 100vw" className="object-cover" />
        </div>

        <div className="mx-auto max-w-[760px] py-8 text-[16px] font-medium leading-[1.9] text-[#51465B] sm:py-10 sm:text-[17px]">
          {article.content.map((block, index) => {
            if (block.type === "heading") {
              return <h2 key={`${block.type}-${index}`} className="mb-3 mt-9 text-[25px] font-black leading-[1.4] text-[#391B68] sm:text-[28px]">{block.text}</h2>;
            }

            if (block.type === "list") {
              return (
                <ul key={`${block.type}-${index}`} className="my-5 grid gap-3 border-s-2 border-[#DDD3E8] ps-4 sm:ps-5">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-[0.72em] size-2 shrink-0 rounded-full bg-[#EC911F]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            return <p key={`${block.type}-${index}`} className="my-4">{block.text}</p>;
          })}
        </div>

        <aside className="mx-auto max-w-[820px] rounded-[22px] bg-[#391B68] px-5 py-7 text-center text-white sm:px-8 sm:py-8">
          <p className="mx-auto max-w-[650px] text-[15px] font-semibold leading-[1.75] text-[#E8E0F2] sm:text-[16px]">{copy.transition}</p>
          <Link href={`/${locale}#lead-form`} className="mt-5 inline-flex min-h-[50px] items-center justify-center rounded-[14px] bg-[#EC911F] px-6 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(236,145,31,0.24)] transition-colors hover:bg-[#D98113] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {copy.assessmentCta}
          </Link>
        </aside>

        <div className="mx-auto mt-10 max-w-[920px] border-t border-[#391B68]/12 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[24px] font-black text-[#391B68] sm:text-[27px]">{copy.relatedTitle}</h2>
            <Link href={`/${locale}/blog`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-[14px] font-black text-[#391B68] transition-colors hover:text-[#EC911F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]">
              <ArrowIcon isArabic={!isArabic} />
              {copy.returnToBlog}
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {relatedArticles.map((related) => (
              <Link key={related.slug} href={`/${locale}/blog/${related.slug}`} className="group grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-[#391B68]/12 bg-white shadow-[0_8px_24px_rgba(57,27,104,0.05)] transition-[border-color,box-shadow] hover:border-[#391B68]/28 hover:shadow-[0_12px_30px_rgba(57,27,104,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] sm:grid-cols-[132px_minmax(0,1fr)]">
                <div className="relative min-h-[126px] bg-[#F3EEF7]">
                  <Image src={related.image} alt="" fill sizes="132px" className="object-cover" />
                </div>
                <div className="p-4">
                  <span className="text-[11.5px] font-black text-[#EC911F]">{related.category}</span>
                  <h3 className="mt-1.5 text-[15px] font-black leading-[1.5] text-[#391B68] group-hover:text-[#4A287A]">{related.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
