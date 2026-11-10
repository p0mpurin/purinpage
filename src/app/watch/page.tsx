"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHead from "@/components/zine/PageHead";

type CinemaItem = { id: string; source: string; title: string; kind: string; poster: string | null; url: string | null; slug?: string; description: string | null; blocked: boolean };
type Category = "anime" | "movies" | "drama" | "classics";
const tabs: { id: Category; name: string }[] = [
  { id: "anime", name: "Anime" }, { id: "movies", name: "Movies" }, { id: "drama", name: "Asian dramas" }, { id: "classics", name: "Classic films" },
];

export default function WatchPage() {
  const [category, setCategory] = useState<Category>("anime");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CinemaItem[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ category, page: String(page) });
    if (query) params.set("q", query);
    fetch(`/api/cinema?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Catalog unavailable");
        setItems(data.items || []);
        setMore(Boolean(data.more));
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, page, query]);

  function resetPaging() { setPage(1); }
  function changeCategory(next: Category) { setLoading(true); setError(""); setCategory(next); setQuery(""); setSearchInput(""); resetPaging(); }
  function changePage(next: number) {
    setLoading(true); setError("");
    setPage(next);
  }

  return <main className="z-page"><div className="z-wrap z-pad">
    <PageHead kanji="映画館" romaji="Eigakan / Cinema" title="Cinema" deck="Find a title and watch it here, without opening a source site." />
    <section className="c-cinema" aria-label="Cinema catalog">
      <div className="c-source"><span className="z-label">Cinema source</span><h2>{category === "classics" ? "Internet Archive" : "MovieBox"}</h2><p>{category === "classics" ? "Browse playable classic films from the Archive." : "Browse movies, anime, and Asian dramas. Choose a title and watch it here in Cinema."}</p></div>
      <form className="c-search" onSubmit={(event) => { event.preventDefault(); setLoading(true); setError(""); resetPaging(); setQuery(searchInput.trim()); }}>
        <label className="z-field"><span>Search {category === "anime" ? "anime" : category === "drama" ? "Asian dramas" : "films"}</span><input className="z-input" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={category === "anime" ? "Search anime" : category === "drama" ? "Search Asian dramas" : "Search films"} /></label>
        <button className="z-btn" type="submit">Search</button>
        {query && <button className="z-btn ghost" type="button" onClick={() => { setLoading(true); setError(""); setQuery(""); setSearchInput(""); resetPaging(); }}>Clear</button>}
      </form>
      <div className="z-tabs" role="tablist" aria-label="Browse genres">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={category === tab.id && !query} onClick={() => changeCategory(tab.id)}>{tab.name}</button>)}</div>
      <div className="c-results-head"><h3>{query ? `Results for “${query}”` : tabs.find((tab) => tab.id === category)?.name}</h3><span>{loading ? "Loading…" : `${items.length} titles`}</span></div>
      {error && <p role="alert" className="z-msg bad">{error}</p>}
      {!loading && !error && !items.length && <p className="c-empty">No titles found. Try a different search.</p>}
      <div className="c-grid">{items.map((item) => <a className="c-card" key={item.id} href={item.source === "Internet Archive" ? `/watch/movie/${encodeURIComponent(item.id.slice(8))}` : `/watch/title/${encodeURIComponent(item.id.slice(9))}?slug=${encodeURIComponent(item.slug || "")}&category=${category}`}>
        <span className="c-poster">{item.poster ? <Image src={item.poster} alt="" fill sizes="(min-width: 900px) 16vw, 45vw" unoptimized /> : <span>No poster</span>}</span>
        <strong>{item.title}</strong><small>{item.kind === "movie" ? "Film" : "Series"} · {item.source}{item.blocked ? " · Availability limited" : ""}</small>
      </a>)}</div>
      <div className="c-pagination"><button className="z-btn ghost small" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>Previous</button><span>Page {page}</span><button className="z-btn ghost small" disabled={!more || loading} onClick={() => changePage(page + 1)}>Next</button></div>
    </section>
    <Link href="/" className="z-foot-link">← Contents</Link>
  </div></main>;
}
