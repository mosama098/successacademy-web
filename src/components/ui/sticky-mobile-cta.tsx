"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { LandingContent } from "@/content";
import { trackCTAClick } from "@/lib/tracking";
import { bookingHref } from "@/components/landing/types";

export function StickyMobileCta({ locale, copy }: { locale: Locale; copy: LandingContent["sticky"] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-1 gap-2 rounded-2xl border border-white/40 bg-white/92 p-2 shadow-2xl shadow-[#391B68]/20 backdrop-blur transition md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <a
        href={bookingHref}
        onClick={() => trackCTAClick({ locale, source: "sticky_mobile" })}
        className="rounded-xl bg-[#EC911F] px-3 py-3 text-center text-sm font-black text-white"
      >
        {copy.primary}
      </a>
    </div>
  );
}

