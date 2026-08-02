import Image from "next/image";
import Link from "next/link";
import { CtaLink } from "@/components/ui/cta-link";
import type { Locale } from "@/lib/i18n";
import { getCallHref, getWhatsAppHref } from "@/lib/utm";
import type { LandingSectionProps } from "./types";

const socialLinks = [
  {
    label: "Facebook",
    href: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    hoverClass: "hover:border-[#1877F2]/45 hover:text-[#1877F2]",
  },
  {
    label: "Instagram",
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    hoverClass: "hover:border-[#E4405F]/45 hover:text-[#E4405F]",
  },
  {
    label: "TikTok",
    href: process.env.NEXT_PUBLIC_TIKTOK_URL,
    hoverClass: "hover:border-black/35 hover:text-black",
  },
  {
    label: "YouTube",
    href: process.env.NEXT_PUBLIC_YOUTUBE_URL,
    hoverClass: "hover:border-[#FF0000]/45 hover:text-[#FF0000]",
  },
  {
    label: "LinkedIn",
    href: process.env.NEXT_PUBLIC_LINKEDIN_URL,
    hoverClass: "hover:border-[#0A66C2]/45 hover:text-[#0A66C2]",
  },
];

function SocialIcon({ label }: { label: string }) {
  const iconClass = "h-5 w-5";

  if (label === "Facebook") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14.2 8.3V6.9c0-.7.5-.9 1-.9h1.8V3.2A23 23 0 0 0 14.4 3c-2.6 0-4.3 1.5-4.3 4.2v1.1H7.3v3.2h2.8V21h3.5v-9.5h2.8l.5-3.2h-3.3Z" />
      </svg>
    );
  }

  if (label === "Instagram") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
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

function SocialItem({ social }: { social: (typeof socialLinks)[number] }) {
  const classes = `grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[#391B68]/12 bg-white text-[#391B68] shadow-[0_6px_16px_rgba(57,27,104,0.05)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] ${social.hoverClass}`;

  if (!social.href) {
    return (
      <span className={`${classes} opacity-45`} aria-hidden="true">
        <SocialIcon label={social.label} />
      </span>
    );
  }

  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.label}
      className={classes}
    >
      <SocialIcon label={social.label} />
    </a>
  );
}

function ContactIcon({ type }: { type: "whatsapp" | "phone" | "globe" | "location" }) {
  const className = "h-[18px] w-[18px] shrink-0";

  if (type === "whatsapp") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5.2-1.4A9.7 9.7 0 1 0 12 2Zm0 17.7c-1.5 0-2.9-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A7.9 7.9 0 1 1 12 19.7Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.4.6-1.2.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.2-.1-.4-.2-.7-.3Z" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M8.3 3.8 5.8 5c-1 .5-1.4 1.6-1 2.6 2.3 5.7 5.9 9.3 11.6 11.6 1 .4 2.1 0 2.6-1l1.2-2.5-4-2-1.4 2c-2.8-1.2-5.3-3.7-6.5-6.5l2-1.4-2-4Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "globe") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.1 5.1 3.1 8.5S14.1 18.2 12 20.5C9.9 18.2 8.9 15.4 8.9 12S9.9 5.8 12 3.5Z" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LanguageOption({ option, locale, label }: { option: Locale; locale: Locale; label: string }) {
  if (option === locale) {
    return (
      <Link
        href={`/${option}`}
        className="grid place-items-center rounded-[9px] bg-[#391B68] text-[13px] font-black !text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#EC911F]"
      >
        {label}
      </Link>
    );
  }

  return (
    <CtaLink
      href={`/${option}`}
      locale={locale}
      source="footer_language"
      event="language"
      variant="ghost"
      className="!grid !h-auto !min-h-0 !place-items-center !rounded-[9px] !border-0 !bg-transparent !p-0 !text-[13px] !font-black !text-[#391B68] hover:!bg-[#EEE9F4] focus-visible:!outline-offset-1"
    >
      {label}
    </CtaLink>
  );
}

export function FooterSection({ locale, copy }: LandingSectionProps) {
  const isArabic = locale === "ar";
  const whatsappHref = getWhatsAppHref(locale);
  const callHref = getCallHref();
  const footer = copy.footer;
  const quickLinks = [
    { href: "#why", label: footer.quickLinks.why },
    { href: "#trainers", label: footer.quickLinks.trainers },
    { href: "#registration-steps", label: footer.quickLinks.registration },
    { href: "#lead-form", label: footer.quickLinks.assessment },
    { href: "#faq", label: footer.quickLinks.faq },
    { href: "#about-success-academy", label: footer.quickLinks.about },
  ];

  return (
    <footer id="site-footer" className="border-t border-[#391B68]/12 bg-[#FBFAFC] px-5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-10 sm:px-6 md:pb-8 md:pt-12 lg:px-8 lg:pb-7 lg:pt-[52px]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1160px]">
        <div className="grid gap-4 text-[14px] font-bold text-[#6B5E76] md:grid-cols-2 md:gap-8 lg:grid-cols-[1.3fr_0.95fr_1.05fr_1fr] lg:gap-9">
          <section className="border-b border-[#391B68]/10 pb-4 text-center md:border-b-0 md:pb-0 lg:text-start" aria-labelledby={`footer-brand-${locale}`}>
            <div className="mx-auto w-[150px] md:w-[175px] lg:mx-0 lg:w-[190px]">
              <Image
                src="/logo.png"
                alt={isArabic ? "شعار Success Academy" : "Success Academy logo"}
                width={190}
                height={95}
                sizes="(min-width: 1024px) 190px, 165px"
                className="object-contain"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <h2 id={`footer-brand-${locale}`} className="mt-1 text-[18px] font-black leading-[1.4] text-[#391B68]">
              {footer.slogan}
            </h2>
            <span className="mx-auto mt-2 block h-0.5 w-10 rounded-full bg-[#EC911F] lg:mx-0" aria-hidden="true" />
            <p className="mx-auto mt-2 max-w-[310px] text-[14px] font-semibold leading-[1.6] lg:mx-0">
              {footer.description}
            </p>
          </section>

          <nav className="border-b border-[#391B68]/10 pb-4 md:border-b-0 md:pb-0" aria-label={footer.quickLinksTitle}>
            <h2 className="mb-2.5 text-[15px] font-black text-[#391B68] lg:mb-3.5">{footer.quickLinksTitle}</h2>
            <ul className="grid grid-cols-2 gap-x-3 lg:grid-cols-1 lg:gap-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={`/${locale}${link.href}`}
                    className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-[13.5px] font-bold leading-[1.35] text-[#665A70] transition-colors hover:text-[#EC911F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F] lg:min-h-0 lg:text-[14px]"
                  >
                    <span className={isArabic ? "rotate-180" : ""}><ChevronIcon /></span>
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section className="border-b border-[#391B68]/10 pb-4 md:border-b-0 md:pb-0" aria-labelledby={`footer-contact-${locale}`}>
            <h2 id={`footer-contact-${locale}`} className="mb-2.5 text-[15px] font-black text-[#391B68] lg:mb-3.5">{footer.contactTitle}</h2>
            <div className="grid gap-2">
              <CtaLink
                href={whatsappHref}
                locale={locale}
                source="footer_whatsapp"
                event="whatsapp"
                variant="ghost"
                className="!flex !h-12 !min-h-0 !w-full !items-center !justify-center !rounded-[14px] !border-[#EC911F] !bg-[#EC911F] !px-4 !py-0 !text-[15px] !text-white !shadow-[0_8px_18px_rgba(236,145,31,0.18)] hover:!bg-[#D98113]"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <ContactIcon type="whatsapp" />
                  {footer.whatsapp}
                </span>
              </CtaLink>
              <CtaLink
                href={callHref}
                locale={locale}
                source="footer_request_call"
                event="request_call"
                variant="ghost"
                className="!flex !h-12 !min-h-0 !w-full !items-center !justify-center !rounded-[14px] !border-[#391B68]/35 !bg-white !px-4 !py-0 !text-[15px] !text-[#391B68] !shadow-none hover:!border-[#391B68] hover:!bg-[#EEE9F4]"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <ContactIcon type="phone" />
                  {footer.call}
                </span>
              </CtaLink>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#EEE9F4] px-2 text-[13px] font-black text-[#391B68]">
                <ContactIcon type="globe" />
                <span>{footer.online}</span>
              </div>
              <div className="flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#EEE9F4] px-2 text-[13px] font-black text-[#391B68]">
                <ContactIcon type="location" />
                <span>{footer.branch}</span>
              </div>
            </div>
          </section>

          <section aria-labelledby={`footer-social-${locale}`}>
            <h2 id={`footer-social-${locale}`} className="mb-2.5 text-[15px] font-black text-[#391B68] lg:mb-3.5">{footer.socialTitle}</h2>
            <div className="flex flex-nowrap items-center gap-1.5" dir="ltr">
              {socialLinks.map((social) => (
                <SocialItem key={social.label} social={social} />
              ))}
            </div>

            <h2 className="mb-2 mt-4 text-[15px] font-black text-[#391B68] lg:mb-2.5 lg:mt-5">{footer.languageTitle}</h2>
            <div className="inline-grid h-11 w-[200px] grid-cols-2 rounded-[13px] border border-[#391B68]/15 bg-white p-1 shadow-[0_6px_16px_rgba(57,27,104,0.05)]" dir="ltr">
              <LanguageOption option="ar" locale={locale} label={footer.languages.ar} />
              <LanguageOption option="en" locale={locale} label={footer.languages.en} />
            </div>
          </section>
        </div>

        <div className="mt-5 border-t border-[#391B68]/12 pt-4 text-center text-[13px] font-semibold leading-[1.55] text-[#776B80] lg:mt-7 lg:pt-5 lg:text-start">
          <p>{footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}

