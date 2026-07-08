import Link from "next/link";
import { CtaLink } from "@/components/ui/cta-link";
import { alternateLocale } from "@/lib/i18n";
import { getCallHref, getWhatsAppHref } from "@/lib/utm";
import { BrandMark, hasLogoAsset } from "./brand-mark";
import type { LandingSectionProps } from "./types";

const socialLinks = [
  { label: "Facebook", env: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: "Instagram", env: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "TikTok", env: process.env.NEXT_PUBLIC_TIKTOK_URL },
  { label: "YouTube", env: process.env.NEXT_PUBLIC_YOUTUBE_URL },
  { label: "LinkedIn", env: process.env.NEXT_PUBLIC_LINKEDIN_URL },
];

const footerLabels = {
  ar: {
    quickLinksTitle: "روابط سريعة",
    contactTitle: "تواصل معنا",
    socialTitle: "تابعنا",
    languageTitle: "اللغة",
    requestCall: "اطلب مكالمة",
    languages: { ar: "العربية", en: "English" },
  },
  en: {
    quickLinksTitle: "Quick links",
    contactTitle: "Contact",
    socialTitle: "Follow us",
    languageTitle: "Language",
    requestCall: "Request a call",
    languages: { ar: "العربية", en: "English" },
  },
};

export function FooterSection({ locale, copy }: LandingSectionProps) {
  const alt = alternateLocale[locale];
  const whatsappHref = getWhatsAppHref(locale);
  const callHref = getCallHref();
  const hasLogo = hasLogoAsset();
  const labels = footerLabels[locale];
  const quickLinks = [
    { href: "#why", label: copy.nav.why },
    { href: "#process", label: copy.nav.process },
    { href: "#lead-form", label: copy.nav.assessment },
    { href: "#faq", label: copy.nav.faq },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-12 pb-24 lg:px-10 md:pb-12">
      <div className="mx-auto grid max-w-[1180px] gap-10 text-[15px] font-bold text-slate-600 lg:grid-cols-[1.25fr_0.8fr_1fr_0.9fr]">
        <div className="grid content-start gap-4">
          <BrandMark slogan={copy.footer.slogan} compact placement="footer" />
          {hasLogo ? <p className="font-black text-[#391B68]">{copy.footer.slogan}</p> : null}
          <p className="max-w-sm leading-7">{copy.footer.rights}</p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#391B68]">{labels.quickLinksTitle}</h3>
          <nav className="grid gap-3">
            {quickLinks.map((link) => (
              <a key={link.href} href={`/${locale}${link.href}`} className="transition hover:text-[#EC911F]">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#391B68]">{labels.contactTitle}</h3>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <CtaLink href={whatsappHref} locale={locale} source="footer_whatsapp" event="whatsapp" className="h-[50px] px-6">
              {copy.footer.whatsapp}
            </CtaLink>
            <CtaLink href={callHref} locale={locale} source="footer_request_call" event="request_call" variant="secondary" className="h-[50px] px-6">
              {labels.requestCall}
            </CtaLink>
          </div>
        </div>

        <div className="grid content-start gap-7">
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#391B68]">{labels.socialTitle}</h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) =>
                social.env ? (
                  <a
                    key={social.label}
                    href={social.env}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black transition hover:border-[#EC911F] hover:text-[#EC911F]"
                  >
                    {social.label}
                  </a>
                ) : (
                  <span key={social.label} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-400">
                    {social.label}
                  </span>
                ),
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#391B68]">{labels.languageTitle}</h3>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}`} className="rounded-full bg-[#391B68] px-4 py-2 font-black text-white">
                {locale === "ar" ? labels.languages.ar : labels.languages.en}
              </Link>
              <CtaLink href={`/${alt}`} locale={locale} source="footer_language" event="language" variant="ghost">
                {alt === "ar" ? labels.languages.ar : labels.languages.en}
              </CtaLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
