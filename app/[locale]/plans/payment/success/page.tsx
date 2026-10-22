import { notFound } from "next/navigation";
import { SitePageShell } from "@/components/site-page-shell";
import { PaymentSuccess } from "@/features/payments/components/payment-success";
import { bookingDisplayReference, successPageCopy } from "@/features/payments/success-presentation";
import { locales, type Locale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  return { title: successPageCopy[locale as Locale].received, robots: { index: false, follow: false } };
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { order } = await searchParams;
  if (!locales.includes(locale as Locale) || !order
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(order)) notFound();
  const currentLocale = locale as Locale;
  return <SitePageShell locale={currentLocale} page="plans_payment" pagePath={`plans/payment/success?order=${encodeURIComponent(order)}`}
    whatsappContext="payment_status" whatsappDetails={{ bookingReference: bookingDisplayReference(order) }} whatsappSource="plans_payment_success_help">
    <PaymentSuccess locale={currentLocale} orderId={order} />
  </SitePageShell>;
}
