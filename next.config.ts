import type { NextConfig } from "next";

const storyblokAssetHostnames = {
  eu: "a.storyblok.com",
  us: "a-us.storyblok.com",
  ca: "a-ca.storyblok.com",
  ap: "a-ap.storyblok.com",
  cn: "a.storyblokchina.cn",
} as const;

const configuredRegion = process.env.STORYBLOK_REGION?.trim().toLowerCase();
const storyblokAssetHostname = configuredRegion && configuredRegion in storyblokAssetHostnames
  ? storyblokAssetHostnames[configuredRegion as keyof typeof storyblokAssetHostnames]
  : storyblokAssetHostnames.eu;

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://aanlytics-ipv6.tiktokw.us https://*.wistia.com https://*.wistia.net https://src.litix.io https://*.sentry-cdn.com",
  "style-src 'self' 'unsafe-inline' blob: https://fast.wistia.com",
  `img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://www.facebook.com https://analytics.tiktok.com https://aanlytics-ipv6.tiktokw.us https://${storyblokAssetHostname} https://*.wistia.com https://*.wistia.net`,
  "font-src 'self' data: https://*.wistia.com",
  "connect-src 'self' https://www.googletagmanager.com https://www.google.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net https://analytics.tiktok.com https://aanlytics-ipv6.tiktokw.us https://*.litix.io https://*.wistia.com https://*.wistia.net https://*.algolia.net",
  "frame-src 'self' https://www.googletagmanager.com https://fast.wistia.com https://fast.wistia.net",
  "media-src 'self' data: blob: https://*.wistia.com https://*.wistia.net",
  "worker-src 'self' blob:",
  "child-src blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: storyblokAssetHostname,
        pathname: "/f/**",
      },
    ],
  },
};

export default nextConfig;
