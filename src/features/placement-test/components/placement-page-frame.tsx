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
      className="min-h-screen overflow-x-hidden bg-[#f2efeb] text-[#30223a]"
    >
      <header className="relative z-50 border-b border-white/70 bg-[#f8f5f1]/88 shadow-[0_8px_30px_rgba(42,29,51,0.045)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${locale}`} className="rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/25" aria-label="Success Academy">
            <Image src="/logo.png" width={170} height={64} alt={copy.logoAlt} className="h-10 w-auto object-contain" priority />
          </Link>
          <Link
            href={otherPath}
            className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-black text-[#3b2946] shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ec911f]/20"
          >
            {locale === "ar" ? "English" : "العربية"}
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}
