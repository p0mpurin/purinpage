/** For ordering cards: preview first, then online-without-image, unchecked middle, broken last. */
export type LinkSortBucket = "preview" | "live-empty" | "pending" | "down";

export const LINK_SORT_TIER: Record<LinkSortBucket, number> = {
  preview: 0,
  "live-empty": 1,
  pending: 2,
  down: 3,
};
