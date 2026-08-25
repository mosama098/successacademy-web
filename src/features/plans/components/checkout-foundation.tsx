import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { plannedPaymentMethods, type PlanRecommendation, type PaymentMethodId } from "../config";
import { plansCopy } from "../copy";

type CheckoutFoundationProps = {
  locale: Locale;
  recommendation: PlanRecommendation | null;
  hasExistingLead: boolean;
};

export function CheckoutFoundation({ locale, recommendation, hasExistingLead }: CheckoutFoundationProps) {
  const copy = plansCopy[locale];
  const isArabic = locale === "ar";
  const priceFormatter = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG");

  if (!recommendation) {
    return (
      <section className="bg-[#f8f6f4] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-[26px] border border-[#391b68]/10 bg-white p-7 text-center shadow-[0_22px_55px_rgba(52,35,63,0.09)] sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#f1ebf3] text-[#5d406d]"><PlanIcon id="card" /></span>
          <h1 className="mt-5 text-2xl font-black text-[#382746]">{copy.invalidPlanTitle}</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#756a78]">{copy.invalidPlanBody}</p>
          <Link href={`/${locale}/plans`} className="mt-6 inline-flex min-h-13 items-center justify-center rounded-[16px] bg-[#391b68] px-6 font-black !text-white transition hover:bg-[#4a277f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25">
            {copy.backToPlans}
          </Link>
        </div>
      </section>
    );
  }

  const backHref = `/${locale}/plans?level=${recommendation.currentLevel}`;

  return (
    <div className="relative overflow-hidden bg-[#f8f6f4] px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_20%_0%,rgba(236,145,31,0.12),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(57,27,104,0.14),transparent_34%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-[#391b68]/12 bg-white/75 px-3 py-1.5 text-xs font-black text-[#604778] shadow-sm">{copy.checkoutBadge}</span>
          <h1 className="mt-5 text-balance text-3xl font-black leading-tight text-[#30203d] sm:text-5xl">{copy.checkoutTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#716675] sm:text-base">{copy.checkoutDescription}</p>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <aside className="rounded-[26px] bg-[#30213a] p-6 text-white shadow-[0_26px_65px_rgba(48,33,58,0.22)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#f0a64a]">{copy.checkoutSummary}</p>
            <p className="mt-4 text-2xl font-black" dir="ltr">{recommendation.currentLevel} → {recommendation.targetLevel}</p>
            <dl className="mt-6 space-y-3">
              <SummaryRow label={copy.requiredHours} value={`${recommendation.package.hours} ${copy.hoursSuffix}`} />
              <SummaryRow label={copy.sessions} value={`${recommendation.package.sessions} ${copy.sessionsSuffix}`} />
              <SummaryRow label={copy.packageName} value={`${recommendation.package.hours} ${copy.packageSuffix}`} />
              <SummaryRow label={copy.price} value={`${priceFormatter.format(recommendation.package.priceEgp)} ${copy.currency}`} emphasis />
            </dl>
            <p className="mt-5 border-t border-white/12 pt-4 text-xs font-semibold leading-6 text-white/55">{hasExistingLead ? copy.existingLeadNote : copy.privacyNote}</p>
          </aside>

          <section className="rounded-[26px] border border-[#391b68]/10 bg-white p-5 shadow-[0_20px_55px_rgba(52,35,63,0.08)] sm:p-7" aria-labelledby="payment-methods-heading">
            <h2 id="payment-methods-heading" className="text-2xl font-black text-[#382746]">{copy.checkoutMethodsTitle}</h2>
            <p className="mt-2 text-sm font-semibold leading-7 text-[#756979]">{copy.checkoutMethodsBody}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {plannedPaymentMethods.map((method) => {
                const methodCopy = copy.paymentMethods[method.id];
                return (
                  <article key={method.id} className="flex min-h-[92px] items-center gap-3 rounded-[18px] border border-[#391b68]/10 bg-[#faf8fb] p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#eee7f1] text-[#5d406d]"><PlanIcon id={method.id} /></span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#402d4c]">{methodCopy.title}</h3>
                      <p className="mt-1 text-xs font-semibold text-[#7b6f7e]">{methodCopy.description}</p>
                    </div>
                    <span className="ms-auto shrink-0 rounded-full bg-[#fff0dc] px-2 py-1 text-[10px] font-black text-[#a35e0b]">{copy.plannedLabel}</span>
                  </article>
                );
              })}
            </div>
            <Link href={backHref} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] border border-[#391b68]/18 bg-white px-5 text-sm font-black text-[#391b68] transition hover:border-[#391b68]/35 hover:bg-[#f3eef5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20">
              <svg className={`h-4 w-4 ${isArabic ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {copy.backToPlans}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] bg-white/8 px-4 py-3">
      <dt className="text-xs font-bold text-white/60">{label}</dt>
      <dd className={emphasis ? "text-lg font-black text-[#f2aa4c]" : "text-sm font-black text-white"}>{value}</dd>
    </div>
  );
}

function PlanIcon({ id }: { id: PaymentMethodId }) {
  if (id === "installments") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 6h14v12H5z" /><path d="M8 10h8M8 14h4" strokeLinecap="round" /></svg>;
  }
  if (id === "instapay") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 7h4M5 17h4" strokeLinecap="round" /></svg>;
  }
  if (id === "wallet") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9H5.5A1.5 1.5 0 0 1 4 16.5v-9Z" /><path d="M4.5 7.5 16 4v3.5M15 12h5v3h-5a1.5 1.5 0 0 1 0-3Z" /></svg>;
  }
  if (id === "branch") {
    return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 9 8-5 8 5M5 20h14M7 9v8M12 9v8M17 9v8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10h17M7 14h3" strokeLinecap="round" /></svg>;
}
