"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import {
  attendanceModes,
  plannedPaymentMethods,
  type AttendanceMode,
  type PaymentMethodId,
  type PlanRecommendation,
} from "../config";
import { plansCopy } from "../copy";

type CheckoutFoundationProps = {
  locale: Locale;
  recommendation: PlanRecommendation | null;
  hasExistingLead: boolean;
  initialAttendanceMode: AttendanceMode | null;
};

export function CheckoutFoundation({
  locale,
  recommendation,
  initialAttendanceMode,
}: CheckoutFoundationProps) {
  const copy = plansCopy[locale];
  const router = useRouter();
  const isArabic = locale === "ar";
  const priceFormatter = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG");
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode | null>(initialAttendanceMode);
  const [editingAttendance, setEditingAttendance] = useState(!initialAttendanceMode);

  if (!recommendation) {
    return (
      <section className="min-h-[62vh] bg-[#f7f3ed] px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-xl rounded-[24px] border border-[#321d43]/10 bg-white px-6 py-9 text-center shadow-[0_18px_46px_rgba(50,29,67,0.08)] sm:p-10">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#ece5ee] text-[#563a64]">
            <PathIcon />
          </span>
          <h1 className="mt-4 text-2xl font-black text-[#34253e]">{copy.checkout.invalidTitle}</h1>
          <p className="mt-2 text-base font-semibold leading-7 text-[#716675]">{copy.checkout.invalidBody}</p>
          <Link href={`/${locale}/plans`} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#321d43] px-6 font-black !text-white transition hover:bg-[#563a64] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25">
            {copy.checkout.backToPlans}
          </Link>
        </div>
      </section>
    );
  }

  const backQuery = new URLSearchParams({ program: recommendation.programType, level: recommendation.startLevel, target: recommendation.targetLevel });
  const backHref = `/${locale}/plans?${backQuery.toString()}`;
  const estimatedDuration = copy.plan.estimatedDuration(recommendation.package.estimatedWeeks);
  const [durationPrimary, durationEquivalent] = estimatedDuration.split(" / ");

  function chooseAttendance(mode: AttendanceMode) {
    setAttendanceMode(mode);
    setEditingAttendance(false);
    const url = new URL(window.location.href);
    url.searchParams.set("attendance", mode);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className="bg-[#f7f3ed] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-[1080px]">
        <header className="max-w-2xl">
          <h1 className="text-balance text-[32px] font-black leading-[1.18] text-[#34253e] sm:text-[38px]">
            {copy.checkout.title}
          </h1>
          <p className="mt-2 text-[15px] font-semibold leading-7 text-[#716675] sm:text-base">
            {copy.checkout.description}
          </p>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-start" dir="ltr">
          <section className="flex min-h-[310px] flex-col overflow-hidden rounded-[24px] border border-[#321d43]/16 bg-[#f7f3ed] shadow-[0_20px_52px_rgba(50,29,67,0.14)] lg:col-start-2 lg:row-start-1" dir={isArabic ? "rtl" : "ltr"} aria-labelledby="plan-summary-heading">
            <div className="border-b border-[#ece5ee]/20 bg-gradient-to-bl from-[#321d43] to-[#563a64] px-5 py-4 sm:px-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#ece5ee]">{copy.checkout.summaryTitle}</p>
                  <h2 id="plan-summary-heading" className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">
                    {recommendation.package.name[locale]}
                  </h2>
                  <p className="mt-1 text-xs font-black text-[#f5c17d]">{copy.program.options[recommendation.programType]}</p>
                </div>
                <span className="rounded-full border border-[#ece5ee]/35 bg-[#ece5ee] px-4 py-2 text-base font-black text-[#321d43] shadow-sm" dir="ltr">
                  {recommendation.startLevel} → {recommendation.targetLevel}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between bg-gradient-to-br from-[#f7f3ed] to-[#ece5ee] px-5 py-5 sm:px-6">
              <dl className="grid grid-cols-2 gap-y-3 divide-x divide-[#321d43]/10 rounded-[18px] border border-[#321d43]/8 bg-white/80 px-2 py-3.5 shadow-[0_8px_22px_rgba(50,29,67,0.055)] rtl:divide-x-reverse sm:grid-cols-4">
                <SummaryMetric label={copy.plan.hoursLabel} value={`${recommendation.requiredHours} ${copy.common.hours}`} />
                <SummaryMetric label={copy.plan.sessionsLabel} value={`${recommendation.package.sessions} ${copy.common.sessions}`} />
                <SummaryMetric label={copy.program.sessionDurationLabel} value={copy.program.sessionDuration(recommendation.package.sessionDurationHours)} />
                <SummaryMetric
                  label={copy.plan.durationLabel}
                  value={durationEquivalent ? (
                    <span className="block">
                      <span className="block whitespace-nowrap">{durationPrimary}</span>
                      <span className="mt-0.5 block whitespace-nowrap text-[#563a64]">≈ {durationEquivalent}</span>
                    </span>
                  ) : estimatedDuration}
                />
              </dl>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <div>
                  <p className="text-xs font-bold text-[#7b6a7f]">{copy.plan.priceLabel}</p>
                  <p className="mt-1 text-[34px] font-black leading-none text-[#321d43]">
                    {priceFormatter.format(recommendation.package.priceEgp)} <span className="text-sm text-[#765f7d]">{copy.common.currency}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-4 lg:col-start-1 lg:row-start-1" dir={isArabic ? "rtl" : "ltr"}>
            <section className="rounded-[22px] border border-[#321d43]/10 bg-white p-4 shadow-[0_14px_38px_rgba(50,29,67,0.065)] sm:p-5" aria-labelledby="attendance-heading">
              <div>
                <h2 id="attendance-heading" className="text-[22px] font-black leading-tight text-[#34253e]">{copy.checkout.attendanceTitle}</h2>
                {(!attendanceMode || editingAttendance) ? <p className="mt-1 text-sm font-semibold leading-6 text-[#756979]">{copy.checkout.attendanceBody}</p> : null}
              </div>

              {attendanceMode && !editingAttendance ? (
                <div className="mt-3 flex min-h-16 items-center justify-between gap-3 rounded-[17px] border border-[#321d43]/10 bg-[#f3eef4] px-4 py-3" aria-live="polite">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#563a64] shadow-sm">
                      <AttendanceIcon mode={attendanceMode} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#796a7d]">{copy.checkout.attendanceSelected}</p>
                      <p className="text-base font-black text-[#321d43]">{copy.checkout.attendanceOptions[attendanceMode].title}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditingAttendance(true)} className="min-h-10 shrink-0 rounded-full border border-[#321d43]/14 bg-white px-4 text-sm font-black text-[#321d43] transition hover:bg-[#ece5ee] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20">
                    {copy.checkout.attendanceChange}
                  </button>
                </div>
              ) : (
                <fieldset className="mt-3">
                  <legend className="sr-only">{copy.checkout.attendanceTitle}</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {attendanceModes.map((mode) => {
                      const selected = attendanceMode === mode;
                      const option = copy.checkout.attendanceOptions[mode];
                      return (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => chooseAttendance(mode)}
                          className={`flex min-h-13 items-center justify-center gap-2.5 rounded-[16px] border px-3 py-2 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/22 ${selected ? "border-[#321d43] bg-[#321d43] text-white" : "border-[#321d43]/10 bg-[#f7f3ed] text-[#34253e] hover:border-[#321d43]/28 hover:bg-[#fdfbf8]"}`}
                        >
                          <span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${selected ? "bg-white/10 text-[#f5b35d]" : "bg-[#ece5ee] text-[#563a64]"}`}>
                            <AttendanceIcon mode={mode} />
                          </span>
                          <span className="text-sm font-black sm:text-base">{option.title}</span>
                        </button>
                      );
                    })}
                  </div>
                  {!attendanceMode ? <p className="mt-2 text-sm font-bold text-[#9b5d19]" role="status">{copy.checkout.attendanceRequired}</p> : null}
                </fieldset>
              )}
            </section>

            <section className="rounded-[22px] border border-[#321d43]/10 bg-white p-4 shadow-[0_14px_38px_rgba(50,29,67,0.065)] sm:p-5" aria-labelledby="payment-methods-heading">
              <h2 id="payment-methods-heading" className="text-[22px] font-black leading-tight text-[#34253e]">{copy.checkout.methodsTitle}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#756979]">{copy.checkout.methodsBody}</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-[repeat(5,minmax(min-content,1fr))]">
                {plannedPaymentMethods.map((method) => (
                  <div key={method.id} className={`flex min-h-14 min-w-0 items-center gap-1.5 rounded-[15px] border border-[#321d43]/9 bg-[#f7f3ed] px-2 py-2 ${method.id === "branch" ? "col-span-2 lg:col-span-1" : ""}`}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[#ece5ee] text-[#563a64]">
                      <PaymentIcon id={method.id} />
                    </span>
                    <span className={`min-w-0 text-[11px] font-black leading-4 text-[#402d4c] ${method.id === "instapay" ? "whitespace-nowrap" : "break-words"}`}>{copy.paymentMethods[method.id].title}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-[22px] border border-[#321d43]/10 bg-white p-4 shadow-[0_14px_38px_rgba(50,29,67,0.065)] sm:p-5">
              <button
                type="button"
                disabled={!attendanceMode}
                onClick={() => {
                  if (!attendanceMode) return;
                  const query = new URLSearchParams({ program: recommendation.programType, start: recommendation.startLevel, target: recommendation.targetLevel, package: recommendation.package.id, attendance: attendanceMode });
                  router.push(`/${locale}/plans/payment?${query.toString()}`);
                }}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25 ${attendanceMode ? "bg-[#ec911f] text-white shadow-[0_10px_24px_rgba(236,145,31,0.22)] hover:bg-[#d97f13] active:scale-[0.99]" : "cursor-not-allowed bg-[#ded8df] text-[#766d78]"}`}
              >
                {attendanceMode ? copy.checkout.continueToPayment : copy.checkout.attendanceRequired}
                <ArrowIcon reverse={!isArabic} />
              </button>
              <Link href={backHref} className="mx-auto mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-black text-[#563a64] underline decoration-[#563a64]/25 underline-offset-4 transition hover:text-[#321d43] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20">
                <ArrowIcon reverse={isArabic} />
                {copy.checkout.backToPlans}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 px-2 text-center sm:px-3">
      <dt className="text-[10px] font-bold leading-4 text-[#7b6a7f] sm:text-xs">{label}</dt>
      <dd className="mt-1 text-[11px] font-black leading-4 text-[#321d43] sm:text-sm sm:leading-5">{value}</dd>
    </div>
  );
}

function ArrowIcon({ reverse }: { reverse: boolean }) {
  return <svg className={`size-4 ${reverse ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PathIcon() {
  return <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18h2.8a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3h.2" strokeLinecap="round" /></svg>;
}

function AttendanceIcon({ mode }: { mode: AttendanceMode | null }) {
  if (mode === "branch") return <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 9 8-5 8 5M5 20h14M7 9v8M12 9v8M17 9v8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="5" width="17" height="13" rx="2" /><path d="M8 21h8M12 18v3M9.5 10.5l5 2-5 2v-4Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PaymentIcon({ id }: { id: PaymentMethodId }) {
  if (id === "installments") return <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 6h14v12H5z" /><path d="M8 10h8M8 14h4" strokeLinecap="round" /></svg>;
  if (id === "instapay") return <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 7h4M5 17h4" strokeLinecap="round" /></svg>;
  if (id === "wallet") return <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9H5.5A1.5 1.5 0 0 1 4 16.5v-9Z" /><path d="M4.5 7.5 16 4v3.5M15 12h5v3h-5a1.5 1.5 0 0 1 0-3Z" /></svg>;
  if (id === "branch") return <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 9 8-5 8 5M5 20h14M7 9v8M12 9v8M17 9v8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10h17M7 14h3" strokeLinecap="round" /></svg>;
}
