import type { LandingContent } from "@/content";
import type { Locale } from "@/lib/i18n";

export type LandingSectionProps = {
  locale: Locale;
  copy: LandingContent;
};

export const bookingHref = "#lead-form";
