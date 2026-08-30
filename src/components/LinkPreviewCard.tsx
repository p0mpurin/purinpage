"use client";

import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

interface LinkCardProps {
  name: string;
  url: string;
  animationDelay?: string;
  categoryIcon?: string;
}

export default function LinkPreviewCard({
  name,
  url,
  animationDelay = "0ms",
  categoryIcon,
}: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    setStarred(isFavorite(url));

    const handleFavChange = () => {
      setStarred(isFavorite(url));
    };

    window.addEventListener("wired_favorites_change", handleFavChange);
    return () => window.removeEventListener("wired_favorites_change", handleFavChange);
  }, [url]);

  let domain = "";
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {
    domain = url.replace(/^https?:\/\//, "").split("/")[0] || url;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowFav = toggleFavorite({ name, url, icon: categoryIcon });
    setStarred(isNowFav);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay }}
      className="glass-card-dream group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)] border border-[var(--wired-grid)] bg-black/40"
    >
      {/* Top Bar: Favicon + Domain Pill + Actions */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--wired-grid)] bg-black/60 p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <img
              src={faviconUrl}
              alt=""
              className="h-full w-full object-contain rounded-xs"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <span className="truncate font-mono text-[0.68rem] uppercase tracking-wider text-[var(--text-main)] opacity-75 group-hover:opacity-100 transition-opacity">
            {domain}
          </span>
        </div>

        {/* Actions: Favorite Star + Copy Link */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Star / Favorite Toggle Button */}
          <button
            type="button"
            onClick={handleToggleStar}
            aria-label={starred ? "Remove from Favorites" : "Add to Favorites"}
            title={starred ? "In Favorites (Click to remove)" : "Add to Favorites"}
            className={`rounded-md border p-1.5 transition-all duration-200 focus:outline-none cursor-pointer ${
              starred
                ? "border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] shadow-[0_0_10px_var(--bubble-glow-subtle)] opacity-100"
                : "border-[var(--wired-grid)] bg-black/40 text-white/40 hover:border-[var(--accent-pink)]/50 hover:text-white"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={starred ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy URL"}
            title="Copy URL"
            className="rounded-md border border-[var(--wired-grid)] bg-black/40 p-1.5 text-[var(--text-main)] opacity-60 transition-all duration-200 hover:border-[var(--accent-pink)] hover:text-[var(--accent-pink)] hover:opacity-100 focus:outline-none cursor-pointer"
          >
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-pink)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Center: Title */}
      <div className="relative z-10 my-3 text-left">
        <h3 className="line-clamp-1 text-sm font-bold uppercase tracking-wide text-white transition-colors duration-300 group-hover:text-[var(--accent-pink)] text-glow-pink">
          {name}
        </h3>
      </div>

      {/* Bottom Bar: Action link with gentle arrow */}
      <div className="relative z-10 flex items-center justify-between border-t border-[var(--wired-grid)]/60 pt-2.5">
        <span className="font-mono text-[0.62rem] uppercase tracking-widest text-[var(--text-main)] opacity-50 group-hover:opacity-80 transition-opacity">
          Direct Link
        </span>
        <span className="flex items-center gap-1 font-mono text-[0.68rem] font-semibold text-[var(--accent-pink)] opacity-80 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
          <span>VISIT</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17l9.2-9.2M17 17V8H8" />
          </svg>
        </span>
      </div>
    </a>
  );
}
