"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { paymentCopy } from "../copy";
import { bookingDisplayReference, bookingPresentation, successPageCopy } from "../success-presentation";
import type { PublicOrder } from "../types";

export function PaymentSuccess({ locale, orderId }: { locale: Locale; orderId: string }) {
  const copy = successPageCopy[locale];
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    setOrder(null);
    setUnavailable(false);
    setCopyMessage("");
    const controller = new AbortController();
    const storageKey = `payment-success:${orderId}`;
    let token: string | null = null;
    try { token = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null")?.accessToken ?? null; } catch { /* Storage is optional. */ }
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    token ||= fragment.get("access");
    if (fragment.has("access")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    // A cached creation snapshot must never prove a current payment state.
    if (token) try { window.sessionStorage.setItem(storageKey, JSON.stringify({ accessToken: token })); } catch { /* Storage is optional. */ }
    let inFlight = false;
    const load = async () => {
      if (inFlight || controller.signal.aborted) return;
      if (!token) { setUnavailable(true); setRefreshing(false); return; }
      inFlight = true;
      setRefreshing(true);
      try {
        const response = await fetch(`/api/payments/orders/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || data.ok !== true || data.order?.id !== orderId) throw new Error("order_unavailable");
        if (!controller.signal.aborted) { setOrder(data.order as PublicOrder); setUnavailable(false); }
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setRefreshing(false);
      }
    };
    refresh.current = () => { void load(); };
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30_000);
    return () => { controller.abort(); window.clearInterval(timer); refresh.current = () => {}; };
  }, [orderId]);

  const presentation = order ? bookingPresentation(order, locale, !unavailable) : null;
  const reference = bookingDisplayReference(orderId);
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG");
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC911F] focus-visible:ring-offset-2";

  async function copyReference() {
    try { await navigator.clipboard.writeText(reference); setCopyMessage(copy.copied); }
    catch { setCopyMessage(copy.copyFailed); }
  }

  return <section dir={locale === "ar" ? "rtl" : "ltr"} data-payment-success className="bg-[#F7F3ED] px-4 py-7 text-[#34253E] sm:px-6 sm:py-10">
    <div className="mx-auto max-w-[600px]">
      <header className="text-center">
        <Image src="/logo.png" alt="Success Academy" width={128} height={64} className="mx-auto h-14 w-28 object-contain" loading="eager" />
        {presentation ? <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[#563A64]/15 bg-[#ECE5EE] px-3 py-1.5 text-sm font-bold text-[#321D43]" role="status">
          <span className={`size-2 shrink-0 rounded-full ${presentation.state === "paid" ? "bg-[#321D43]" : "bg-[#EC911F]"}`} aria-hidden="true" />{presentation.badge}
        </div> : null}
        <h1 className="mt-3 text-[26px] font-black leading-snug text-[#321D43] sm:text-[32px]">{presentation?.heading ?? (unavailable ? copy.unavailable : copy.loading)}</h1>
        <p className="mx-auto mt-2 max-w-[520px] text-base leading-7 text-[#563A64]">{presentation?.body ?? (unavailable ? copy.unavailableBody : "")}</p>
      </header>

      {order && presentation ? <article data-payment-section="summary" className="mt-5 overflow-hidden rounded-[22px] border border-[#563A64]/15 bg-white shadow-[0_8px_28px_rgba(50,29,67,0.05)]">
        <div className="flex items-center justify-between gap-3 bg-[#321D43] px-5 py-4 text-white sm:px-6">
          <div className="min-w-0"><p className="text-sm text-[#ECE5EE]">{copy.reference}</p><p className="mt-1 font-mono text-xl font-bold" dir="ltr">{reference}</p></div>
          <button type="button" onClick={() => void copyReference()} title={copy.copy} aria-label={copy.copy} className={`grid size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20 ${focus}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
        {copyMessage ? <p role="status" className="px-5 pt-2 text-sm text-[#563A64]">{copyMessage}</p> : null}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-5 sm:p-6">
          <div className="min-w-0"><dt className="text-sm text-[#563A64]">{copy.package}</dt><dd className="mt-1 break-words text-lg font-bold text-[#321D43]">{order.packageSnapshot.packageName}</dd></div>
          <div className="min-w-0"><dt className="text-sm text-[#563A64]">{copy.amount}</dt><dd className="mt-1 text-2xl font-black text-[#321D43]">{formatter.format(order.pricing?.finalPrice ?? order.packageSnapshot.priceEgp)} <span className="text-sm font-semibold">{copy.currency}</span></dd></div>
          <div className="min-w-0"><dt className="text-sm text-[#563A64]">{copy.method}</dt><dd className="mt-1 font-bold">{order.payment.method ? paymentCopy[locale].methods[order.payment.method].title : copy.pending}</dd></div>
          <div className="min-w-0"><dt className="text-sm text-[#563A64]">{copy.status}</dt><dd className="mt-1 font-bold">{presentation.badge}</dd></div>
        </dl>
        <div className="border-t border-[#ECE5EE] bg-[#ECE5EE]/40 px-5 py-4 sm:px-6"><h2 className="font-bold text-[#321D43]">{copy.next}</h2><p className="mt-1 text-sm leading-6 text-[#563A64]">{presentation.next}</p></div>
      </article> : null}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm font-bold text-[#563A64]">
        <button type="button" disabled={refreshing} onClick={() => refresh.current()} className={`min-h-11 rounded-lg px-1 underline decoration-[#563A64]/30 underline-offset-4 disabled:opacity-60 ${focus}`}>{refreshing ? copy.refreshing : copy.refresh}</button>
        <Link href={`/${locale}`} className={`inline-flex min-h-11 items-center rounded-lg px-1 ${focus}`}>{copy.home}</Link>
        <Link href={`/${locale}/plans`} className={`inline-flex min-h-11 items-center rounded-lg px-1 ${focus}`}>{copy.plans}</Link>
      </div>
    </div>
  </section>;
}
