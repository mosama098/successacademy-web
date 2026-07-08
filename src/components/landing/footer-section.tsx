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

function SocialIcon({ label }: { label: string }) {
  const iconClass = "h-4 w-4";

  if (label === "Facebook") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14.2 8.3V6.9c0-.7.5-.9 1-.9h1.8V3.2A23 23 0 0 0 14.4 3c-2.6 0-4.3 1.5-4.3 4.2v1.1H7.3v3.2h2.8V21h3.5v-9.5h2.8l.5-3.2h-3.3Z" />
      </svg>
    );
  }

  if (label === "Instagram") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M16.8 7.2h.01" />
      </svg>
    );
  }

  if (label === "TikTok") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14.5 3c.4 2.6 1.9 4.2 4.5 4.4v3.1a7.4 7.4 0 0 1-4.4-1.4v5.7c0 3.7-2.4 6.2-5.8 6.2A5.4 5.4 0 0 1 3.4 15c0-3.4 2.6-5.8 6.3-5.6v3.3c-1.7-.2-3 .7-3 2.3 0 1.4 1 2.5 2.4 2.5 1.5 0 2.3-.9 2.3-2.8V3h3.1Z" />
      </svg>
    );
  }

  if (label === "YouTube") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2a31 31 0 0 0 0 7.6 3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 0-7.6ZM10.2 15.5v-7l5.8 3.5-5.8 3.5Z" />
      </svg>
    );
  }

  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.2 8.8h3.5V21H5.2V8.8Zm1.8-5.7a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM11 8.8h3.3v1.7h.1c.5-.9 1.7-2 3.5-2 3.7 0 4.4 2.4 4.4 5.6V21h-3.5v-6.1c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H11V8.8Z" />
    </svg>
  );
}

function SocialItem({ social }: { social: { label: string; env: string | undefined } }) {
  const className =
    "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-black transition";

  if (social.env) {
    return (
      <a
        href={social.env}
        target="_blank"
        rel="noreferrer"
        className={`${className} border-[#391B68]/15 bg-white text-[#391B68] shadow-sm shadow-[#391B68]/5 hover:-translate-y-0.5 hover:border-[#EC911F]/60 hover:bg-[#fff7ed] hover:text-[#E32F54]`}
      >
        <SocialIcon label={social.label} />
        <span>{social.label}</span>
      </a>
    );
  }

  return (
    <span className={`${className} border-slate-200 bg-slate-50 text-slate-500`}>
      <SocialIcon label={social.label} />
      <span>{social.label}</span>
    </span>
  );
}

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
            <CtaLink
              href={callHref}
              locale={locale}
              source="footer_request_call"
              event="request_call"
              variant="secondary"
              className="h-[50px] border-[#391B68] bg-white px-6 text-[#391B68] shadow-sm shadow-[#391B68]/10 hover:bg-[#391B68]/5 hover:text-[#391B68]"
            >
              {labels.requestCall}
            </CtaLink>
          </div>
        </div>

        <div className="grid content-start gap-7">
          <div>
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#391B68]">{labels.socialTitle}</h3>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {socialLinks.map((social) => (
                <SocialItem key={social.label} social={social} />
              ))}
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
