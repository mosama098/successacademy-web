import { arContent } from "@/content/ar";
import { enContent } from "@/content/en";
import type { ContentMap, LandingContent } from "@/content/types";

export type { LandingContent };

export const content: ContentMap = {
  ar: arContent,
  en: enContent,
};
