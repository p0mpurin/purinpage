"use client";

import Link from "next/link";
import PageHead from "@/components/zine/PageHead";

export default function WatchPage() {
  return (
    <main className="z-page">
      <div className="z-wrap z-pad">
        <PageHead
          kanji="映画館"
          romaji="Eigakan / Cinema"
          title="Cinema"
          deck="A place to search and watch films and shows without leaving the site."
        />
        <section className="z-soon">
          <span className="z-stamp">Under construction</span>
          <p>
            The Cinema is still being built. Until it opens, the Movies &amp; TV and Anime sections have plenty of places
            to watch.
          </p>
          <div className="z-btn-row">
            <Link href="/category/movies" className="z-btn">
              Movies &amp; TV
            </Link>
            <Link href="/category/anime" className="z-btn ghost">
              Anime
            </Link>
          </div>
        </section>
        <Link href="/" className="z-foot-link">
          ← Contents
        </Link>
      </div>
    </main>
  );
}
