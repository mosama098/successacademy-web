"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { trackCTAClick, trackLanguageSwitch, trackRequestCallClick, trackWhatsAppClick } from "@/lib/tracking";

type CtaLinkProps = {
  href: string;
  children: React.ReactNode;
  locale: Locale;
  variant?: "primary" | "secondary" | "ghost";
  source: string;
  event?: "cta" | "whatsapp" | "language" | "request_call";
  className?: string;
};

export function CtaLink({
  href,
  children,
  locale,
  source,
  event = "cta",
  variant = "primary",
  className = "",
}: CtaLinkProps) {
  const classes =
    variant === "primary"
      ? "premium-button premium-button-primary"
      : variant === "secondary"
        ? "premium-button premium-button-secondary"
        : "rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-[#391B68] hover:text-[#391B68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC911F]";

  function handleClick() {
    const payload = { locale, source };
    if (event === "whatsapp") trackWhatsAppClick(payload);
    else if (event === "language") trackLanguageSwitch(payload);
    else if (event === "request_call") trackRequestCallClick(payload);
    else trackCTAClick(payload);
  }

  const content = (
    <>
      <span>{children}</span>
      {variant !== "ghost" ? <span className="button-arrow">→</span> : null}
    </>
  );

  if (href.startsWith("/")) {
    return (
      <Link href={href} onClick={handleClick} className={`${classes} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} onClick={handleClick} className={`${classes} ${className}`}>
      {content}
    </a>
  );
}
