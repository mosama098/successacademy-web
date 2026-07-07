import Link from "next/link";
import { CtaLink } from "@/components/ui/cta-link";
import { alternateLocale } from "@/lib/i18n";
import { getWhatsAppHref } from "@/lib/utm";
import { BrandMark } from "./brand-mark";
import type { LandingSectionProps } from "./types";

export function FooterSection({ locale, copy }: LandingSectionProps) {
  const alt = alternateLocale[locale];
  const whatsappHref = getWhatsAppHref(locale);

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 pb-24 lg:px-10 md:pb-8">
      <div className="mx-auto grid max-w-[1180px] gap-6 text-[15px] font-bold text-slate-600 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3">
          <BrandMark slogan={copy.footer.slogan} compact />
          <p>{copy.footer.rights}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CtaLink href={whatsappHref} locale={locale} source="footer_whatsapp" event="whatsapp" className="h-[50px] px-6">
            {copy.footer.whatsapp}
          </CtaLink>
          <Link href={`/${locale}`} className="rounded-full px-4 py-2 font-black text-[#391B68] transition hover:text-[#EC911F]">
            {locale.toUpperCase()}
          </Link>
          <Link href={`/${alt}`} className="rounded-full px-4 py-2 font-black text-slate-600 transition hover:text-[#391B68]">
            {alt.toUpperCase()}
          </Link>
        </div>
      </div>
    </footer>
  );
}
