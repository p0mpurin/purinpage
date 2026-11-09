"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PageHead from "@/components/zine/PageHead";
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
  { id: "torrent", label: "Magnet Inspector" },
  { id: "doh", label: "Blocked Site Check" },
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

  const stepLabel = (ms: number) =>
    `${ms > 0 ? "+" : "−"}${Math.abs(ms) >= 1000 ? `${Math.abs(ms) / 1000}s` : `${Math.abs(ms)}ms`}`;

  return (
    <main className="z-page">
      <div className="z-wrap z-pad">
        <PageHead
          kanji="道具"
          romaji="Dōgu / Toolkit"
          title="Tools"
          deck="Small fixes for subtitles, links, magnets and blocked sites. Everything runs in your browser except the DNS check."
        />

        <div className="z-tabs" role="tablist" aria-label="Tools">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "subtitles" && (
          <section className="z-panel" role="tabpanel">
            <header>
              <span className="c-no">SRT + VTT</span>
              <h2>Subtitle fixer</h2>
              <p>Shift out-of-sync timing, strip gambling and watermark ads, and convert between SRT and VTT.</p>
            </header>

            <input
              ref={fileInputRef}
              id="subtitle-file"
              type="file"
              accept=".srt,.vtt,.ass,.txt"
              onChange={handleFileUpload}
              hidden
            />
            <button type="button" className="z-drop" onClick={() => fileInputRef.current?.click()}>
              <b>{rawCues.length > 0 ? `${subFileName} · ${rawCues.length} lines` : "Choose a subtitle file"}</b>
              <small>{rawCues.length > 0 ? "Click to pick a different file" : ".srt, .vtt or plain text"}</small>
            </button>

            {rawCues.length > 0 && (
              <div className="z-box">
                <div className="z-box-row">
                  <div>
                    <span className="z-label">Timing offset</span>
                    <div className="z-value">
                      {offsetMs > 0 ? `+${offsetMs}` : offsetMs}ms ({(offsetMs / 1000).toFixed(2)}s)
                    </div>
                  </div>
                  <button type="button" className="z-link-btn" onClick={() => handleApplySubChanges(0, cleanAds)}>
                    Reset to 0
                  </button>
                </div>
                <div className="z-btn-row">
                  {[-1000, -500, -100, 100, 500, 1000].map((step) => (
                    <button
                      key={step}
                      type="button"
                      className="z-btn ghost small"
                      onClick={() => handleApplySubChanges(offsetMs + step, cleanAds)}
                    >
                      {stepLabel(step)}
                    </button>
                  ))}
                </div>
                <div className="z-box-row">
                  <label className="z-check" htmlFor="clean-ads">
                    <input
                      id="clean-ads"
                      type="checkbox"
                      checked={cleanAds}
                      onChange={(e) => handleApplySubChanges(offsetMs, e.target.checked)}
                    />
                    Remove ad lines ({adsCount} removed)
                  </label>
                  <div className="z-btn-row">
                    <select
                      id="export-format"
                      className="z-select"
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as "srt" | "vtt")}
                      aria-label="File format"
                    >
                      <option value="srt">.srt</option>
                      <option value="vtt">.vtt</option>
                    </select>
                    <button type="button" className="z-btn" onClick={handleDownloadSub}>
                      Download
                    </button>
                  </div>
                </div>
                <div className="z-cues">
                  {processedCues.slice(0, 15).map((cue) => (
                    <div key={cue.id}>
                      <span>#{cue.id}</span>
                      <span>
                        {cue.startTimeStr} → {cue.endTimeStr}
                      </span>
                      <span>{cue.text}</span>
                    </div>
                  ))}
                  {processedCues.length > 15 && <p>…and {processedCues.length - 15} more lines</p>}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "cleaner" && (
          <section className="z-panel" role="tabpanel">
            <header>
              <span className="c-no">40+ TRACKERS</span>
              <h2>Link cleaner</h2>
              <p>Paste a messy link. Tracking tags, affiliate IDs and redirect wrappers are removed as you type.</p>
            </header>
            <label className="z-field" htmlFor="dirty-url">
              <span>Messy link</span>
              <textarea
                id="dirty-url"
                rows={3}
                className="z-input mono"
                placeholder="https://twitter.com/user/status/12345?s=20&t=abcdef123&utm_source=share"
                value={dirtyUrl}
                onChange={(e) => handleCleanUrl(e.target.value)}
              />
            </label>
            {cleanedUrl && (
              <div className="z-box">
                <div className="z-box-row">
                  <span className="z-label">
                    Clean link · {strippedCount} {strippedCount === 1 ? "tracker" : "trackers"} removed
                  </span>
                  <button type="button" className="z-btn small" onClick={handleCopyCleaned}>
                    {copiedCleaner ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="z-out">{cleanedUrl}</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "torrent" && (
          <section className="z-panel" role="tabpanel">
            <header>
              <span className="c-no">P2P</span>
              <h2>Magnet inspector</h2>
              <p>See a magnet link&apos;s name and hash, then open it in a browser player or a debrid service.</p>
            </header>
            <label className="z-field" htmlFor="magnet-input">
              <span>Magnet link</span>
              <textarea
                id="magnet-input"
                rows={3}
                className="z-input mono"
                placeholder="magnet:?xt=urn:btih:d6b6e4d588523c9213...&dn=Sample.Movie.1080p&tr=..."
                value={magnetInput}
                onChange={(e) => handleParseMagnet(e.target.value)}
              />
            </label>
            {parsedMagnetInfo && (
              <div className="z-box">
                <div className="z-box-row">
                  <div>
                    <span className="z-label">Torrent name</span>
                    <div className="z-value">{parsedMagnetInfo.name}</div>
                  </div>
                  <button type="button" className="z-btn ghost small" onClick={handleCopyHash}>
                    {copiedMagnet
                      ? "Hash copied"
                      : parsedMagnetInfo.hash
                        ? `Copy hash · ${parsedMagnetInfo.hash.slice(0, 8)}…`
                        : "Copy hash"}
                  </button>
                </div>
                <div className="z-btn-row">
                  <a
                    className="z-btn"
                    href={`https://webtorrent.io/free-torrents#${encodeURIComponent(streamMagnet)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in WebTorrent ↗
                  </a>
                  <a className="z-btn ghost" href="https://real-debrid.com/torrents" target="_blank" rel="noopener noreferrer">
                    Real-Debrid ↗
                  </a>
                  <a className="z-btn ghost" href="https://torbox.app" target="_blank" rel="noopener noreferrer">
                    TorBox ↗
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "doh" && (
          <section className="z-panel" role="tabpanel">
            <header>
              <span className="c-no">DNS OVER HTTPS</span>
              <h2>Blocked site check</h2>
              <p>
                Find out whether your internet provider is blocking a site by looking it up through Cloudflare, Google,
                Quad9 and AdGuard.
              </p>
            </header>
            <form onSubmit={handleTestDoh} className="z-inline-form">
              <label className="z-field" htmlFor="doh-domain">
                <span>Site address</span>
                <input
                  id="doh-domain"
                  type="text"
                  className="z-input mono"
                  placeholder="1337x.to"
                  value={dohDomain}
                  onChange={(e) => setDohDomain(e.target.value)}
                />
              </label>
              <button type="submit" className="z-btn" disabled={testingDoh || !dohDomain.trim()}>
                {testingDoh ? "Checking…" : "Check"}
              </button>
            </form>

            {dohResults && (
              <div className="z-box">
                <div className="z-box-row">
                  <div>
                    <span className="z-label">Checked</span>
                    <div className="z-value">{dohResults.domain}</div>
                  </div>
                  <span className={`z-badge ${dohResults.isDomainActive ? "good" : "bad"}`}>
                    {dohResults.isDomainActive ? "Resolves worldwide" : "Not resolving anywhere"}
                  </span>
                </div>
                <div className="z-results">
                  {dohResults.results.map((r) => (
                    <div key={r.provider}>
                      <div className="z-box-row">
                        <b>{r.provider}</b>
                        <span className={`z-badge ${r.success ? "good" : "bad"}`}>
                          {r.status} · {r.latency}
                        </span>
                      </div>
                      <code>{r.ips.length ? r.ips.join(", ") : "No addresses"}</code>
                    </div>
                  ))}
                </div>
                {dohResults.isDomainActive && (
                  <div className="z-tip">
                    <b>If it still won&apos;t open</b>
                    <span>
                      Your provider is probably blocking it. Set your device or router DNS to <code>1.1.1.1</code>{" "}
                      (Cloudflare), or turn on Secure DNS in your browser settings.
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <Link href="/" className="z-foot-link">
          ← Contents
        </Link>
      </div>
    </main>
  );
}
