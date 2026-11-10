"use client";

import { useEffect, useRef, useState } from "react";

type Subtitle = { label: string; url: string; language: string };

export default function CinemaVideo({ url, subtitles }: { url: string; subtitles: Subtitle[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError("");
    if (!/\.m3u8(?:\?|$)/i.test(url)) {
      video.src = url;
      return () => { video.removeAttribute("src"); video.load(); };
    }
    let disposed = false;
    let destroy: (() => void) | undefined;
    import("hls.js").then(({ default: Hls }) => {
      if (disposed) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError(`This server could not play (${data.details}). Try another server.`);
        });
        destroy = () => hls.destroy();
      } else {
        setError("This browser does not support HLS playback.");
      }
    }).catch(() => setError("The video player could not load."));
    return () => { disposed = true; destroy?.(); video.removeAttribute("src"); video.load(); };
  }, [url]);

  return <div className="c-player-wrap">
    <video ref={videoRef} className="c-player" controls playsInline crossOrigin="anonymous" preload="metadata">
      {subtitles.map((subtitle) => <track key={subtitle.url} kind="subtitles" label={subtitle.label} srcLang={subtitle.language || "en"} src={subtitle.url} default={subtitle.language === "en"} />)}
    </video>
    {error && <p role="alert" className="z-msg bad">{error}</p>}
  </div>;
}
