"use client";

import {
  PREVIEW_CACHE_TTL_MS,
  PREVIEW_CLIENT_MAX_ENTRIES,
  PREVIEW_CLIENT_STORAGE_KEY,
} from "@/lib/preview-constants";

export type PreviewClientEntry = {
  previewImage: string | null;
  reachable: boolean;
  savedAt: number;
};

function activeBag(bag: Record<string, PreviewClientEntry>): Record<string, PreviewClientEntry> {
  const now = Date.now();
  const next: Record<string, PreviewClientEntry> = {};
  for (const [k, v] of Object.entries(bag)) {
    if (now - v.savedAt <= PREVIEW_CACHE_TTL_MS) next[k] = v;
  }
  return next;
}

function parseBag(raw: string): Record<string, PreviewClientEntry> {
  try {
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return {};
    return j as Record<string, PreviewClientEntry>;
  } catch {
    return {};
  }
}

function trimBag(bag: Record<string, PreviewClientEntry>): Record<string, PreviewClientEntry> {
  const entries = Object.entries(bag);
  if (entries.length <= PREVIEW_CLIENT_MAX_ENTRIES) return bag;
  entries.sort((a, b) => a[1].savedAt - b[1].savedAt);
  const next: Record<string, PreviewClientEntry> = {};
  const drop = entries.length - PREVIEW_CLIENT_MAX_ENTRIES;
  for (let i = drop; i < entries.length; i++) {
    const kv = entries[i];
    if (kv) next[kv[0]] = kv[1];
  }
  return next;
}

export function readClientPreviewCache(url: string): PreviewClientEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREVIEW_CLIENT_STORAGE_KEY);
    if (!raw) return null;
    const bag = parseBag(raw);
    const e = bag[url];
    if (!e || typeof e.savedAt !== "number") return null;
    if (Date.now() - e.savedAt > PREVIEW_CACHE_TTL_MS) return null;
    return e;
  } catch {
    return null;
  }
}

export function writeClientPreviewCache(
  url: string,
  data: { previewImage: string | null; reachable: boolean }
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PREVIEW_CLIENT_STORAGE_KEY);
    let bag = activeBag(raw ? parseBag(raw) : {});
    bag[url] = {
      previewImage: data.previewImage,
      reachable: data.reachable,
      savedAt: Date.now(),
    };
    bag = trimBag(bag);
    localStorage.setItem(PREVIEW_CLIENT_STORAGE_KEY, JSON.stringify(bag));
  } catch {
    /* quota or private mode */
  }
}
