"use client";

import { useEffect, useRef, useState } from "react";

type Subtitle = { label: string; url: string; language: string };

export default function CinemaVideo({ url, subtitles }: { url: string; subtitles: Subtitle[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [captionUrl, setCaptionUrl] = useState("off");

  useEffect(() => {
    const saved = window.localStorage.getItem("cinema:subtitle-language");
    const preferred = window.navigator.language.split("-")[0].toLowerCase();
    const chosen = saved === "off" ? null : subtitles.find((item) => item.language.toLowerCase() === saved)
      || subtitles.find((item) => item.language.toLowerCase() === preferred)
      || subtitles.find((item) => item.language.toLowerCase() === "en")
      || subtitles[0];
    setCaptionUrl(chosen?.url || "off");
  }, [subtitles]);

  function syncCaptions() {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;
    Array.from(tracks).forEach((track, index) => { track.mode = subtitles[index]?.url === captionUrl ? "showing" : "disabled"; });
  }

  useEffect(syncCaptions, [captionUrl, subtitles]);

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
    <video ref={videoRef} className="c-player" controls playsInline crossOrigin="anonymous" preload="metadata" onLoadedMetadata={syncCaptions} onError={() => setError("Video could not load. Try another quality.")} onLoadedData={() => setError("")}>
      {subtitles.map((subtitle) => <track key={subtitle.url} kind="subtitles" label={subtitle.label} srcLang={subtitle.language || "und"} src={subtitle.url} />)}
    </video>
    <label className="c-caption-control"><span>CC · Subtitles</span><select aria-label="Subtitle language" value={captionUrl} onChange={(event) => {
      const next = event.target.value;
      setCaptionUrl(next);
      window.localStorage.setItem("cinema:subtitle-language", subtitles.find((item) => item.url === next)?.language.toLowerCase() || "off");
    }}><option value="off">Off</option>{subtitles.map((subtitle) => <option key={subtitle.url} value={subtitle.url}>{subtitle.label}</option>)}</select></label>
    {error && <p role="alert" className="z-msg bad">{error}</p>}
  </div>;
}
