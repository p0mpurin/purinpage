"use client";

import Link from "next/link";
import { useSyncExternalStore, type CSSProperties } from "react";
import { categoryLinks } from "@/lib/links";
import { EMPTY_FAVORITES, getFavoritesSnapshot, subscribeFavorites } from "@/lib/favorites";
import { useAuthGate } from "@/lib/use-auth-gate";
import { useZineFx } from "@/components/zine/useZineFx";

const COVER = "movies";
const FEATURED = ["anime", "music", "ai"];

const photo = (url: string) => ({ "--img": `url("${url}")` }) as CSSProperties;

export default function Home() {
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

  const categories = Object.entries(categoryLinks).map(([slug, data]) => ({
    slug,
    ...data,
    count: slug === "favorites" ? favorites.length : data.links.length,
  }));
  const sections = categories.filter((c) => c.slug !== "favorites");
  const totalLinks = sections.reduce((sum, c) => sum + c.count, 0);
  const cover = categoryLinks[COVER];
  const issue = new Date().toLocaleString("en", { month: "short", year: "numeric" }).toUpperCase();
  const ticker = sections.map((c) => c.title);

  return (
    <main className="z-page">
      <div className="z-wrap">
        <section className="z-cover">
          <div className="z-cover-img img" style={photo(cover.icon)} />
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
                <b>{cover.links.length}</b> ways to watch tonight
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

        <section className="z-feat">
          <h2 className="z-h z-pad">
            <span>特集</span>In this issue
          </h2>
          <div className="f-row">
            {FEATURED.map((slug) => {
              const c = categoryLinks[slug];
              return (
                <Link key={slug} className="f-card reveal" href={`/category/${slug}`}>
                  <span className="f-img img" style={photo(c.icon)} />
                  <span className="f-kanji" aria-hidden="true">
                    {c.kanji}
                  </span>
                  <b>{c.title}</b>
                  <em>{c.tagline}</em>
                  <span className="f-meta">{c.links.length} links →</span>
                </Link>
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
                <Link className="z-row" href={`/category/${c.slug}`}>
                  <span className="z-pg">{c.count}</span>
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
                </Link>
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
