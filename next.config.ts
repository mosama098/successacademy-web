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

const nextConfig: NextConfig = {
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
