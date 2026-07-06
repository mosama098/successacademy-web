import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Success Academy | English Courses",
  description:
    "A bilingual marketing funnel for Success Academy English courses in Egypt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  );
}
