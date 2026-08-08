import "server-only";

import type { Locale } from "@/lib/i18n";
import type {
  BlogArticle,
  StoryblokRichTextDocument,
  StoryblokRichTextNode,
} from "@/content/blog/types";

const STORYBLOK_REVALIDATE_SECONDS = 60;
const STORYBLOK_PAGE_SIZE = 100;

const storyblokRegions = {
  eu: {
    apiBaseUrl: "https://api.storyblok.com/v2/cdn",
    assetHostname: "a.storyblok.com",
  },
  us: {
    apiBaseUrl: "https://api-us.storyblok.com/v2/cdn",
    assetHostname: "a-us.storyblok.com",
  },
  ca: {
    apiBaseUrl: "https://api-ca.storyblok.com/v2/cdn",
    assetHostname: "a-ca.storyblok.com",
  },
  ap: {
    apiBaseUrl: "https://api-ap.storyblok.com/v2/cdn",
    assetHostname: "a-ap.storyblok.com",
  },
  cn: {
    apiBaseUrl: "https://app.storyblokchina.cn/v2/cdn",
    assetHostname: "a.storyblokchina.cn",
  },
} as const;

type StoryblokRegion = keyof typeof storyblokRegions;

type StoryblokStory = {
  slug?: unknown;
  content?: unknown;
};

type StoryblokResponse = {
  stories?: unknown;
};

let warnedAboutMissingToken = false;
let warnedAboutInvalidRegion = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function warnInDevelopment(message: string) {
  if (process.env.NODE_ENV === "development") console.warn(`[Storyblok] ${message}`);
}

function getStoryblokRegion(): StoryblokRegion {
  const configuredRegion = process.env.STORYBLOK_REGION?.trim().toLowerCase() || "eu";

  if (configuredRegion in storyblokRegions) return configuredRegion as StoryblokRegion;

  if (!warnedAboutInvalidRegion) {
    warnedAboutInvalidRegion = true;
    warnInDevelopment(`Unsupported STORYBLOK_REGION "${configuredRegion}"; using the documented EU endpoint.`);
  }

  return "eu";
}

function normalizeAssetUrl(value: unknown, region: StoryblokRegion) {
  const filename = isRecord(value) ? readText(value.filename) : "";
  if (!filename) return "";

  const normalizedFilename = filename.startsWith("//") ? `https:${filename}` : filename;

  try {
    const url = new URL(normalizedFilename);
    const expectedHostname = storyblokRegions[region].assetHostname;

    if (url.protocol !== "https:" || url.hostname !== expectedHostname || !url.pathname.startsWith("/f/")) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function getAssetAlt(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback;
  return readText(value.alt) || readText(value.title) || fallback;
}

function normalizePublishDate(value: unknown) {
  const text = readText(value);
  if (!text) return "";

  const datePart = text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return "";

  const timestamp = Date.parse(`${datePart}T00:00:00Z`);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== datePart) return "";

  return datePart;
}

function isRichTextNode(value: unknown): value is StoryblokRichTextNode {
  return isRecord(value) && typeof value.type === "string";
}

function normalizeRichText(value: unknown): StoryblokRichTextDocument | undefined {
  if (!isRichTextNode(value) || value.type !== "doc") return undefined;

  return value as StoryblokRichTextDocument;
}

function collectText(node: StoryblokRichTextNode): string {
  const ownText = typeof node.text === "string" ? node.text : "";
  const childText = Array.isArray(node.content) ? node.content.map(collectText).join(" ") : "";
  return `${ownText} ${childText}`.trim();
}

function getReadingTime(value: unknown, body: StoryblokRichTextDocument, locale: Locale) {
  const configuredMinutes = typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.max(1, Math.round(value))
    : null;
  const estimatedMinutes = Math.max(1, Math.ceil(collectText(body).split(/\s+/).filter(Boolean).length / 200));
  const minutes = configuredMinutes ?? estimatedMinutes;

  return locale === "ar" ? `${minutes} دقائق قراءة` : `${minutes} min read`;
}

function normalizeStory(story: StoryblokStory, locale: Locale, region: StoryblokRegion): BlogArticle | null {
  if (!isRecord(story.content) || story.content.component !== "article") return null;

  const slug = readText(story.slug);
  const title = readText(story.content.title);
  const excerpt = readText(story.content.excerpt);
  const category = readText(story.content.category);
  const publishDate = normalizePublishDate(story.content.published_at);
  const storyblokBody = normalizeRichText(story.content.body);

  if (!slug || !title || !excerpt || !category || !publishDate || !storyblokBody) return null;

  const image = normalizeAssetUrl(story.content.cover_image, region) || "/images/blog/course-cover.svg";

  return {
    locale,
    slug,
    title,
    excerpt,
    publishDate,
    readingTime: getReadingTime(story.content.reading_time, storyblokBody, locale),
    category,
    image,
    imageAlt: getAssetAlt(story.content.cover_image, title),
    featured: story.content.featured === true,
    published: true,
    content: [],
    storyblokBody,
    seoTitle: readText(story.content.seo_title) || title,
    seoDescription: readText(story.content.seo_description) || excerpt,
  };
}

async function requestStoryblokPage(
  token: string,
  locale: Locale,
  region: StoryblokRegion,
  page: number,
) {
  const url = new URL(`${storyblokRegions[region].apiBaseUrl}/stories`);
  url.searchParams.set("token", token);
  url.searchParams.set("version", "published");
  url.searchParams.set("filter_query[component][in]", "article");
  url.searchParams.set("per_page", String(STORYBLOK_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  if (locale === "ar") url.searchParams.set("language", "ar");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: {
      revalidate: STORYBLOK_REVALIDATE_SECONDS,
      tags: ["storyblok-articles", `storyblok-articles-${locale}`],
    },
  });

  if (!response.ok) throw new Error(`Storyblok returned HTTP ${response.status}`);

  const data: unknown = await response.json();
  if (!isRecord(data)) throw new Error("Storyblok returned an invalid response");

  const stories = (data as StoryblokResponse).stories;
  if (!Array.isArray(stories)) throw new Error("Storyblok response did not include stories");

  return stories.filter(isRecord) as StoryblokStory[];
}

export async function getStoryblokBlogArticles(locale: Locale) {
  const token = process.env.STORYBLOK_ACCESS_TOKEN?.trim();

  if (!token) {
    if (!warnedAboutMissingToken) {
      warnedAboutMissingToken = true;
      warnInDevelopment("STORYBLOK_ACCESS_TOKEN is not configured; using local blog content only.");
    }

    return [];
  }

  const region = getStoryblokRegion();

  try {
    const stories: StoryblokStory[] = [];

    for (let page = 1; page <= 20; page += 1) {
      const pageStories = await requestStoryblokPage(token, locale, region, page);
      stories.push(...pageStories);
      if (pageStories.length < STORYBLOK_PAGE_SIZE) break;
    }

    return stories
      .map((story) => normalizeStory(story, locale, region))
      .filter((article): article is BlogArticle => article !== null);
  } catch {
    warnInDevelopment("The Content Delivery API request failed; using local blog content only.");
    return [];
  }
}
