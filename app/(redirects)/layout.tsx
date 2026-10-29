import { TrackingScripts } from "@/components/tracking-scripts";
import "../globals.css";

export default function RedirectLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body>
        {children}
        <TrackingScripts />
      </body>
    </html>
  );
}
