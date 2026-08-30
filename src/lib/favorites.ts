"use client";

import type { LinkItem } from "@/lib/links";

const FAVORITES_STORAGE_KEY = "wired_sys_favorites_v1";

// Default starter favorites if empty
export const DEFAULT_FAVORITES: LinkItem[] = [
  { name: "hianime.to", url: "https://hianime.to/" },
  { name: "1337x", url: "https://1337x.to/" },
  { name: "MangaFire", url: "https://mangafire.to/" },
  { name: "FMHY", url: "https://fmhy.net/" },
  { name: "cobalt.tools", url: "https://cobalt.tools/" },
];

export function getFavorites(): LinkItem[] {
  if (typeof window === "undefined") return DEFAULT_FAVORITES;
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      // Initialize with default starters
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(DEFAULT_FAVORITES));
      return DEFAULT_FAVORITES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FAVORITES;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

export function saveFavorites(favs: LinkItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent("wired_favorites_change", { detail: favs }));
  } catch {
    // ignore
  }
}

export function isFavorite(url: string): boolean {
  if (typeof window === "undefined") return false;
  const favs = getFavorites();
  return favs.some((f) => f.url.toLowerCase() === url.toLowerCase());
}

export function toggleFavorite(link: LinkItem): boolean {
  const favs = getFavorites();
  const index = favs.findIndex((f) => f.url.toLowerCase() === link.url.toLowerCase());
  
  let updated: LinkItem[];
  let isNowFav = false;

  if (index >= 0) {
    updated = favs.filter((_, i) => i !== index);
    isNowFav = false;
  } else {
    updated = [link, ...favs];
    isNowFav = true;
  }

  saveFavorites(updated);
  return isNowFav;
}

export function addCustomFavorite(name: string, url: string): boolean {
  let cleanUrl = url.trim();
  if (!cleanUrl) return false;
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const cleanName = name.trim() || cleanUrl.replace(/^https?:\/\//, "").split("/")[0];
  const newLink: LinkItem = {
    name: cleanName,
    url: cleanUrl,
  };

  const favs = getFavorites();
  // Avoid duplicate URL
  const existing = favs.find((f) => f.url.toLowerCase() === cleanUrl.toLowerCase());
  if (!existing) {
    saveFavorites([newLink, ...favs]);
  }
  return true;
}

export function removeFavoriteByUrl(url: string) {
  const favs = getFavorites();
  const updated = favs.filter((f) => f.url.toLowerCase() !== url.toLowerCase());
  saveFavorites(updated);
}
