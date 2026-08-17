import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { placementCopy } from "../copy";
import type { PlacementLocale } from "../types";

type PlacementPageFrameProps = {
  locale: PlacementLocale;
  route: "registration" | "assessment";
  children: ReactNode;
};

export function PlacementPageFrame({ locale, route, children }: PlacementPageFrameProps) {
  const copy = placementCopy[locale];
  const otherLocale = locale === "ar" ? "en" : "ar";
  const otherPath = `/${otherLocale}/placement-test${route === "assessment" ? "/assessment" : ""}`;

  return (
    <main
      dir={copy.direction}
      className="min-h-screen overflow-x-hidden bg-[#fbf9ff] text-[#391b68]"
    >
      <header className="border-b border-[#e8def5] bg-white/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${locale}`} className="rounded-lg focus-visible:outline-none" aria-label="Success Academy">
            <Image src="/logo.png" width={170} height={64} alt={copy.logoAlt} className="h-10 w-auto object-contain" priority />
          </Link>
          <Link
            href={otherPath}
            className="rounded-full border border-[#d8c8eb] bg-white px-4 py-2 text-sm font-bold text-[#391b68] transition hover:border-[#391b68] focus-visible:outline-none"
          >
            {locale === "ar" ? "English" : "العربية"}
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}
