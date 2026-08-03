import Link from "next/link";
import { CtaLink } from "@/components/ui/cta-link";
import { alternateLocale, type Locale } from "@/lib/i18n";
import type { LandingContent } from "@/content";
import { BrandMark } from "./brand-mark";
import { bookingHref } from "./types";

export function Navbar({ locale, copy }: { locale: Locale; copy: LandingContent }) {
  const alt = alternateLocale[locale];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="Success Academy">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-7 text-[15px] font-black text-slate-700 md:flex">
          <a className="nav-link" href="#why">{copy.nav.why}</a>
          <a className="nav-link" href="#process">{copy.nav.process}</a>
          <a className="nav-link" href="#assessment">{copy.nav.assessment}</a>
          <a className="nav-link" href="#faq">{copy.nav.faq}</a>
        </div>

        <div className="flex items-center gap-2">
          <CtaLink href={`/${alt}`} locale={locale} source="navbar_language" event="language" variant="ghost">
            {copy.nav.language}
          </CtaLink>
          <CtaLink href={bookingHref} locale={locale} source="navbar" className="hidden h-[50px] px-6 sm:inline-flex">
            {copy.nav.book}
          </CtaLink>
        </div>
      </nav>
    </header>
  );
}

