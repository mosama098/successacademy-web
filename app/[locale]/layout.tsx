import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackingScripts } from "@/components/tracking-scripts";
import { locales, localeDirection, type Locale } from "@/lib/i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: "Success Academy | Not Just A Course... A Direction",
  description: "Live Online English programmes, a free Placement Test, and clear follow-up from Success Academy.",
};

export default async function LocaleLayout({ children, params }: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const currentLocale = locale as Locale;

  return (
    <html lang={currentLocale} dir={localeDirection[currentLocale]} data-scroll-behavior="smooth">
      <body>
        {children}
        <TrackingScripts />
      </body>
    </html>
  );
}
