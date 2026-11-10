"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/zine/PageHead";
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

  function select(nextSeason: number, nextEpisode: number) { setSeason(nextSeason); setEpisode(nextEpisode); setSources([]); setSourceError(""); setSourceLoading(true); }
  const source = sources[sourceIndex];
  const seasonInfo = detail?.seasons.find((item) => item.number === season);

  return <main className="z-page"><div className="z-wrap z-pad">
    <PageHead kanji="映像" romaji="Cinema / Watch" title={detail?.item.title || "Cinema"} deck={detail?.item.kind === "movie" ? [detail.item.year, detail.item.genre].filter(Boolean).join(" · ") : `Season ${season} · Episode ${episode}`} />
    <div className="c-watch-layout">
      <section className="c-watch-main" aria-label="Cinema player">
        {loading && <div className="c-player-placeholder">Loading title…</div>}
        {error && <p role="alert" className="z-msg bad">{error}</p>}
        {sourceLoading && <div className="c-player-placeholder">Loading video sources…</div>}
        {sourceError && <p role="alert" className="z-msg bad">{sourceError}</p>}
        {!loading && !sourceLoading && !source && !sourceError && <div className="c-player-placeholder">No playable video is available for this title.</div>}
        {source && <CinemaVideo key={source.url} url={source.url} subtitles={subtitles} />}
        {sources.length > 1 && <div className="c-servers"><span className="z-label">Video quality</span><div className="z-btn-row">{sources.map((item, index) => <button key={`${item.id}-${index}`} className={`z-btn small ${sourceIndex === index ? "" : "ghost"}`} onClick={() => setSourceIndex(index)}>{item.label}</button>)}</div></div>}
        {detail?.item.description && <p className="c-synopsis">{detail.item.description}</p>}
      </section>
      {detail?.item.kind === "series" && <aside className="c-watch-side" aria-label="Episodes">
        <h2>Episodes</h2>
        {detail.seasons.length > 1 && <label className="z-field"><span>Season</span><select className="z-input" value={season} onChange={(event) => select(Number(event.target.value), 1)}>{detail.seasons.map((item) => <option key={item.number} value={item.number}>Season {item.number}</option>)}</select></label>}
        <div className="c-pagination"><button className="z-btn ghost small" disabled={episode <= 1} onClick={() => select(season, episode - 1)}>Previous</button><span>{episode} / {seasonInfo?.episodes || "?"}</span><button className="z-btn ghost small" disabled={!seasonInfo || episode >= seasonInfo.episodes} onClick={() => select(season, episode + 1)}>Next</button></div>
        <div className="c-episode-buttons">{Array.from({ length: seasonInfo?.episodes || 0 }, (_, index) => index + 1).map((number) => <button key={number} className={number === episode ? "active" : ""} onClick={() => select(season, number)}><b>{number}</b><span>Episode {number}</span></button>)}</div>
      </aside>}
    </div>
    <Link href="/watch" className="z-foot-link">← Cinema</Link>
  </div></main>;
}
