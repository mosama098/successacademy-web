export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const alternateLocale: Record<Locale, Locale> = {
  ar: "en",
  en: "ar",
};
