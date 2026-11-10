"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/zine/PageHead";
import CinemaVideo from "@/components/cinema/CinemaVideo";
import type { MiruroEpisode, MiruroSource, MiruroTitle } from "@/lib/miruro-data";

export default function AnimeWatchPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const id = params.id;
  const slug = search.get("slug") || "anime";
  const [title, setTitle] = useState<MiruroTitle | null>(null);
  const [episodes, setEpisodes] = useState<MiruroEpisode[]>([]);
  const [episode, setEpisode] = useState(1);
  const [episodeInput, setEpisodeInput] = useState("1");
  const [sources, setSources] = useState<MiruroSource[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState("");
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ id, slug });
    fetch(`/api/cinema/miruro?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Anime unavailable");
        setTitle(data.title);
        setEpisodes(data.episodes || []);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, slug]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ mode: "sources", id, slug, episode: String(episode) });
    fetch(`/api/cinema/miruro?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Sources unavailable");
        setSources(data.sources || []);
        setSourceIndex(0);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setSourceError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingSources(false); });
    return () => controller.abort();
  }, [id, slug, episode]);

  function selectEpisode(next: number) {
    if (next < 1 || (episodes.length && next > episodes.length)) return;
    setEpisode(next);
    setEpisodeInput(String(next));
    setSources([]);
    setLoadingSources(true);
    setSourceError("");
  }

  const selectedEpisode = episodes.find((item) => item.number === episode);
  const source = sources[sourceIndex];
  const nearby = episodes.filter((item) => item.number >= Math.max(1, episode - 5) && item.number <= episode + 5);

  return <main className="z-page"><div className="z-wrap z-pad">
    <PageHead kanji="映像" romaji="Cinema / Anime" title={title?.title || "Anime"} deck={selectedEpisode ? `Episode ${episode} · ${selectedEpisode.title}` : `Episode ${episode}`} />
    <div className="c-watch-layout">
      <section className="c-watch-main" aria-label="Anime player">
        {loading && <p>Loading anime…</p>}
        {error && <p role="alert" className="z-msg bad">{error}</p>}
        {loadingSources && <div className="c-player-placeholder">Loading episode sources…</div>}
        {sourceError && <p role="alert" className="z-msg bad">{sourceError}</p>}
        {!loadingSources && !sourceError && !source && <div className="c-player-placeholder">No playable source was returned for this episode.</div>}
        {source && <CinemaVideo key={source.url} url={source.url} subtitles={source.subtitles} />}
        {sources.length > 0 && <div className="c-servers"><span className="z-label">Choose server</span><div className="z-btn-row">{sources.map((item, index) => <button key={item.id} className={`z-btn small ${sourceIndex === index ? "" : "ghost"}`} onClick={() => setSourceIndex(index)}>{item.label}</button>)}</div></div>}
        {title?.description && <p className="c-synopsis">{title.description}</p>}
      </section>
      <aside className="c-watch-side" aria-label="Episodes">
        <h2>Episodes</h2>
        <form className="c-jump" onSubmit={(event) => { event.preventDefault(); selectEpisode(Number(episodeInput)); }}><label className="z-field"><span>Jump to episode</span><input className="z-input" type="number" min="1" max={episodes.length || undefined} value={episodeInput} onChange={(event) => setEpisodeInput(event.target.value)} /></label><button className="z-btn small">Go</button></form>
        <div className="c-pagination"><button className="z-btn ghost small" disabled={episode <= 1} onClick={() => selectEpisode(episode - 1)}>Previous</button><span>{episode} / {episodes.length || "?"}</span><button className="z-btn ghost small" disabled={episodes.length ? episode >= episodes.length : false} onClick={() => selectEpisode(episode + 1)}>Next</button></div>
        <div className="c-episode-buttons">{nearby.map((item) => <button key={item.number} className={item.number === episode ? "active" : ""} onClick={() => selectEpisode(item.number)}><b>{item.number}</b><span>{item.title}</span></button>)}</div>
      </aside>
    </div>
    <Link href="/watch" className="z-foot-link">← Cinema</Link>
  </div></main>;
}
