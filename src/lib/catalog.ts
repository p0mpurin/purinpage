import { categoryLinks } from "./links";

/** Everything a page needs to list a category, without its links. */
export type CategorySummary = {
  slug: string;
  title: string;
  kanji: string;
  romaji: string;
  tagline: string;
  icon: string;
  count: number;
};

export const categorySummaries: CategorySummary[] = Object.entries(categoryLinks).map(([slug, c]) => ({
  slug,
  title: c.title,
  kanji: c.kanji,
  romaji: c.romaji,
  tagline: c.tagline,
  icon: c.icon,
  count: c.links.length,
}));

const sections = categorySummaries.filter((c) => c.slug !== "favorites");

export const SECTION_COUNT = sections.length;
export const TOTAL_LINKS = sections.reduce((sum, c) => sum + c.count, 0);
