import type { ReactNode } from "react";
import { content } from "@/content";
import { FooterSection } from "@/components/landing/footer-section";
import { Navbar } from "@/components/landing/navbar";
import { PageTracker } from "@/components/page-tracker";
import { DesktopFloatingWhatsApp } from "@/components/ui/desktop-floating-whatsapp";
import { localeDirection, type Locale } from "@/lib/i18n";

type SitePageShellProps = {
  locale: Locale;
  page: string;
  pagePath: string;
  children: ReactNode;
};

export function SitePageShell({ locale, page, pagePath, children }: SitePageShellProps) {
  const copy = content[locale];

  return (
    <div
      lang={locale}
      dir={localeDirection[locale]}
      className="min-h-screen overflow-x-hidden bg-[#FBFAFC] text-[#27183D]"
    >
      <PageTracker locale={locale} page={page} />
      <Navbar locale={locale} copy={copy} pagePath={pagePath} />
      <main>{children}</main>
      <FooterSection locale={locale} copy={copy} pagePath={pagePath} />
      <DesktopFloatingWhatsApp locale={locale} />
    </div>
  );
}
