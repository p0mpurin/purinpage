import { PREVIEW_CACHE_TTL_MS } from "@/lib/preview-constants";

export type PreviewCachePayload = {
  ok: true;
  reachable: boolean;
  statusCode: number | null;
  previewImage: string | null;
};

type Entry = { expires: number; payload: PreviewCachePayload };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 900;

function prune(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expires <= now) store.delete(key);
  }
  if (store.size <= MAX_ENTRIES) return;
  const sorted = [...store.entries()].sort((a, b) => a[1].expires - b[1].expires);
  while (store.size > MAX_ENTRIES && sorted.length > 0) {
    const shift = sorted.shift();
    if (shift) store.delete(shift[0]);
  }
}

export function getServerPreviewCache(href: string): PreviewCachePayload | null {
  prune();
  const row = store.get(href);
  if (!row || row.expires <= Date.now()) {
    if (row) store.delete(href);
    return null;
  }
  return row.payload;
}

export function setServerPreviewCache(href: string, payload: PreviewCachePayload): void {
  prune();
  store.set(href, {
    expires: Date.now() + PREVIEW_CACHE_TTL_MS,
    payload,
  });
}
