"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/zine/PageHead";
import CinemaVideo from "@/components/cinema/CinemaVideo";
import type { DramaDetail, DramaEpisode, DramaSource } from "@/lib/kisskh-api";

export default function DramaWatchPage() {
  const { id } = useParams<{ id: string }>();
  const [drama, setDrama] = useState<DramaDetail | null>(null);
  const [episodeId, setEpisodeId] = useState<number | null>(null);
  const [source, setSource] = useState<DramaSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/cinema/drama?id=${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Drama unavailable"); return data as DramaDetail; })
      .then((data) => { setDrama(data); const first = [...data.episodes].sort((a, b) => a.number - b.number)[0]; setEpisodeId(first?.id || null); })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!episodeId) return;
    const controller = new AbortController();
    fetch(`/api/cinema/drama?id=${encodeURIComponent(id)}&mode=source&episodeId=${episodeId}`, { signal: controller.signal })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Episode unavailable"); setSource(data); })
      .catch((cause) => { if (cause.name !== "AbortError") setSourceError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setSourceLoading(false); });
    return () => controller.abort();
  }, [id, episodeId]);

  function selectEpisode(episode: DramaEpisode) { setEpisodeId(episode.id); setSource(null); setSourceError(""); setSourceLoading(true); }
  const episodes = [...(drama?.episodes || [])].sort((a, b) => a.number - b.number);
  const episodeIndex = episodes.findIndex((item) => item.id === episodeId);
  const episode = episodes[episodeIndex];

  return <main className="z-page"><div className="z-wrap z-pad">
    <PageHead kanji="映像" romaji="Cinema / Drama" title={drama?.title || "Drama"} deck={episode ? `Episode ${episode.number} · ${drama?.country || "Asian drama"}` : "Asian drama"} />
    <div className="c-watch-layout">
      <section className="c-watch-main" aria-label="Drama player">
        {loading && <div className="c-player-placeholder">Loading drama…</div>}
        {error && <p role="alert" className="z-msg bad">{error}</p>}
        {sourceLoading && <div className="c-player-placeholder">Loading episode source…</div>}
        {sourceError && <p role="alert" className="z-msg bad">{sourceError}</p>}
        {!loading && !sourceLoading && !source && !sourceError && <div className="c-player-placeholder">No playable source is available for this episode.</div>}
        {source && <CinemaVideo key={source.url} url={source.url} subtitles={source.subtitles} />}
        {drama?.description && <p className="c-synopsis">{drama.description}</p>}
      </section>
      <aside className="c-watch-side" aria-label="Episodes">
        <h2>Episodes</h2>
        <div className="c-pagination"><button className="z-btn ghost small" disabled={episodeIndex <= 0} onClick={() => selectEpisode(episodes[episodeIndex - 1])}>Previous</button><span>{episode?.number || "?"} / {episodes.length}</span><button className="z-btn ghost small" disabled={episodeIndex < 0 || episodeIndex >= episodes.length - 1} onClick={() => selectEpisode(episodes[episodeIndex + 1])}>Next</button></div>
        <div className="c-episode-buttons">{episodes.map((item) => <button key={item.id} className={item.id === episodeId ? "active" : ""} onClick={() => selectEpisode(item)}><b>{item.number}</b><span>Episode {item.number}</span></button>)}</div>
      </aside>
    </div>
    <Link href="/watch" className="z-foot-link">← Cinema</Link>
  </div></main>;
}
