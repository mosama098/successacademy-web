import type { Metadata } from "next";
import { TrackingScripts } from "@/components/tracking-scripts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Success Academy | Not Just A Course... A Direction",
  description:
    "A bilingual funnel for finding your English level, choosing a clear learning direction, and getting Success Manager follow-up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" data-scroll-behavior="smooth">
      <body>
        {children}
        <TrackingScripts />
      </body>
    </html>
  );
}

