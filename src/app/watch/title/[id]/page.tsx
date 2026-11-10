"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import CinemaVideo from "@/components/cinema/CinemaVideo";
import type { MovieboxDetail, MovieboxSource, MovieboxSubtitle } from "@/lib/moviebox-api";

export default function TitleWatchPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const slug = params.get("slug") || "";
  const [detail, setDetail] = useState<MovieboxDetail | null>(null);
  const [season, setSeason] = useState(0);
  const [episode, setEpisode] = useState(0);
  const [sources, setSources] = useState<MovieboxSource[]>([]);
  const [subtitles, setSubtitles] = useState<MovieboxSubtitle[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ id, slug });
    fetch(`/api/cinema/moviebox?${query}`, { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Title unavailable"); return data as MovieboxDetail; })
      .then((data) => { setDetail(data); const first = data.seasons[0]; setSeason(first?.number ?? 0); setEpisode(data.item.kind === "movie" ? 0 : 1); setSourceLoading(true); })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, slug]);

  useEffect(() => {
    if (!detail) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ id, slug, mode: "sources", season: String(season), episode: String(episode) });
    fetch(`/api/cinema/moviebox?${query}`, { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Video unavailable"); setSources(data.sources || []); setSubtitles(data.subtitles || []); setSourceIndex(0); })
      .catch((cause) => { if (cause.name !== "AbortError") setSourceError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setSourceLoading(false); });
    return () => controller.abort();
  }, [id, slug, detail, season, episode]);

  function select(nextSeason: number, nextEpisode: number) { if (nextSeason === season && nextEpisode === episode) return; setSeason(nextSeason); setEpisode(nextEpisode); setSources([]); setSourceError(""); setSourceLoading(true); }
  const source = sources[sourceIndex];
  const seasonInfo = detail?.seasons.find((item) => item.number === season);
  const category = params.get("category");
  const section = category === "anime" ? "Anime" : category === "drama" ? "Asian drama" : detail?.item.kind === "movie" ? "Movie" : "Series";

  return <main className="z-page c-watch-page"><div className="z-wrap z-pad">
    <header className="c-watch-header"><Link href="/watch" className="c-back">← Browse Cinema</Link><span className="c-eyebrow">Now watching · {section}</span><h1>{detail?.item.title || "Loading title…"}</h1><div className="c-watch-meta">{detail?.item.year && <span>{detail.item.year}</span>}{detail?.item.country && <span>{detail.item.country}</span>}{detail?.item.genre && <span>{detail.item.genre.split(",").slice(0, 2).join(" · ")}</span>}{detail?.item.kind === "series" && <span>Season {season} · Episode {episode}</span>}</div></header>
    <div className="c-watch-layout">
      <section className="c-watch-main" aria-label="Cinema player">
        {loading && <div className="c-player-placeholder">Loading title…</div>}
        {error && <p role="alert" className="z-msg bad">{error}</p>}
        {sourceLoading && <div className="c-player-placeholder">Loading video sources…</div>}
        {sourceError && <p role="alert" className="z-msg bad">{sourceError}</p>}
        {!loading && !sourceLoading && !source && !sourceError && <div className="c-player-placeholder">No playable video is available for this title.</div>}
        {source && <CinemaVideo url={source.url} subtitles={subtitles} title={detail?.item.title} poster={detail?.item.poster} qualities={sources.map((item) => ({ label: item.label, url: item.url }))} onQualityChange={setSourceIndex} />}
        {detail?.item.description && <details className="c-synopsis"><summary>About this title</summary><p>{detail.item.description}</p></details>}
      </section>
      {detail?.item.kind === "series" && <aside className="c-watch-side" aria-label="Episodes">
        <div className="c-episodes-head"><div><span className="c-eyebrow">Keep watching</span><h2>Episodes</h2></div>{detail.seasons.length > 1 && <label className="c-season-select"><span className="c-visually-hidden">Season</span><select value={season} onChange={(event) => select(Number(event.target.value), 1)}>{detail.seasons.map((item) => <option key={item.number} value={item.number}>Season {item.number}</option>)}</select></label>}</div>
        <div className="c-episode-navigation"><button disabled={episode <= 1} onClick={() => select(season, episode - 1)}>← Prev</button><span>{episode} / {seasonInfo?.episodes || "?"}</span><button disabled={!seasonInfo || episode >= seasonInfo.episodes} onClick={() => select(season, episode + 1)}>Next →</button></div>
        <div className="c-episode-buttons">{Array.from({ length: seasonInfo?.episodes || 0 }, (_, index) => index + 1).map((number) => <button key={number} className={number === episode ? "active" : ""} aria-current={number === episode ? "true" : undefined} onClick={() => select(season, number)}><b>{String(number).padStart(2, "0")}</b><span>Episode {number}</span>{number === episode && <em>Playing</em>}</button>)}</div>
      </aside>}
    </div>
  </div></main>;
}
