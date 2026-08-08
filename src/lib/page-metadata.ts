import type { Metadata } from "next";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  type = "website",
  image,
}: PageMetadataInput): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const canonical = siteUrl ? `${siteUrl}${path}` : undefined;
  const imageUrl = image?.startsWith("https://") ? image : siteUrl && image ? `${siteUrl}${image}` : undefined;

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title,
      description,
      type,
      ...(canonical ? { url: canonical } : {}),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: title }] } : {}),
    },
  };
}
