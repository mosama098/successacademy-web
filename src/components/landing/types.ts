import type { LandingContent } from "@/content";
import type { Locale } from "@/lib/i18n";

export type LandingSectionProps = {
  locale: Locale;
  copy: LandingContent;
};

export type LocalizedSectionProps = Pick<LandingSectionProps, "locale">;

export const bookingHref = "#lead-form";

