"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type TouchEvent } from "react";
import type { CategorySummary } from "@/lib/catalog";
import type { LinkItem } from "@/lib/links";
import {
  addCustomFavorite,
  EMPTY_FAVORITES,
  getFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/favorites";
import { useAuthGate } from "@/lib/use-auth-gate";
import LinkRow from "./LinkRow";
import { TLink, transitionTo } from "./transition";
import { useZineFx } from "./useZineFx";

const PICKS_PREVIEW = 6;
const SWIPE_MIN_X = 70;
const SWIPE_MAX_Y = 50;
const SWIPE_MAX_MS = 600;

type Chapter = { id: string; title: string; label: string; links: LinkItem[]; isPicks: boolean };
type Neighbor = { slug: string; title: string };

type CategoryClientProps = {
  category: CategorySummary;
  /** The category's own links; empty for Favorites, which reads the visitor's saved list. */
  links: LinkItem[];
  prev: Neighbor;
  next: Neighbor;
};

function chapterId(title: string) {
  return `ch-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "picks"}`;
}

export default function CategoryClient({ category, links, prev, next }: CategoryClientProps) {
  const router = useRouter();
  const loading = useAuthGate();
  const favorites = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => EMPTY_FAVORITES);
  const [query, setQuery] = useState("");
  const [picksOpen, setPicksOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const chipsRef = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  const isFavorites = category.slug === "favorites";
  const allLinks = isFavorites ? favorites : links;
  const q = query.trim().toLowerCase();

  const chapters = useMemo(() => {
    const filtered = q
      ? allLinks.filter((l) =>
          `${l.name} ${l.description ?? ""} ${l.section ?? ""} ${l.url}`.toLowerCase().includes(q),
        )
      : allLinks;
    const picksTitle = isFavorites ? "Your starred links" : "Editor's Picks";
    const map = new Map<string, Chapter>();
    let n = 0;
    for (const link of filtered) {
      const title = link.section ?? picksTitle;
      let chapter = map.get(title);
      if (!chapter) {
        const isPicks = !link.section;
        if (!isPicks) n++;
        chapter = {
          id: chapterId(title),
          title,
          label: isPicks ? (isFavorites ? "SAVED" : "PICKS") : `CH.${String(n).padStart(2, "0")}`,
          links: [],
          isPicks,
        };
        map.set(title, chapter);
      }
      chapter.links.push(link);
    }
    return [...map.values()];
  }, [allLinks, q, isFavorites]);

  const totalChapters = useMemo(() => new Set(allLinks.map((l) => l.section ?? "")).size, [allLinks]);

  useZineFx(`${loading}-${category.slug}-${q}-${picksOpen}-${chapters.length}`);

  // Highlight the chapter being read
  useEffect(() => {
    if (loading) return;
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveId(e.target.id)),
      { rootMargin: "-35% 0px -60% 0px" },
    );
    document.querySelectorAll(".c-ch").forEach((el) => spy.observe(el));
    return () => spy.disconnect();
  }, [loading, chapters]);

  // Keep the active chip in view inside the chip bar
  useEffect(() => {
    const nav = chipsRef.current;
    const chip = nav?.querySelector<HTMLElement>(`[data-target="${activeId}"]`);
    if (!nav || !chip) return;
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.offsetWidth / 2, behavior });
    } else if (nav.scrollHeight > nav.clientHeight) {
      nav.scrollTo({ top: chip.offsetTop - nav.clientHeight / 2, behavior });
    }
  }, [activeId]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    addCustomFavorite(customName, customUrl);
    setCustomName("");
    setCustomUrl("");
  };

  // Swipe sideways to turn to the previous / next category (not inside scrollable rows or fields)
  const onTouchStart = (e: TouchEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest(".c-chips, input, textarea, select")) {
      touch.current = null;
      return;
    }
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dy) > SWIPE_MAX_Y || Date.now() - start.t > SWIPE_MAX_MS) return;
    if (dx < 0) transitionTo(router, `/category/${next.slug}`, "next");
    else transitionTo(router, `/category/${prev.slug}`, "prev");
  };

  if (loading) {
    return (
      <main className="z-page">
        <p className="z-loading">
          Loading<span>_</span>
        </p>
      </main>
    );
  }

  const hasFmhy = allLinks.some((l) => l.section);

  return (
    <main className="z-page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="z-wrap">
        <section className="c-hero">
          <div className="c-img img" style={{ "--img": `url("${category.icon}")` } as CSSProperties} />
          <span className="c-kanji" aria-hidden="true">
            {category.kanji}
          </span>
          <div className="c-title">
            <TLink href="/" kind="prev" className="c-back">
              ← Contents
            </TLink>
            <span className="c-romaji">{category.romaji}</span>
            <h1>{category.title}</h1>
            <p>{category.tagline}</p>
          </div>
          <dl className="c-stats">
            <div>
              <dt>Links</dt>
              <dd>{allLinks.length}</dd>
            </div>
            <div>
              <dt>Chapters</dt>
              <dd>{totalChapters}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                {hasFmhy ? (
                  <>
                    <a href="https://fmhy.net/" target="_blank" rel="noopener noreferrer">
                      FMHY
                    </a>{" "}
                    ★ + picks
                  </>
                ) : isFavorites ? (
                  "Saved by you"
                ) : (
                  "Hand-picked"
                )}
              </dd>
            </div>
          </dl>
        </section>

        <div className="c-layout">
          {chapters.length > 1 && (
            <nav className="c-chips" aria-label="Chapters" ref={chipsRef}>
              {chapters.map((ch) => (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  data-target={ch.id}
                  className={ch.id === activeId ? "on" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    jumpTo(ch.id);
                  }}
                >
                  {ch.title}
                  <span>{ch.links.length}</span>
                </a>
              ))}
            </nav>
          )}

          <div className="c-main">
            <label className="c-search" htmlFor="category-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="category-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${allLinks.length} links`}
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  CLEAR
                </button>
              )}
            </label>

            {isFavorites && (
              <form className="c-add" onSubmit={handleAddCustom}>
                <h3>Add your own link</h3>
                <input
                  id="custom-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Name (optional)"
                />
                <input
                  id="custom-url"
                  type="text"
                  inputMode="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Address, e.g. example.com"
                  required
                />
                <button type="submit">Save link</button>
              </form>
            )}

            {chapters.map((ch) => {
              const collapsed = ch.isPicks && !isFavorites && !q && !picksOpen && ch.links.length > PICKS_PREVIEW;
              const shown = collapsed ? ch.links.slice(0, PICKS_PREVIEW) : ch.links;
              return (
                <section key={ch.id} id={ch.id} className="c-ch reveal">
                  <header>
                    <span className="c-no">{ch.label}</span>
                    <h2>{ch.title}</h2>
                    <span className="c-count">{ch.links.length}</span>
                  </header>
                  <ul className="c-list">
                    {shown.map((link) => (
                      <LinkRow key={link.url} link={link} tracked={!isFavorites} />
                    ))}
                  </ul>
                  {ch.isPicks && !isFavorites && !q && ch.links.length > PICKS_PREVIEW && (
                    <button type="button" className="c-more" onClick={() => setPicksOpen((open) => !open)}>
                      {picksOpen ? "Show fewer" : `Show all ${ch.links.length} picks`}
                    </button>
                  )}
                </section>
              );
            })}

            {chapters.length === 0 && (
              <p className="c-empty">
                {q
                  ? `Nothing here matches “${query.trim()}”. Try a site name, or press Ctrl+K to search every category.`
                  : isFavorites
                    ? "No favorites yet. Tap the ☆ on any link, or add your own above."
                    : "This category is empty."}
              </p>
            )}

            <nav className="c-turn" aria-label="More categories">
              <TLink href={`/category/${prev.slug}`} kind="prev" className="c-next prev">
                <small>← Previous</small>
                <b>{prev.title}</b>
              </TLink>
              <TLink href={`/category/${next.slug}`} kind="next" className="c-next">
                <small>Next →</small>
                <b>{next.title}</b>
              </TLink>
            </nav>
          </div>
        </div>
      </div>
    </main>
  );
}
