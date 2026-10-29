import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/page-metadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/ar/plans/checkout", "/en/plans/checkout", "/ar/plans/payment", "/en/plans/payment", "/ar/placement-test/assessment", "/en/placement-test/assessment", "/ar/thank-you", "/en/thank-you"] }],
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl } : {}),
  };
}
