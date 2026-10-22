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

export const SUCCESS_ACADEMY_WHATSAPP_NUMBER = "201204006361";
export const PLACEMENT_TEST_WHATSAPP_NUMBER = SUCCESS_ACADEMY_WHATSAPP_NUMBER;

export type WhatsAppPageContext =
  | "home"
  | "plans"
  | "placement_test"
  | "package_review"
  | "payment"
  | "payment_status"
  | "blog"
  | "blog_article"
  | "business"
  | "legal"
  | "thank_you";

type WhatsAppMessageDetails = {
  packageName?: string | null;
  bookingReference?: string | null;
  articleTitle?: string | null;
};

export function getWhatsAppMessage(locale: string, context: WhatsAppPageContext, details: WhatsAppMessageDetails = {}) {
  const ar = locale === "ar";
  const packageName = safeWhatsAppText(details.packageName);
  const arabicPackageName = packageName ? (/^باقة(?:\s|$)/.test(packageName) ? packageName : `باقة ${packageName}`) : "";
  const articleTitle = safeWhatsAppText(details.articleTitle);
  const bookingReference = /^SA-[A-Z0-9]{8}$/.test(details.bookingReference ?? "") ? details.bookingReference : "";

  switch (context) {
    case "plans": return ar ? "مرحبًا، أحتاج مساعدة في اختيار الباقة المناسبة." : "Hello, I need help choosing the right package.";
    case "placement_test": return ar ? "مرحبًا، أحتاج مساعدة بخصوص اختبار تحديد المستوى." : "Hello, I need help with the placement test.";
    case "package_review": return packageName
      ? (ar ? `مرحبًا، أحتاج مساعدة بخصوص مراجعة ${arabicPackageName} قبل إتمام الحجز.` : `Hello, I need help reviewing the ${packageName} package before booking.`)
      : (ar ? "مرحبًا، أحتاج مساعدة بخصوص مراجعة الباقة قبل إتمام الحجز." : "Hello, I need help reviewing a package before booking.");
    case "payment": return packageName
      ? (ar ? `مرحبًا، أحتاج مساعدة بخصوص إتمام الدفع لـ ${arabicPackageName}.` : `Hello, I need help completing payment for the ${packageName} package.`)
      : (ar ? "مرحبًا، أحتاج مساعدة بخصوص إتمام الدفع." : "Hello, I need help completing payment.");
    case "payment_status": return bookingReference
      ? (ar ? `مرحبًا، أحتاج مساعدة بخصوص حالة طلبي ${bookingReference}.` : `Hello, I need help with the status of my order ${bookingReference}.`)
      : (ar ? "مرحبًا، أحتاج مساعدة بخصوص حالة طلبي." : "Hello, I need help with my order status.");
    case "blog_article": return articleTitle
      ? (ar ? `مرحبًا، لدي استفسار بخصوص مقال: ${articleTitle}.` : `Hello, I have a question about the article: ${articleTitle}.`)
      : (ar ? "مرحبًا، لدي استفسار بخصوص هذا المقال." : "Hello, I have a question about this article.");
    case "blog": return ar ? "مرحبًا، أحتاج مساعدة بخصوص أحد مقالات Success Academy." : "Hello, I need help with a Success Academy article.";
    case "business": return ar ? "مرحبًا، أحتاج مساعدة بخصوص تدريب اللغة الإنجليزية للشركات." : "Hello, I need help with corporate English training.";
    case "legal": return ar ? "مرحبًا، أحتاج مساعدة بخصوص سياسات وشروط Success Academy." : "Hello, I need help with Success Academy's policies and terms.";
    case "thank_you": return ar ? "مرحبًا، أرسلت طلبًا وأحتاج مساعدة في الخطوة التالية." : "Hello, I submitted a request and need help with the next step.";
    case "home":
    default: return ar ? "مرحبًا، أحتاج مساعدة بخصوص برامج Success Academy." : "Hello, I need help with Success Academy programs.";
  }
}

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
  const message = customMessage ?? getWhatsAppMessage(locale, "home");

  return buildWhatsAppHref(number, message);
}

export function getPlacementWhatsAppHref(locale: string, customMessage?: string) {
  const message = customMessage ?? getWhatsAppMessage(locale, "placement_test");

  return buildWhatsAppHref(resolveWhatsAppNumber(), message);
}

export function getCallHref() {
  const number = process.env.NEXT_PUBLIC_CALL_NUMBER;
  return number ? `tel:${number}` : "#lead-form";
}

function buildWhatsAppHref(number: string, message: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
}

function resolveWhatsAppNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || SUCCESS_ACADEMY_WHATSAPP_NUMBER;
}

function safeWhatsAppText(value: string | null | undefined) {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}
