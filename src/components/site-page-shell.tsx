import type { ReactNode } from "react";
import { content } from "@/content";
import { FooterSection } from "@/components/landing/footer-section";
import { Navbar } from "@/components/landing/navbar";
import { PageTracker } from "@/components/page-tracker";
import { DesktopFloatingWhatsApp } from "@/components/ui/desktop-floating-whatsapp";
import { localeDirection, type Locale } from "@/lib/i18n";
import { getWhatsAppMessage, type WhatsAppPageContext } from "@/lib/utm";

type SitePageShellProps = {
  locale: Locale;
  page: string;
  pagePath: string;
  children: ReactNode;
  showFloatingWhatsApp?: boolean;
  showFloatingWhatsAppOnMobile?: boolean;
  avoidWhatsAppMobileOverlap?: boolean;
  whatsappMessage?: string;
  whatsappSource?: string;
  whatsappContext?: WhatsAppPageContext;
  whatsappDetails?: { packageName?: string | null; bookingReference?: string | null; articleTitle?: string | null };
};

export function SitePageShell({
  locale,
  page,
  pagePath,
  children,
  showFloatingWhatsApp = true,
  showFloatingWhatsAppOnMobile = true,
  avoidWhatsAppMobileOverlap = true,
  whatsappMessage,
  whatsappSource,
  whatsappContext = "home",
  whatsappDetails,
}: SitePageShellProps) {
  const copy = content[locale];
  const contextualWhatsAppMessage = whatsappMessage ?? getWhatsAppMessage(locale, whatsappContext, whatsappDetails);

  return (
    <div
      lang={locale}
      dir={localeDirection[locale]}
      className="min-h-screen overflow-x-hidden bg-[#FBFAFC] text-[#27183D]"
    >
      <PageTracker locale={locale} page={page} />
      <Navbar locale={locale} copy={copy} pagePath={pagePath} />
      <main>{children}</main>
      {showFloatingWhatsApp ? (
        <DesktopFloatingWhatsApp
          locale={locale}
          message={contextualWhatsAppMessage}
          source={whatsappSource}
          showOnMobile={showFloatingWhatsAppOnMobile}
          avoidMobileOverlap={avoidWhatsAppMobileOverlap}
        />
      ) : null}
      <FooterSection locale={locale} copy={copy} pagePath={pagePath} whatsappMessage={contextualWhatsAppMessage} />
    </div>
  );
}
