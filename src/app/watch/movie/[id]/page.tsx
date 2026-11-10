"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CinemaVideo from "@/components/cinema/CinemaVideo";

type Film = { id: string; title: string; description: string; year: string; videos: { name: string; format: string; url: string }[] };

export default function MovieWatchPage() {
  const { id } = useParams<{ id: string }>();
  const [film, setFilm] = useState<Film | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/cinema/archive?id=${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Film unavailable");
        setFilm(data);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, [id]);

  return <main className="z-page c-watch-page"><div className="z-wrap z-pad">
    <header className="c-watch-header"><Link href="/watch" className="c-back">← Browse Cinema</Link><span className="c-eyebrow">Now watching · Classic film</span><h1>{film?.title || "Loading film…"}</h1>{film?.year && <div className="c-watch-meta"><span>{film.year}</span></div>}</header>
    <section className="c-film-watch">
      {error && <p role="alert" className="z-msg bad">{error}</p>}
      {!film && !error && <div className="c-player-placeholder">Loading film…</div>}
      {film && !film.videos.length && <div className="c-player-placeholder">No browser playable video is available for this film.</div>}
      {film?.videos[videoIndex] && <CinemaVideo url={film.videos[videoIndex].url} subtitles={[]} title={film.title} qualities={film.videos.map((video, index) => ({ label: index === 0 ? "Best" : video.format, url: video.url }))} onQualityChange={setVideoIndex} cors={false} />}
      {film?.description && <details className="c-synopsis"><summary>About this title</summary><p>{film.description}</p></details>}
    </section>
  </div></main>;
}
