export interface SubtitleCue {
  id: number;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  startTimeStr: string;
  endTimeStr: string;
  text: string;
}

const AD_PATTERNS = [
  /opensubtitles/i,
  /subscene/i,
  /yify/i,
  /yts\.(mx|lt|am|ag)/i,
  /addic7ed/i,
  /1xbet/i,
  /betwinner/i,
  /promo\s*code/i,
  /downloaded\s*from/i,
  /synced\s*(and|&)\s*corrected\s*by/i,
  /subtitles?\s*by/i,
  /encoded\s*by/i,
  /ripped\s*by/i,
  /translated\s*by/i,
  /captioning\s*by/i,
  /support\s*us\s*and\s*become\s*vip/i,
  /advertisement/i,
  /https?:\/\/[^\s]+/i,
  /www\.[^\s]+/i,
];

function parseTimestamp(timeStr: string): number {
  const clean = timeStr.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return Math.round((minutes * 60 + seconds) * 1000);
  }
  return 0;
}

function formatTimestamp(ms: number, format: "srt" | "vtt" = "srt"): string {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const milliseconds = safeMs % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(milliseconds).padStart(3, "0");

  const sep = format === "srt" ? "," : ".";
  return `${hh}:${mm}:${ss}${sep}${mmm}`;
}

export function parseSubtitles(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);

  let currentId = 1;

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length === 0 || (lines.length === 1 && !lines[0])) continue;

    // Skip WebVTT header
    if (lines[0].startsWith("WEBVTT")) continue;

    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim().split(" ")[0]);

    const startTime = parseTimestamp(startRaw);
    const endTime = parseTimestamp(endRaw);

    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join("\n").trim();

    if (text) {
      cues.push({
        id: currentId++,
        startTime,
        endTime,
        startTimeStr: startRaw,
        endTimeStr: endRaw,
        text,
      });
    }
  }

  return cues;
}

export function shiftAndCleanSubtitles(
  cues: SubtitleCue[],
  offsetMs: number,
  cleanAds: boolean = true
): { cleanedCues: SubtitleCue[]; adsRemoved: number } {
  let adsRemoved = 0;
  const filtered: SubtitleCue[] = [];

  for (const cue of cues) {
    if (cleanAds) {
      const isAd = AD_PATTERNS.some((pattern) => pattern.test(cue.text));
      if (isAd) {
        adsRemoved++;
        continue;
      }
    }

    const newStart = Math.max(0, cue.startTime + offsetMs);
    const newEnd = Math.max(newStart + 100, cue.endTime + offsetMs);

    filtered.push({
      id: filtered.length + 1,
      startTime: newStart,
      endTime: newEnd,
      startTimeStr: formatTimestamp(newStart, "srt"),
      endTimeStr: formatTimestamp(newEnd, "srt"),
      text: cue.text,
    });
  }

  return { cleanedCues: filtered, adsRemoved };
}

export function exportSubtitlesString(cues: SubtitleCue[], format: "srt" | "vtt" = "srt"): string {
  if (format === "vtt") {
    let out = "WEBVTT\n\n";
    cues.forEach((cue, i) => {
      const start = formatTimestamp(cue.startTime, "vtt");
      const end = formatTimestamp(cue.endTime, "vtt");
      out += `${i + 1}\n${start} --> ${end}\n${cue.text}\n\n`;
    });
    return out.trim();
  }

  // SRT Format
  let out = "";
  cues.forEach((cue, i) => {
    const start = formatTimestamp(cue.startTime, "srt");
    const end = formatTimestamp(cue.endTime, "srt");
    out += `${i + 1}\n${start} --> ${end}\n${cue.text}\n\n`;
  });
  return out.trim();
}
