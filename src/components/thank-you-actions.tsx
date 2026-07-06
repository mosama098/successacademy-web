"use client";

import type { Locale } from "@/lib/i18n";
import type { LandingContent } from "@/content";
import { getCallHref, getWhatsAppHref } from "@/lib/utm";
import { trackRequestCallClick, trackWhatsAppClick } from "@/lib/tracking";

export function ThankYouActions({ locale, copy }: { locale: Locale; copy: LandingContent["thankYou"] }) {
  const whatsappHref = getWhatsAppHref(locale);
  const callHref = getCallHref();

  return (
    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <a
        href={whatsappHref}
        onClick={() => trackWhatsAppClick({ locale, source: "thank_you" })}
        className="premium-button premium-button-primary"
      >
        <span>{copy.whatsapp}</span>
        <span className="button-arrow">→</span>
      </a>
      <a
        href={callHref}
        onClick={() => trackRequestCallClick({ locale, source: "thank_you", hasNumber: callHref.startsWith("tel:") })}
        className="premium-button premium-button-secondary"
      >
        <span>{copy.requestCall}</span>
        <span className="button-arrow">→</span>
      </a>
    </div>
  );
}
