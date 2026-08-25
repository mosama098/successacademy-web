export type LeadMetadata = {
  locale: string;
  pagePath: string;
  referrer: string;
  userAgent: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
  ttclid: string;
};

const trackedParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

export const SUCCESS_ACADEMY_WHATSAPP_NUMBER = "201204110111";
export const PLACEMENT_TEST_WHATSAPP_NUMBER = "201204006361";

export function getLeadMetadata(locale: string): LeadMetadata {
  if (typeof window === "undefined") {
    return {
      locale,
      pagePath: "",
      referrer: "",
      userAgent: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
      gclid: "",
      fbclid: "",
      ttclid: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const metadata = Object.fromEntries(
    trackedParams.map((param) => [param, params.get(param) ?? ""]),
  ) as Omit<LeadMetadata, "locale" | "pagePath" | "referrer" | "userAgent">;

  return {
    locale,
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    ...metadata,
  };
}

export function getWhatsAppHref(locale: string, customMessage?: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
    || SUCCESS_ACADEMY_WHATSAPP_NUMBER;
  const message = customMessage ?? (locale === "ar"
    ? "مرحبًا، أنا سجلت للتقييم المجاني في Success Academy وعايز أعرف الخطوة الجاية."
    : "Hi, I registered for the free level check at Success Academy and I would like to know the next step.");

  return buildWhatsAppHref(number, message);
}

export function getPlacementWhatsAppHref(locale: string, customMessage?: string) {
  const message = customMessage ?? (locale === "ar"
    ? "مرحبًا، أنا خلصت اختبار تحديد المستوى وعايز أعرف تفاصيل المستوى المناسب والحجز."
    : "Hi, I completed the placement test and would like to know more about my recommended level and booking.");

  return buildWhatsAppHref(PLACEMENT_TEST_WHATSAPP_NUMBER, message);
}

export function getCallHref() {
  const number = process.env.NEXT_PUBLIC_CALL_NUMBER;
  return number ? `tel:${number}` : "#lead-form";
}

function buildWhatsAppHref(number: string, message: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
}
