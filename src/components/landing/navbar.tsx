import Link from "next/link";
import { CtaLink } from "@/components/ui/cta-link";
import { alternateLocale, type Locale } from "@/lib/i18n";
import type { LandingContent } from "@/content";
import { BrandMark } from "./brand-mark";

type NavbarProps = {
  locale: Locale;
  copy: LandingContent;
  pagePath?: string;
};

export function Navbar({ locale, copy, pagePath }: NavbarProps) {
  const alt = alternateLocale[locale];
  const landingPrefix = pagePath ? `/${locale}` : "";
  const alternateHref = pagePath ? `/${alt}/${pagePath}` : `/${alt}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="Success Academy">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-7 text-[15px] font-black text-slate-700 md:flex">
          <a className="nav-link" href={`${landingPrefix}#why`}>{copy.nav.why}</a>
          <a className="nav-link" href={`${landingPrefix}#process`}>{copy.nav.process}</a>
          <a className="nav-link" href={`${landingPrefix}#assessment`}>{copy.nav.assessment}</a>
          <a className="nav-link" href={`${landingPrefix}#faq`}>{copy.nav.faq}</a>
        </div>

        <div className="flex items-center gap-2">
          <CtaLink href={alternateHref} locale={locale} source="navbar_language" event="language" variant="ghost">
            {copy.nav.language}
          </CtaLink>
          <CtaLink href={`${landingPrefix}#lead-form`} locale={locale} source="navbar" className="hidden h-[50px] px-6 sm:inline-flex">
            {copy.nav.book}
          </CtaLink>
        </div>
      </nav>
    </header>
  );
}
