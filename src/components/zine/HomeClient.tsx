"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import type { CategorySummary } from "@/lib/catalog";
import { EMPTY_FAVORITES, getFavoritesSnapshot, subscribeFavorites } from "@/lib/favorites";
import fresh from "@/lib/fmhy-new.json";
import { useAuthGate } from "@/lib/use-auth-gate";
import LinkRow from "./LinkRow";
import { TLink } from "./transition";
import { useZineFx } from "./useZineFx";

/** The cover photo changes daily, cycling through these sections. */
const COVERS = ["movies", "anime", "music", "manga", "games", "books"];
const FEATURED = ["anime", "music", "ai"];
const FRESH_DAYS = 14;
const DAY_MS = 86_400_000;

const photo = (url: string) => ({ "--img": `url("${url}")` }) as CSSProperties;

type FreshLink = { name: string; url: string; description?: string; category: string };
const freshData = fresh as { addedAt: string | null; items: FreshLink[] };

export default function HomeClient({ categories }: { categories: CategorySummary[] }) {
  const loading = useAuthGate();
  const favorites = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, () => EMPTY_FAVORITES);
  useZineFx(loading ? "loading" : "home");

  if (loading) {
    return (
      <main className="z-page">
        <p className="z-loading">
          Connecting<span>_</span>
        </p>
      </main>
    );
  }

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const sections = categories.filter((c) => c.slug !== "favorites");
  const totalLinks = sections.reduce((sum, c) => sum + c.count, 0);
  const now = new Date();
  const cover = bySlug.get(COVERS[Math.floor(now.getTime() / DAY_MS) % COVERS.length]) ?? sections[0];
  const issue = now.toLocaleString("en", { month: "short", year: "numeric" }).toUpperCase();
  const ticker = sections.map((c) => c.title);
  const freshLinks: FreshLink[] =
    freshData.addedAt && now.getTime() - new Date(freshData.addedAt).getTime() < FRESH_DAYS * DAY_MS ? freshData.items : [];

  return (
    <main className="z-page">
      <div className="z-wrap">
        <section className="z-cover">
          <TLink href={`/category/${cover.slug}`} className="z-cover-img" aria-label={`Open ${cover.title}`}>
            <span className="img" style={photo(cover.icon)} />
          </TLink>
          <h1 className="z-mast">
            <span>Free</span>
            <span>Media</span>
            <span>Vault</span>
          </h1>
          <span className="z-vert" aria-hidden="true">
            無料の宝庫
          </span>
          <div className="z-lines">
            <ul>
              <li>
                <b>{cover.count}</b> links in {cover.title}, today&apos;s cover
              </li>
              <li>
                <b>{sections.length}</b> sections, from anime to AI
              </li>
              <li>
                <b>{totalLinks.toLocaleString()}</b> links, hand-picked + FMHY starred
              </li>
            </ul>
            <div className="z-barcode" aria-hidden="true">
              <i />
              <span>¥0 · {issue}</span>
            </div>
          </div>
        </section>

        <div className="z-ticker-wrap" aria-hidden="true">
          <div className="z-ticker">
            <div>
              {[...ticker, ...ticker].map((title, i) => (
                <span key={i}>
                  {title}
                  <em>✶</em>
                </span>
              ))}
            </div>
          </div>
        </div>

        {freshLinks.length > 0 && (
          <section className="z-fresh z-pad reveal">
            <h2 className="z-h">
              <span>新着</span>New this week<small>{freshLinks.length} added</small>
            </h2>
            <ul className="c-list">
              {freshLinks.map((link) => (
                <LinkRow key={link.url} link={link} from={link.category} />
              ))}
            </ul>
          </section>
        )}

        <section className="z-feat">
          <h2 className="z-h z-pad">
            <span>特集</span>In this issue
          </h2>
          <div className="f-row">
            {FEATURED.map((slug) => {
              const c = bySlug.get(slug);
              if (!c) return null;
              return (
                <TLink key={slug} className="f-card reveal" href={`/category/${slug}`}>
                  <span className="f-img img" style={photo(c.icon)} />
                  <span className="f-kanji" aria-hidden="true">
                    {c.kanji}
                  </span>
                  <b>{c.title}</b>
                  <em>{c.tagline}</em>
                  <span className="f-meta">{c.count} links →</span>
                </TLink>
              );
            })}
          </div>
        </section>

        <section className="z-contents z-pad">
          <h2 className="z-h">
            <span>目次</span>Contents<small>links</small>
          </h2>
          <ol>
            {categories.map((c) => (
              <li key={c.slug}>
                <TLink className="z-row" href={`/category/${c.slug}`}>
                  <span className="z-pg">{c.slug === "favorites" ? favorites.length : c.count}</span>
                  <span className="z-thumb img" style={photo(c.icon)} />
                  <span className="z-name">
                    {c.title}
                    <small>
                      {c.kanji} · {c.romaji}
                    </small>
                  </span>
                  <span className="z-arrow" aria-hidden="true">
                    →
                  </span>
                </TLink>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="z-colo z-pad">
        <div className="z-wrap">
          <b>WIRED/SYS</b>
          <p>
            A personal link vault. Starred picks come from FMHY, the rest are hand-picked. Use an ad blocker before you
            click anything.
          </p>
          <span>PRINTED ON THE WIRED · {issue}</span>
        </div>
      </footer>
    </main>
  );
}
