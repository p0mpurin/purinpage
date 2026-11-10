"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchIcon } from "@/components/zine/icons";
import type { CinemaSort } from "@/lib/moviebox-api";

type CinemaItem = { id: string; source: string; title: string; kind: string; poster: string | null; slug?: string; description: string | null; year?: string | null; rating?: number | null };
type Category = "anime" | "movies" | "drama" | "classics";

const tabs: { id: Category; name: string }[] = [
  { id: "anime", name: "Anime" },
  { id: "movies", name: "Movies" },
  { id: "drama", name: "Asian dramas" },
  { id: "classics", name: "Classic films" },
];
const sortOptions: { id: CinemaSort; name: string }[] = [
  { id: "hot", name: "Hot right now" },
  { id: "popular", name: "Most popular" },
  { id: "rated", name: "Top rated" },
  { id: "newest", name: "New arrivals" },
  { id: "az", name: "A to Z" },
];

function titleHref(item: CinemaItem, category: Category) {
  if (item.source === "Internet Archive") return `/watch/movie/${encodeURIComponent(item.id.slice(8))}`;
  return `/watch/title/${encodeURIComponent(item.id.slice(9))}?slug=${encodeURIComponent(item.slug || "")}&category=${category}`;
}

function CinemaCard({ item, category }: { item: CinemaItem; category: Category }) {
  return <Link className="c-card" href={titleHref(item, category)}>
    <span className="c-poster">{item.poster ? <Image src={item.poster} alt="" fill sizes="(min-width: 900px) 16vw, 45vw" unoptimized /> : <span>No poster</span>}<span className="c-card-play" aria-hidden="true">▶</span></span>
    <strong>{item.title}</strong><small>{item.year || (item.kind === "movie" ? "Film" : "Series")}{item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ""}</small>
  </Link>;
}

export default function WatchPage() {
  const [category, setCategory] = useState<Category>("anime");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CinemaSort>("hot");
  const [items, setItems] = useState<CinemaItem[]>([]);
  const [weekly, setWeekly] = useState<CinemaItem[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ category, page: String(page), sort });
    if (query) params.set("q", query);
    fetch(`/api/cinema?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Catalog unavailable");
        setItems(data.items || []);
        setWeekly(data.weekly || []);
        setMore(Boolean(data.more));
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, page, query, sort]);

  function startLoading() { setLoading(true); setError(""); setItems([]); setWeekly([]); }
  function changeCategory(next: Category) { if (next === category) return; startLoading(); setCategory(next); setSort(next === "classics" ? "popular" : "hot"); setQuery(""); setSearchInput(""); setPage(1); }
  function changeSort(next: CinemaSort) { if (next === sort) return; startLoading(); setSort(next); setPage(1); }
  function changePage(next: number) { startLoading(); setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const featured = !loading && !query && page === 1 ? items[0] : undefined;
  const gridItems = featured ? items.slice(1) : items;

  return <main className="z-page c-cinema-page"><div className="z-wrap z-pad">
    <section className="c-cinema" aria-label="Cinema catalog">
      <header className="c-cinema-intro">
        <div><span className="c-eyebrow">Your screening room</span><h1>Cinema<span aria-hidden="true">.</span></h1><p>Find your next favorite story.</p></div>
        <form className="c-search" role="search" onSubmit={(event) => { event.preventDefault(); startLoading(); setPage(1); setQuery(searchInput.trim()); }}>
          <label className="c-search-box"><SearchIcon size={20} /><span className="c-visually-hidden">Search {tabs.find((tab) => tab.id === category)?.name}</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={`Search ${category === "drama" ? "Asian dramas" : category === "anime" ? "anime" : "films"}`} /></label>
          <button type="submit">Search</button>
          {query && <button className="c-search-clear" type="button" onClick={() => { startLoading(); setQuery(""); setSearchInput(""); setPage(1); }}>Clear</button>}
        </form>
      </header>

      <div className="c-category-tabs" role="tablist" aria-label="Cinema categories">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={category === tab.id} onClick={() => changeCategory(tab.id)}>{tab.name}</button>)}</div>
      {!query && <div className="c-browse-toolbar"><span>{category === "classics" ? "Explore classic films" : "Explore the collection"}</span><label className="c-sort-control"><span>Sort by</span><select aria-label="Sort titles" value={sort} onChange={(event) => changeSort(event.target.value as CinemaSort)}>{sortOptions.filter((option) => category !== "classics" || ["popular", "newest", "az"].includes(option.id)).map((option) => <option key={option.id} value={option.id}>{category === "classics" && option.id === "newest" ? "Recently added" : option.name}</option>)}</select></label></div>}

      {featured && <Link className="c-feature" href={titleHref(featured, category)}>
        {featured.poster && <><Image className="c-feature-bg" src={featured.poster} alt="" fill sizes="100vw" unoptimized /><span className="c-feature-art"><Image src={featured.poster} alt="" fill sizes="(min-width: 800px) 220px, 120px" unoptimized /></span></>}
        <span className="c-feature-copy"><span className="c-feature-kicker">{sortOptions.find((option) => option.id === sort)?.name} · {featured.kind === "movie" ? "Film" : "Series"}</span><strong>{featured.title}</strong><span className="c-feature-desc">{featured.description || "Pick up a new story and start watching."}</span><span className="c-feature-play">▶ &nbsp; Watch now</span></span>
      </Link>}

      <div className="c-results-head"><div><span className="c-eyebrow">Browse the library</span><h2>{query ? `Search: ${query}` : tabs.find((tab) => tab.id === category)?.name}</h2></div><span>{loading ? "Loading…" : `${items.length} titles on this page`}</span></div>
      {error && <p role="alert" className="c-cinema-error">{error}</p>}
      {!loading && !error && !items.length && <p className="c-empty">No titles found. Try another search.</p>}
      {loading ? <div className="c-grid" aria-label="Loading titles">{Array.from({ length: 12 }, (_, index) => <div key={index} className="c-card-skeleton" />)}</div> : <div className="c-grid">{gridItems.map((item) => <CinemaCard key={item.id} item={item} category={category} />)}</div>}
      {!loading && (page > 1 || more) && <div className="c-pagination"><button className="z-btn ghost small" disabled={page <= 1} onClick={() => changePage(page - 1)}>← Previous</button><span>Page {page}</span><button className="z-btn ghost small" disabled={!more} onClick={() => changePage(page + 1)}>Next →</button></div>}
      {!loading && !error && !query && page === 1 && category !== "classics" && <section className="c-weekly" aria-labelledby="c-weekly-title"><div className="c-weekly-head"><div><span className="c-eyebrow">Fresh from the catalog</span><h2 id="c-weekly-title">New this week</h2><p>Released in the last seven days.</p></div>{weekly.length > 0 && <span>{weekly.length} new {weekly.length === 1 ? "title" : "titles"}</span>}</div>{weekly.length ? <div className="c-grid">{weekly.map((item) => <CinemaCard key={item.id} item={item} category={category} />)}</div> : <div className="c-weekly-empty"><p>No {category === "anime" ? "anime" : category === "drama" ? "dramas" : "movies"} in this catalog have a release date from the last seven days.</p><button type="button" onClick={() => { changeSort("newest"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Browse new arrivals ↑</button></div>}</section>}
    </section>
    <Link href="/" className="z-foot-link">← Back to hub</Link>
  </div></main>;
}
