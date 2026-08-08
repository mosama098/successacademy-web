import type { Locale } from "@/lib/i18n";

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
  storyblokBody: StoryblokRichTextDocument;
  seoTitle: string;
  seoDescription: string;
};
