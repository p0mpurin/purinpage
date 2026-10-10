"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  parseSubtitles,
  shiftAndCleanSubtitles,
  exportSubtitlesString,
  type SubtitleCue,
} from "@/lib/subtitleUtils";

// Known tracking parameters to strip
const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "fbclid", "gclid", "gclsrc", "dclid", "zanpid", "msclkid",
  "si", "igshid", "igsh", "ref", "ref_src", "ref_url", "feature", "tracking_id",
  "spm", "scm", "pvid", "_hsenc", "_hsmi", "mc_cid", "mc_eid",
  "wickedid", "twclid", "yclid", "ysclid", "_openstat", "rb_clickid",
  "s_kwcid", "s_cid", "trk", "trkCampaign", "sc_campaign", "sc_channel",
  "wprid", "ncid", "guccounter", "share_id", "source", "adgrpid", "campaignid"
]);

type ToolTab = "subtitles" | "cleaner" | "torrent" | "doh";

const TABS: { id: ToolTab; label: string }[] = [
  { id: "subtitles", label: "Subtitle Fixer" },
  { id: "cleaner", label: "Link Cleaner" },
  { id: "torrent", label: "Magnet Stream" },
  { id: "doh", label: "DNS Bypass" },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("subtitles");

  // --- Tool 2: Subtitle Sync & Ad Cleaner State ---
  const [subContent, setSubContent] = useState("");
  const [rawCues, setRawCues] = useState<SubtitleCue[]>([]);
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [cleanAds, setCleanAds] = useState(true);
  const [exportFormat, setExportFormat] = useState<"srt" | "vtt">("srt");
  const [processedCues, setProcessedCues] = useState<SubtitleCue[]>([]);
  const [adsCount, setAdsCount] = useState(0);
  const [subFileName, setSubFileName] = useState("subtitles");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubFileName(file.name.replace(/\.(srt|vtt|ass)$/i, ""));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        setSubContent(text);
        const parsed = parseSubtitles(text);
        setRawCues(parsed);
        const { cleanedCues, adsRemoved } = shiftAndCleanSubtitles(parsed, offsetMs, cleanAds);
        setProcessedCues(cleanedCues);
        setAdsCount(adsRemoved);
      }
    };
    reader.readAsText(file);
  };

  const handleApplySubChanges = (newOffset: number, newCleanAds: boolean) => {
    setOffsetMs(newOffset);
    setCleanAds(newCleanAds);
    if (rawCues.length > 0) {
      const { cleanedCues, adsRemoved } = shiftAndCleanSubtitles(rawCues, newOffset, newCleanAds);
      setProcessedCues(cleanedCues);
      setAdsCount(adsRemoved);
    }
  };

  const handleDownloadSub = () => {
    if (processedCues.length === 0) return;
    const outputText = exportSubtitlesString(processedCues, exportFormat);
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subFileName}_synced.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Tool 3: Privacy Link Cleaner State ---
  const [dirtyUrl, setDirtyUrl] = useState("");
  const [cleanedUrl, setCleanedUrl] = useState("");
  const [strippedCount, setStrippedCount] = useState(0);
  const [copiedCleaner, setCopiedCleaner] = useState(false);

  const handleCleanUrl = (input: string) => {
    setDirtyUrl(input);
    if (!input.trim()) {
      setCleanedUrl("");
      setStrippedCount(0);
      return;
    }

    try {
      let raw = input.trim();
      if (raw.includes("l.facebook.com/l.php") || raw.includes("google.com/url")) {
        const parsedWrapper = new URL(raw);
        const target = parsedWrapper.searchParams.get("u") || parsedWrapper.searchParams.get("q");
        if (target) raw = decodeURIComponent(target);
      }

      const parsed = new URL(raw);
      let removed = 0;

      const keysToDelete: string[] = [];
      parsed.searchParams.forEach((_, key) => {
        if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((k) => {
        parsed.searchParams.delete(k);
        removed++;
      });

      const clean = parsed.toString();
      setCleanedUrl(clean);
      setStrippedCount(removed);
    } catch {
      let clean = input;
      let removed = 0;
      TRACKING_PARAMS.forEach((param) => {
        const regex = new RegExp(`([&?])${param}=[^&]*`, "gi");
        if (regex.test(clean)) {
          clean = clean.replace(regex, "");
          removed++;
        }
      });
      clean = clean.replace(/\?&/g, "?").replace(/&&/g, "&").replace(/[?&]$/, "");
      setCleanedUrl(clean);
      setStrippedCount(removed);
    }
  };

  const handleCopyCleaned = () => {
    if (!cleanedUrl) return;
    navigator.clipboard.writeText(cleanedUrl);
    setCopiedCleaner(true);
    setTimeout(() => setCopiedCleaner(false), 2000);
  };

  // --- Tool 4: WebTorrent & Magnet Streamer State ---
  const [magnetInput, setMagnetInput] = useState("");
  const [streamMagnet, setStreamMagnet] = useState("");
  const [parsedMagnetInfo, setParsedMagnetInfo] = useState<{ name?: string; hash?: string; trackers: string[] } | null>(null);
  const [copiedMagnet, setCopiedMagnet] = useState(false);

  const handleParseMagnet = (raw: string) => {
    setMagnetInput(raw);
    const trimmed = raw.trim();
    if (!trimmed || !trimmed.startsWith("magnet:?")) {
      setParsedMagnetInfo(null);
      setStreamMagnet("");
      return;
    }

    try {
      const parsed = new URL(trimmed);
      const xt = parsed.searchParams.get("xt") || "";
      const dn = parsed.searchParams.get("dn") || "Torrent Stream";
      const tr = parsed.searchParams.getAll("tr") || [];
      const hash = xt.replace(/^urn:btih:/i, "");

      setParsedMagnetInfo({
        name: decodeURIComponent(dn).replace(/\+/g, " "),
        hash: hash.toUpperCase(),
        trackers: tr.map((t) => decodeURIComponent(t)),
      });
      setStreamMagnet(trimmed);
    } catch {
      // ignore
    }
  };

  const handleCopyHash = () => {
    if (!parsedMagnetInfo?.hash) return;
    navigator.clipboard.writeText(parsedMagnetInfo.hash);
    setCopiedMagnet(true);
    setTimeout(() => setCopiedMagnet(false), 2000);
  };

  // --- Tool 5: DoH & ISP Bypass Tester State ---
  const [dohDomain, setDohDomain] = useState("1337x.to");
  const [testingDoh, setTestingDoh] = useState(false);
  const [dohResults, setDohResults] = useState<{
    domain: string;
    isDomainActive: boolean;
    results: Array<{ provider: string; status: string; latency: string; ips: string[]; success: boolean }>;
  } | null>(null);

  const handleTestDoh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dohDomain.trim()) return;

    setTestingDoh(true);
    setDohResults(null);

    try {
      const res = await fetch("/api/tools/doh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: dohDomain.trim() }),
      });
      const data = await res.json();
      setDohResults(data);
    } catch {
      // ignore
    } finally {
      setTestingDoh(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full px-4 pb-20 pt-4 sm:px-8 md:px-12 md:pt-6">
      
      {/* Background Soft Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-16 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--accent-pink)] opacity-[0.06] blur-[140px]"
        aria-hidden
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        
        {/* Futuristic Header & Cyber Tab Navigation */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--wired-grid)] pb-5">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[var(--accent-pink)] opacity-90">
                [SYS.UTILITIES // SUITE]
              </span>
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-white text-shadow-pink sm:text-3xl">
              Power Tools
            </h1>
          </div>

          {/* Cyber Tab Switcher */}
          <nav className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#0c0a14]/80 p-1.5 backdrop-blur-xl shadow-lg scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] shadow-[0_0_15px_var(--bubble-glow-subtle)] border border-[var(--border)]"
                    : "text-[var(--text-main)] hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Tab 2: Subtitle Sync & Ad Cleaner */}
        {activeTab === "subtitles" && (
          <div className="glass-card-dream flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[#09070e]/90 p-6 sm:p-8 shadow-2xl">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.62rem] font-bold uppercase text-[var(--accent-pink)]">
                  [TIMING & FILTER // SRT + VTT]
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Subtitle Synchronizer & Ad Cleaner
              </h2>
              <p className="text-xs text-[var(--text-main)] opacity-75">
                Fix out-of-sync audio timing, strip gambling & site watermark ads, and convert between SRT and VTT formats.
              </p>
            </div>

            {/* Drop Zone / Upload Button */}
            <div className="flex flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".srt,.vtt,.ass,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-black/40 p-8 text-center transition-all hover:border-[var(--accent-pink)] hover:bg-[var(--accent-pink)]/5 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-pink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  {rawCues.length > 0 ? `Loaded: ${subFileName} (${rawCues.length} Cues)` : "Drop or Click to Upload .SRT / .VTT Subtitle"}
                </p>
                <p className="font-mono text-[0.68rem] text-[var(--text-main)] opacity-60">
                  Supports .srt, .vtt, and text files
                </p>
              </div>

              {/* Subtitle Controls */}
              {rawCues.length > 0 && (
                <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-black/60 p-5 text-left">
                  
                  {/* Offset & Timing Sliders / Buttons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase text-white">
                        Timing Offset: {offsetMs > 0 ? `+${offsetMs}ms` : `${offsetMs}ms`} ({(offsetMs / 1000).toFixed(2)}s)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(0, cleanAds)}
                        className="font-mono text-[0.68rem] text-[var(--accent-pink)] hover:underline cursor-pointer"
                      >
                        Reset Offset (0ms)
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(offsetMs - 1000, cleanAds)}
                        className="rounded-lg border border-[var(--border)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white hover:border-[var(--accent-pink)] cursor-pointer"
                      >
                        -1.0s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(offsetMs - 500, cleanAds)}
                        className="rounded-lg border border-[var(--border)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white hover:border-[var(--accent-pink)] cursor-pointer"
                      >
                        -500ms
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(offsetMs - 100, cleanAds)}
                        className="rounded-lg border border-[var(--border)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white hover:border-[var(--accent-pink)] cursor-pointer"
                      >
                        -100ms
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(offsetMs + 100, cleanAds)}
                        className="rounded-lg border border-[var(--border)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white hover:border-[var(--accent-pink)] cursor-pointer"
                      >
                        +100ms
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(offsetMs + 500, cleanAds)}
                        className="rounded-lg border border-[var(--border)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white hover:border-[var(--accent-pink)] cursor-pointer"
                      >
                        +500ms
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySubChanges(offsetMs + 1000, cleanAds)}
                        className="rounded-lg border border-[var(--border)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white hover:border-[var(--accent-pink)] cursor-pointer"
                      >
                        +1.0s
                      </button>
                    </div>
                  </div>

                  {/* Ad Cleaning & Export Format */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--wired-grid)] pt-4">
                    <label className="flex items-center gap-2 font-mono text-xs text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cleanAds}
                        onChange={(e) => handleApplySubChanges(offsetMs, e.target.checked)}
                        className="h-4 w-4 accent-[var(--accent-pink)] rounded cursor-pointer"
                      />
                      <span>Auto-Strip Ad Watermarks ({adsCount} removed)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/80">Format:</span>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as "srt" | "vtt")}
                        className="rounded-lg border border-[var(--border)] bg-black px-2.5 py-1 font-mono text-xs text-white focus:outline-none"
                      >
                        <option value="srt">.SRT (Standard)</option>
                        <option value="vtt">.VTT (Web Video)</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleDownloadSub}
                        className="rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)] px-4 py-1.5 font-mono text-xs font-bold uppercase text-black hover:bg-white transition-all cursor-pointer"
                      >
                        Export & Download ↗
                      </button>
                    </div>
                  </div>

                  {/* Subtitle Cue Preview */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--wired-grid)] bg-black/40 p-3 font-mono text-xs text-white/80 space-y-2">
                    {processedCues.slice(0, 15).map((cue) => (
                      <div key={cue.id} className="flex gap-3 border-b border-white/5 pb-1.5">
                        <span className="text-[var(--accent-pink)] opacity-70">#{cue.id}</span>
                        <span className="text-white/40">{cue.startTimeStr} → {cue.endTimeStr}</span>
                        <span className="truncate text-white flex-1">{cue.text}</span>
                      </div>
                    ))}
                    {processedCues.length > 15 && (
                      <p className="text-center text-[0.65rem] text-[var(--text-main)] opacity-50 pt-1">
                        ...and {processedCues.length - 15} more cues
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Privacy Link Cleaner & Tracker Stripper */}
        {activeTab === "cleaner" && (
          <div className="glass-card-dream flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[#09070e]/90 p-6 sm:p-8 shadow-2xl">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.62rem] font-bold uppercase text-[var(--accent-pink)]">
                  [PRIVACY // 40+ PARAMS]
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Privacy Link Cleaner & Tracker Stripper
              </h2>
              <p className="text-xs text-[var(--text-main)] opacity-75">
                Strips tracking telemetry, analytics, affiliate IDs, and redirect wrappers from messy URLs.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-xs font-semibold uppercase text-white/80 mb-2 text-left">
                  Paste Bloated URL
                </label>
                <textarea
                  rows={3}
                  placeholder="https://twitter.com/user/status/12345?s=20&t=abcdef123&utm_source=share..."
                  value={dirtyUrl}
                  onChange={(e) => handleCleanUrl(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-black/60 p-3.5 font-mono text-xs text-white placeholder:text-white/30 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-pink)]"
                />
              </div>

              {cleanedUrl && (
                <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-black/50 p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[var(--accent-pink)]">
                      Cleaned URL ({strippedCount} Trackers Removed)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCleaned}
                      className="rounded-lg border border-[var(--border)] bg-[var(--accent-pink)]/20 px-3 py-1 font-mono text-xs font-bold text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition-all cursor-pointer"
                    >
                      {copiedCleaner ? "Copied" : "Copy Clean URL"}
                    </button>
                  </div>
                  <p className="break-all font-mono text-xs text-white bg-black/60 p-3 rounded-xl border border-white/10">
                    {cleanedUrl}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: In-Browser WebTorrent & Magnet Streamer */}
        {activeTab === "torrent" && (
          <div className="glass-card-dream flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[#09070e]/90 p-6 sm:p-8 shadow-2xl">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.62rem] font-bold uppercase text-[var(--accent-pink)]">
                  [P2P // DEBRID & TORBOX]
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Magnet Link Inspector & Streamer
              </h2>
              <p className="text-xs text-[var(--text-main)] opacity-75">
                Inspect magnet infohashes, file titles, trackers, or open directly in WebTorrent players.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-xs font-semibold uppercase text-white/80 mb-2 text-left">
                  Paste Magnet Link (magnet:?xt=urn:btih:...)
                </label>
                <textarea
                  rows={3}
                  placeholder="magnet:?xt=urn:btih:d6b6e4d588523c9213...&dn=Sample.Movie.1080p&tr=..."
                  value={magnetInput}
                  onChange={(e) => handleParseMagnet(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-black/60 p-3.5 font-mono text-xs text-white placeholder:text-white/30 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-pink)]"
                />
              </div>

              {parsedMagnetInfo && (
                <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-black/50 p-5 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--wired-grid)] pb-3">
                    <div>
                      <span className="font-mono text-[0.65rem] uppercase text-[var(--accent-pink)]">
                        Torrent Name
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {parsedMagnetInfo.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="shrink-0 rounded-lg border border-[var(--border)] bg-black/60 px-3 py-1.5 font-mono text-xs text-white hover:border-[var(--accent-pink)] hover:text-[var(--accent-pink)] transition-colors cursor-pointer"
                    >
                      {copiedMagnet ? "Copied Hash" : parsedMagnetInfo.hash ? `Hash: ${parsedMagnetInfo.hash.slice(0, 10)}...` : "Copy Hash"}
                    </button>
                  </div>

                  {/* Web Launchers */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`https://webtorrent.io/free-torrents#${encodeURIComponent(streamMagnet)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[var(--border)] bg-[var(--accent-pink)]/15 px-4 py-2 font-mono text-xs font-bold text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition-all no-underline"
                    >
                      Launch in WebTorrent Player ↗
                    </a>
                    <a
                      href={`https://real-debrid.com/torrents`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[var(--border)] bg-black/60 px-4 py-2 font-mono text-xs text-white/80 hover:border-white hover:text-white transition-all no-underline"
                    >
                      Open Real-Debrid ↗
                    </a>
                    <a
                      href={`https://torbox.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[var(--border)] bg-black/60 px-4 py-2 font-mono text-xs text-white/80 hover:border-white hover:text-white transition-all no-underline"
                    >
                      Open TorBox ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: ISP Block & DNS-over-HTTPS Tester */}
        {activeTab === "doh" && (
          <div className="glass-card-dream flex flex-col gap-6 rounded-3xl border border-[var(--border)] bg-[#09070e]/90 p-6 sm:p-8 shadow-2xl">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.62rem] font-bold uppercase text-[var(--accent-pink)]">
                  [NETWORK // DOH RESOLUTION]
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                ISP Block & DNS Bypass Tester
              </h2>
              <p className="text-xs text-[var(--text-main)] opacity-75">
                Tests if a site is blocked or DNS-poisoned by your local ISP across Cloudflare, Google, Quad9, and AdGuard.
              </p>
            </div>

            <form onSubmit={handleTestDoh} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter domain (e.g. 1337x.to, thepiratebay.org, aniwave.to)..."
                value={dohDomain}
                onChange={(e) => setDohDomain(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-black/60 px-4 py-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-pink)]"
              />
              <button
                type="submit"
                disabled={testingDoh || !dohDomain.trim()}
                className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--accent-pink)] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black shadow-[0_0_15px_var(--bubble-glow-subtle)] transition-all hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                {testingDoh ? "Testing DNS..." : "Test DNS"}
              </button>
            </form>

            {/* DoH Results Grid */}
            {dohResults && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-[var(--wired-grid)] pb-3">
                  <div>
                    <span className="font-mono text-xs text-[var(--text-main)] opacity-60">Domain Tested:</span>
                    <p className="font-mono text-sm font-bold text-white">{dohResults.domain}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${
                      dohResults.isDomainActive
                        ? "bg-green-500/20 text-green-300 border border-green-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                    }`}
                  >
                    {dohResults.isDomainActive ? "Resolvable Globally" : "Domain Inactive / Dead"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dohResults.results.map((r, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[var(--wired-grid)] bg-black/40 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-white">
                          {r.provider}
                        </span>
                        <span
                          className={`font-mono text-[0.65rem] px-2 py-0.5 rounded ${
                            r.success
                              ? "bg-green-500/10 text-green-300 border border-green-500/30"
                              : "bg-red-500/10 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {r.status} ({r.latency})
                        </span>
                      </div>
                      <p className="truncate font-mono text-[0.68rem] text-[var(--text-main)] opacity-70">
                        IPs: {r.ips.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>

                {dohResults.isDomainActive && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-pink)]/10 p-3.5 text-xs text-[var(--foreground)]">
                    <p className="font-bold text-[var(--accent-pink)] mb-1">[DNS Bypass Tip]:</p>
                    If this site does not open on your device but shows <span className="text-green-300 font-mono">Resolved</span> above, your ISP is censoring it. Set your router/device DNS to <span className="font-mono text-white">1.1.1.1</span> (Cloudflare) or enable <span className="font-mono text-white">Secure DNS (DoH)</span> in your browser settings to bypass the block instantly.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back Shortcut */}
        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="rounded-xl border border-[var(--border)] bg-black/40 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-pink)] shadow-sm transition-all hover:bg-[var(--accent-pink)] hover:text-black no-underline"
          >
            ← Return to Hub
          </Link>
        </div>

      </div>
    </div>
  );
}
