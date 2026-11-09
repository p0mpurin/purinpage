"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { categoryLinks, type LinkItem } from "@/lib/links";
import LinkRow from "./LinkRow";
import { CloseIcon } from "./icons";

type Entry = { link: LinkItem; category: string; haystack: string };

const MAX_RESULTS = 80;

const INDEX: Entry[] = Object.entries(categoryLinks).flatMap(([, c]) =>
  c.links.map((link) => ({
    link,
    category: c.title,
    haystack: `${link.name} ${link.description ?? ""} ${link.section ?? ""} ${link.url}`.toLowerCase(),
  })),
);

const CATEGORIES = Object.entries(categoryLinks).filter(([slug]) => slug !== "favorites");

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const { categories, results, total } = useMemo(() => {
    if (q.length < 2) return { categories: [], results: [], total: 0 };
    const terms = q.split(/\s+/);
    const seen = new Set<string>();
    const hits: (Entry & { score: number })[] = [];
    for (const entry of INDEX) {
      if (!terms.every((t) => entry.haystack.includes(t))) continue;
      const key = entry.link.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const name = entry.link.name.toLowerCase();
      const score = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : 3;
      hits.push({ ...entry, score });
    }
    hits.sort((a, b) => a.score - b.score);
    return {
      categories: CATEGORIES.filter(([, c]) => `${c.title} ${c.romaji} ${c.tagline}`.toLowerCase().includes(q)),
      results: hits.slice(0, MAX_RESULTS),
      total: hits.length,
    };
  }, [q]);

  return (
    <div className="z-search" role="dialog" aria-modal="true" aria-label="Search all links">
      <div className="z-search-head">
        <div>
          <small>Search {INDEX.length.toLocaleString()} links</small>
          <button type="button" className="z-ico" onClick={onClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>
        <input
          ref={inputRef}
          id="z-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search"
          aria-label="Search all links"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="z-search-body">
        {q.length < 2 ? (
          <p className="c-empty">
            Search by site name, by what it does (“4K”, “manga”, “adblock”) or by address. Press Esc to close.
          </p>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="z-search-cats">
                {categories.map(([slug, c]) => (
                  <Link key={slug} href={`/category/${slug}`} onClick={onClose}>
                    {c.title} →
                  </Link>
                ))}
              </div>
            )}
            {results.length > 0 ? (
              <section className="c-ch">
                <header>
                  <span className="c-no">RESULTS</span>
                  <h2>{query.trim()}</h2>
                  <span className="c-count">{total > MAX_RESULTS ? `${MAX_RESULTS} of ${total}` : total}</span>
                </header>
                <ul className="c-list">
                  {results.map((r) => (
                    <LinkRow key={r.link.url} link={r.link} from={r.category} />
                  ))}
                </ul>
              </section>
            ) : (
              <p className="c-empty">No links match “{query.trim()}”. Try a shorter word or a site name.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
