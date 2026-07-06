"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";
import { trackPageView } from "@/lib/tracking";

export function PageTracker({ locale, page }: { locale: Locale; page: string }) {
  useEffect(() => {
    trackPageView({ locale, page });
  }, [locale, page]);

  return null;
}
