"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_FAVORITES,
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { linkHealth } from "@/lib/link-health";
import type { LinkItem } from "@/lib/links";

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || url;
  }
}

type LinkRowProps = {
  link: LinkItem;
  /** Category name, shown above the link in cross-category lists like search results. */
  from?: string;
  /** False for links the health check never sees (your own custom favorites): only a failure is shown. */
  tracked?: boolean;
};

export default function LinkRow({ link, from, tracked = true }: LinkRowProps) {
  const favorites = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => EMPTY_FAVORITES);
  const starred = favorites.some((f) => f.url.toLowerCase() === link.url.toLowerCase());
  const health = linkHealth(link.url);
  const showDot = health === "dead" || (health === "ok" && tracked);

  return (
    <li className={health === "dead" ? "c-item down" : "c-item"}>
      <a className="c-link" href={link.url} target="_blank" rel="noopener noreferrer">
        <span className="c-initial" aria-hidden="true">
          {link.name.trim().charAt(0).toUpperCase() || "•"}
        </span>
        <span className="c-body">
          {from && <span className="c-from">{from}</span>}
          <b>{link.name}</b>
          {link.description && <em>{link.description}</em>}
          <code>
            {showDot && <i className={`h-dot ${health}`} aria-hidden="true" />}
            {hostOf(link.url)}
            {health === "dead" && <span className="h-down"> · not responding</span>}
          </code>
        </span>
      </a>
      <button
        type="button"
        className="c-star"
        aria-pressed={starred}
        aria-label={starred ? `Remove ${link.name} from favorites` : `Add ${link.name} to favorites`}
        onClick={() => toggleFavorite({ name: link.name, url: link.url, description: link.description })}
      >
        {starred ? "★" : "☆"}
      </button>
    </li>
  );
}
