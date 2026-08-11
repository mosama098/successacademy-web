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

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
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
