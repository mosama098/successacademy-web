export type BlogContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishDate: string;
  readingTime: string;
  category: string;
  image: string;
  content: BlogContentBlock[];
  seoTitle: string;
  seoDescription: string;
};
