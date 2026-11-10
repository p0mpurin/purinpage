"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHead from "@/components/zine/PageHead";

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

  return <main className="z-page"><div className="z-wrap z-pad">
    <PageHead kanji="映画" romaji="Cinema / Film" title={film?.title || "Film"} deck={film?.year ? `Internet Archive · ${film.year}` : "Internet Archive"} />
    <section className="c-film-watch">
      {error && <p role="alert" className="z-msg bad">{error}</p>}
      {!film && !error && <div className="c-player-placeholder">Loading film…</div>}
      {film && !film.videos.length && <div className="c-player-placeholder">No browser playable video is available for this film.</div>}
      {film?.videos[videoIndex] && <video key={film.videos[videoIndex].url} className="c-player" src={film.videos[videoIndex].url} controls playsInline preload="metadata" />}
      {film && film.videos.length > 1 && <div className="c-servers"><span className="z-label">Video file</span><div className="z-btn-row">{film.videos.map((video, index) => <button key={video.name} className={`z-btn small ${index === videoIndex ? "" : "ghost"}`} onClick={() => setVideoIndex(index)}>{video.format}</button>)}</div></div>}
      {film?.description && <p className="c-synopsis">{film.description}</p>}
    </section>
    <Link href="/watch" className="z-foot-link">← Cinema</Link>
  </div></main>;
}
