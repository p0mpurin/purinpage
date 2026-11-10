"use client";

import { useEffect, useRef, useState } from "react";

type Subtitle = { label: string; url: string; language: string };
type Quality = { label: string; url: string };
type IconName = "play" | "pause" | "back" | "forward" | "volume" | "muted" | "settings" | "fullscreen";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none" /></>,
    back: <><path d="M12 4a8 8 0 1 0 8 8" /><path d="M12 1v4H8" /></>,
    forward: <><path d="M12 4a8 8 0 1 1-8 8" /><path d="M12 1v4h4" /></>,
    volume: <><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M17 9a5 5 0 0 1 0 6M19 6a9 9 0 0 1 0 12" /></>,
    muted: <><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="m17 9 5 6m0-6-5 6" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    fullscreen: <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}` : `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export default function CinemaVideo({ url, subtitles, title, poster, qualities = [], onQualityChange, cors = true }: {
  url: string; subtitles: Subtitle[]; title?: string; poster?: string | null;
  qualities?: Quality[]; onQualityChange?: (index: number) => void; cors?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const [error, setError] = useState("");
  const [captionUrl, setCaptionUrl] = useState("off");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("cinema:subtitle-language");
    const preferred = window.navigator.language.split("-")[0].toLowerCase();
    const chosen = saved === "off" ? null : subtitles.find((item) => item.language.toLowerCase() === saved)
      || subtitles.find((item) => item.language.toLowerCase() === preferred)
      || subtitles.find((item) => item.language.toLowerCase() === "en") || subtitles[0];
    setCaptionUrl(chosen?.url || "off");
  }, [subtitles]);

  useEffect(() => {
    const tracks = videoRef.current?.textTracks;
    if (tracks) Array.from(tracks).forEach((track, index) => { track.mode = subtitles[index]?.url === captionUrl ? "showing" : "disabled"; });
  }, [captionUrl, subtitles]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError("");
    setBuffered(0);
    if (!/\.m3u8(?:\?|$)/i.test(url)) {
      video.src = url;
      return () => { video.removeAttribute("src"); video.load(); };
    }
    let disposed = false;
    let destroy: (() => void) | undefined;
    import("hls.js").then(({ default: Hls }) => {
      if (disposed) return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = url;
      else if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) setError("This video could not load. Try another quality."); });
        destroy = () => hls.destroy();
      } else setError("This browser does not support this video format.");
    }).catch(() => setError("The video player could not load."));
    return () => { disposed = true; destroy?.(); video.removeAttribute("src"); video.load(); };
  }, [url]);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setError("Playback could not start. Try another quality."));
    else video.pause();
  }

  function seek(offset: number) {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + offset));
  }

  function changeQuality(index: number) {
    const video = videoRef.current;
    if (video) resumeRef.current = { time: video.currentTime || 0, playing: !video.paused };
    setSettingsOpen(false);
    onQualityChange?.(index);
  }

  function onMetadata() {
    const video = videoRef.current;
    if (!video) return;
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    video.playbackRate = speed;
    if (resumeRef.current) {
      const { time, playing: wasPlaying } = resumeRef.current;
      resumeRef.current = null;
      if (time > 0 && Number.isFinite(video.duration)) video.currentTime = Math.min(time, video.duration);
      if (wasPlaying) void video.play().catch(() => setError("Playback could not resume. Press play to try again."));
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") { setSettingsOpen(false); return; }
    if (event.target instanceof HTMLElement && event.target.closest("button, input, select")) return;
    if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); togglePlay(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); seek(-10); }
    if (event.key === "ArrowRight") { event.preventDefault(); seek(10); }
    if (event.key.toLowerCase() === "m") { event.preventDefault(); if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }
  }

  return <div ref={shellRef} className="c-player-shell" tabIndex={0} onKeyDown={onKeyDown} aria-label={`${title || "Cinema"} video player`}>
    <video ref={videoRef} className="c-player" playsInline crossOrigin={cors ? "anonymous" : undefined} preload="metadata" poster={poster || undefined}
      onClick={togglePlay} onDoubleClick={() => { if (!document.fullscreenElement) void shellRef.current?.requestFullscreen(); else void document.exitFullscreen(); }}
      onLoadedMetadata={onMetadata} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      onProgress={(event) => { const video = event.currentTarget; if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1)); }}
      onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
      onError={() => setError("Video could not load. Try another quality.")} onLoadedData={() => setError("")}>
      {subtitles.map((subtitle) => <track key={subtitle.url} kind="subtitles" label={subtitle.label} srcLang={subtitle.language || "und"} src={subtitle.url} />)}
    </video>
    <div className="c-player-top"><span className="c-player-brand">CINEMA <b>●</b></span>{title && <span className="c-player-title">{title}</span>}</div>
    {!playing && <button className="c-player-big-play" type="button" onClick={togglePlay} aria-label="Play video"><Icon name="play" /></button>}
    {error && <div className="c-player-error" role="alert">{error}</div>}
    <div className="c-player-controls">
      <div className="c-player-seek"><span className="c-player-buffer" style={{ width: `${duration ? buffered / duration * 100 : 0}%` }} /><input type="range" min={0} max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} aria-label="Seek video" aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`} onChange={(event) => { if (videoRef.current) videoRef.current.currentTime = Number(event.target.value); }} style={{ "--progress": `${duration ? currentTime / duration * 100 : 0}%` } as React.CSSProperties} /></div>
      <div className="c-player-actions">
        <div className="c-player-action-group"><button type="button" onClick={togglePlay} aria-label={playing ? "Pause video" : "Play video"}><Icon name={playing ? "pause" : "play"} /></button><button type="button" onClick={() => seek(-10)} aria-label="Back 10 seconds"><Icon name="back" /><small>10</small></button><button type="button" onClick={() => seek(10)} aria-label="Forward 10 seconds"><Icon name="forward" /><small>10</small></button><span className="c-player-time">{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span></div>
        <div className="c-player-action-group c-player-right"><button type="button" onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }} aria-label={muted ? "Unmute" : "Mute"}><Icon name={muted || volume === 0 ? "muted" : "volume"} /></button><input className="c-volume-range" type="range" min={0} max={1} step={0.05} value={volume} aria-label="Volume" onChange={(event) => { if (videoRef.current) { videoRef.current.volume = Number(event.target.value); videoRef.current.muted = false; } }} />
          <button type="button" onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Player settings" aria-expanded={settingsOpen}><Icon name="settings" /></button>
          <button type="button" onClick={() => { if (fullscreen) void document.exitFullscreen(); else void shellRef.current?.requestFullscreen(); }} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}><Icon name="fullscreen" /></button>
        </div>
      </div>
    </div>
    {settingsOpen && <div className="c-player-settings"><span className="c-player-settings-title">Playback settings</span>{qualities.length > 1 && <label>Quality<select value={url} onChange={(event) => changeQuality(qualities.findIndex((item) => item.url === event.target.value))}>{qualities.map((item) => <option key={item.url} value={item.url}>{item.label}</option>)}</select></label>}{qualities.length <= 1 && <span className="c-player-settings-note">Quality: Best available</span>}<label>Subtitles<select aria-label="Subtitle language" value={captionUrl} onChange={(event) => { const next = event.target.value; setCaptionUrl(next); window.localStorage.setItem("cinema:subtitle-language", subtitles.find((item) => item.url === next)?.language.toLowerCase() || "off"); }}><option value="off">Off</option>{subtitles.map((subtitle) => <option key={subtitle.url} value={subtitle.url}>{subtitle.label}</option>)}</select></label><label>Speed<select value={speed} onChange={(event) => { const next = Number(event.target.value); setSpeed(next); if (videoRef.current) videoRef.current.playbackRate = next; }}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value === 1 ? "Normal" : `${value}×`}</option>)}</select></label></div>}
  </div>;
}
