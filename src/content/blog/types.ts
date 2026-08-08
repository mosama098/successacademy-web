import type { Locale } from "@/lib/i18n";

export type BlogContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type StoryblokRichTextMark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

export type StoryblokRichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: StoryblokRichTextMark[];
  content?: StoryblokRichTextNode[];
};

export type StoryblokRichTextDocument = StoryblokRichTextNode & {
  type: "doc";
};

export type BlogArticle = {
  locale: Locale;
  slug: string;
  title: string;
  excerpt: string;
  publishDate: string;
  readingTime: string;
  category: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  published: boolean;
  content: BlogContentBlock[];
  storyblokBody?: StoryblokRichTextDocument;
  seoTitle: string;
  seoDescription: string;
};
