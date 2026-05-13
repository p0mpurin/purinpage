"use client";

import { startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULT_PREVIEW_BANNER_URL } from "@/lib/preview-constants";
import { readClientPreviewCache, writeClientPreviewCache } from "@/lib/preview-cache-client";
import { runLinkPreviewSlot } from "@/lib/preview-fetch-queue";
import type { LinkSortBucket } from "@/lib/link-sort";

type Reachable = "idle" | "loading" | "live" | "down";

function bucketForState(
  url: string,
  reachable: Reachable,
  previewImage: string | null
): LinkSortBucket {
  if (url === "#" || !url.startsWith("http")) return "down";
  if (reachable === "idle" || reachable === "loading") return "pending";
  if (reachable === "down") return "down";
  if (previewImage) return "preview";
  return "live-empty";
}

export default function LinkPreviewCard(props: {
  name: string;
  url: string;
  sortKey: string;
  animationDelay: string;
  onSortUpdate?: (sortKey: string, bucket: LinkSortBucket) => void;
}) {
  const { name, url, sortKey, animationDelay, onSortUpdate } = props;
  const skipFetchRef = useRef(false);
  const [reachable, setReachable] = useState<Reachable>(() =>
    url === "#" || !url.startsWith("http") ? "down" : "idle"
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const rootRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    if (url === "#" || !url.startsWith("http")) return;
    const hit = readClientPreviewCache(url);
    if (hit) {
      skipFetchRef.current = true;
      startTransition(() => {
        setPreviewImage(hit.previewImage);
        setReachable(hit.reachable ? "live" : "down");
      });
    }
  }, [url]);

  useEffect(() => {
    onSortUpdate?.(sortKey, bucketForState(url, reachable, previewImage));
  }, [url, reachable, previewImage, sortKey, onSortUpdate]);

  useEffect(() => {
    if (url === "#" || !url.startsWith("http")) {
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();

        if (skipFetchRef.current) {
          return;
        }

        void (async () => {
          setReachable("loading");
          try {
            const trimmed = url.trim();
            const res = await runLinkPreviewSlot(async () => {
              const init = {
                method: "POST" as const,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed }),
              };
              let r = await fetch("/api/link-preview", init);
              if (r.status === 503) {
                await new Promise((resolve) => setTimeout(resolve, 750));
                r = await fetch("/api/link-preview", init);
              }
              return r;
            });
            const data = (await res.json()) as {
              reachable?: boolean;
              previewImage?: string | null;
              error?: string;
            };
            if (cancelled) return;
            if (!res.ok) {
              setReachable("down");
              return;
            }
            if (typeof data.previewImage === "string" && data.previewImage.length > 0) {
              setPreviewImage(data.previewImage);
            }
            const live = Boolean(data.reachable);
            setReachable(live ? "live" : "down");
            writeClientPreviewCache(url, {
              previewImage:
                typeof data.previewImage === "string" && data.previewImage.length > 0
                  ? data.previewImage
                  : null,
              reachable: live,
            });
          } catch {
            if (!cancelled) {
              setReachable("down");
              writeClientPreviewCache(url, { previewImage: null, reachable: false });
            }
          }
        })();
      },
      { rootMargin: "140px 0px", threshold: 0.06 }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [url]);

  function renderBanner() {
    if (previewImage) {
      return (
        <img
          src={previewImage}
          alt=""
          className="mx-auto h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      );
    }

    if (reachable === "live") {
      return (
        <div className="flex h-full min-h-[6rem] w-full items-center justify-center px-5">
          <div className="relative w-full max-w-[85%] border border-[var(--wired-grid)] bg-black/55 px-5 py-4 text-center backdrop-blur-[1px]">
            <div
              className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--accent-pink)]/35 to-transparent"
              aria-hidden
            />
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.42em] text-[var(--foreground)] text-shadow-pink">
              No preview
            </p>
            <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[var(--text-main)] opacity-50">
              Site is up · no share image
            </p>
          </div>
        </div>
      );
    }

    if (reachable === "down") {
      return (
        <img
          src={DEFAULT_PREVIEW_BANNER_URL}
          alt=""
          className="mx-auto h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      );
    }

    return (
      <div
        className="flex h-full min-h-[6rem] w-full items-center justify-center bg-[linear-gradient(180deg,rgba(26,26,26,0.9),rgba(0,0,0,0.95))]"
        aria-hidden
      >
        <span className="text-[0.55rem] uppercase tracking-[0.5em] text-[var(--text-main)] opacity-25">···</span>
      </div>
    );
  }

  return (
    <a
      ref={rootRef}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      style={{ animationDelay }}
      className="link-preview-card bubble-tile group relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--wired-grid)] bg-black/35 tracking-normal no-underline shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--accent-pink)]/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)] hover:!tracking-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-black">
        {renderBanner()}

        {reachable === "loading" && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
            aria-hidden
          >
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--accent-dim)] border-t-[var(--accent-pink)]" />
          </div>
        )}

        <div className="absolute right-2 top-2">
          <StatusChip state={reachable} />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <span className="line-clamp-2 text-balance text-sm font-bold uppercase leading-snug tracking-wide text-[var(--accent-pink)] transition-colors duration-300 group-hover:text-white">
          {name}
        </span>
        <span className="truncate font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-main)] opacity-55">
          {url.replace(/^https?:\/\//, "").split("/")[0]}
        </span>
      </div>
    </a>
  );
}

function StatusChip({ state }: { state: Reachable }) {
  if (state === "idle") return null;

  if (state === "loading") {
    return (
      <span className="rounded-full bg-black/70 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-main)] backdrop-blur-sm">
        Checking
      </span>
    );
  }

  if (state === "live") {
    return (
      <span className="rounded-full bg-emerald-950/85 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)] backdrop-blur-sm">
        Online
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-950/85 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.25)] backdrop-blur-sm">
      Unreachable
    </span>
  );
}
