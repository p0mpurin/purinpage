"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { categoryLinks, type LinkItem } from "@/lib/links";
import {
  addCustomFavorite,
  EMPTY_FAVORITES,
  getFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/favorites";
import { useAuthGate } from "@/lib/use-auth-gate";
import LinkRow from "@/components/zine/LinkRow";
import { useZineFx } from "@/components/zine/useZineFx";

const PICKS_PREVIEW = 6;

type Chapter = { id: string; title: string; label: string; links: LinkItem[]; isPicks: boolean };

function chapterId(title: string) {
  return `ch-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "picks"}`;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";
  const loading = useAuthGate();
  const favorites = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => EMPTY_FAVORITES);
  const [query, setQuery] = useState("");
  const [picksOpen, setPicksOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const chipsRef = useRef<HTMLElement>(null);

  const category = slug ? categoryLinks[slug] : undefined;
  const isFavorites = slug === "favorites";
  const allLinks = useMemo(
    () => (isFavorites ? favorites : (category?.links ?? [])),
    [isFavorites, favorites, category],
  );
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

  const totalChapters = useMemo(
    () => new Set(allLinks.map((l) => l.section ?? "")).size,
    [allLinks],
  );

  useZineFx(`${loading}-${slug}-${q}-${picksOpen}-${chapters.length}`);

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

  if (loading) {
    return (
      <main className="z-page">
        <p className="z-loading">
          Loading<span>_</span>
        </p>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="z-page">
        <div className="z-missing z-pad z-wrap">
          <h1>Page not found</h1>
          <p>There is no category called “{slug}”.</p>
          <Link href="/">Back to the contents</Link>
        </div>
      </main>
    );
  }

  const order = Object.keys(categoryLinks).filter((s) => s !== "favorites");
  const nextSlug = order[(order.indexOf(slug) + 1) % order.length];
  const next = isFavorites ? categoryLinks[order[0]] : categoryLinks[nextSlug];
  const hasFmhy = allLinks.some((l) => l.section);

  return (
    <main className="z-page">
      <div className="z-wrap">
        <section className="c-hero">
          <div className="c-img img" style={{ "--img": `url("${category.icon}")` } as CSSProperties} />
          <span className="c-kanji" aria-hidden="true">
            {category.kanji}
          </span>
          <div className="c-title">
            <Link href="/" className="c-back">
              ← Contents
            </Link>
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
                      <LinkRow key={link.url} link={link} />
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

            {next && (
              <Link href={`/category/${isFavorites ? order[0] : nextSlug}`} className="c-next">
                <small>Next →</small>
                <b>{next.title}</b>
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
