/**
 * Pulls the starred (⭐ / 🌟) picks from the FMHY wiki markdown and writes them to
 * src/lib/fmhy-links.ts, grouped by site category slug and FMHY section.
 *
 * Source: https://github.com/fmhy/edit (docs/*.md)
 *
 * Usage (from purinpage/):  npm run sync-fmhy
 * Offline / local copy:     npm run sync-fmhy -- --from path/to/docs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAW_BASE = "https://raw.githubusercontent.com/fmhy/edit/main/docs";
const OUT_FILE = join(__dirname, "..", "src", "lib", "fmhy-links.ts");

/** Processing order also decides section order inside categories fed by several pages. */
const PAGES = [
  "video",
  "torrenting",
  "video-tools",
  "audio",
  "reading",
  "gaming",
  "gaming-tools",
  "downloading",
  "privacy",
  "ai",
  "mobile",
  "system-tools",
  "linux-macos",
  "file-tools",
  "internet-tools",
  "social-media-tools",
  "text-tools",
  "image-tools",
  "developer-tools",
  "educational",
  "misc",
];

/** [page, h1, h2, slug] — first match wins, "*" matches anything. */
const RULES: Array<[string, string, string, string]> = [
  ["video", "Specialty Streaming", "Anime Streaming", "anime"],
  ["video", "Download Sites", "Anime Downloading", "anime"],
  ["video", "Tracking / Databases", "Anime Tracking / Databases", "anime"],
  ["video", "Specialty Streaming", "Drama Streaming", "asian-drama"],
  ["video", "Live TV / Sports", "*", "streaming"],
  ["video", "Torrent Sites", "*", "torrents"],
  ["video", "Torrent Apps", "*", "torrents"],
  ["video", "*", "*", "movies"],
  ["torrenting", "*", "*", "torrents"],
  ["video-tools", "*", "*", "video-tools"],
  ["audio", "*", "*", "music"],
  ["reading", "Visual Media", "Manga", "manga"],
  ["reading", "Book Tracking / Databases", "Manga Tracking / Databases", "manga"],
  ["reading", "Curated Recommendations", "Manga Recommendations", "manga"],
  ["reading", "Special Interest", "Light Novels", "manga"],
  ["reading", "Visual Media", "Comics", "comics"],
  ["reading", "Book Tracking / Databases", "Comic Tracking / Databases", "comics"],
  ["reading", "Curated Recommendations", "Comic Recommendations", "comics"],
  ["reading", "*", "*", "books"],
  ["gaming", "Browser Games", "*", "browser-games"],
  ["gaming", "Puzzle Games", "*", "browser-games"],
  ["gaming", "Tabletop Games", "*", "browser-games"],
  ["gaming", "*", "*", "games"],
  ["gaming-tools", "*", "*", "game-tools"],
  ["downloading", "Software Sites", "*", "software"],
  ["downloading", "*", "*", "piracy"],
  ["privacy", "Adblocking", "*", "adblockers"],
  ["privacy", "VPN", "*", "vpn"],
  ["privacy", "Proxy", "*", "vpn"],
  ["privacy", "*", "*", "privacy"],
  ["ai", "*", "*", "ai"],
  ["mobile", "*", "*", "mobile"],
  ["system-tools", "*", "*", "software"],
  ["linux-macos", "*", "*", "linux"],
  ["file-tools", "*", "*", "files"],
  ["internet-tools", "*", "*", "tools"],
  ["social-media-tools", "*", "*", "social"],
  ["text-tools", "*", "*", "text"],
  ["image-tools", "*", "*", "design"],
  ["developer-tools", "*", "*", "dev"],
  ["educational", "*", "*", "learning"],
  ["misc", "*", "*", "misc"],
];

/** Description tokens that are just community / meta links, not useful on a card. */
const NOISE_TOKEN =
  /^(discord|telegram|status|subreddit|github|gitlab|invite|forum|twitter|x|mastodon|reddit|matrix|wiki|guide|mirrors?|changelog|donate|patreon|ko-fi|bluesky|codeberg|sourceforge|note|issues|faq|support|android|ios)$/i;

const MAX_DESCRIPTION = 140;

type Entry = { name: string; url: string; section: string; description?: string };

function stripLinks(md: string): string {
  return md.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

function cleanHeading(line: string): string {
  return stripLinks(line.replace(/^#+\s*/, "").replace(/^[►▷]\s*/, "")).trim();
}

function matchRule(page: string, h1: string, h2: string): string | null {
  for (const [p, r1, r2, slug] of RULES) {
    if (p === page && (r1 === "*" || r1 === h1) && (r2 === "*" || r2 === h2)) return slug;
  }
  return null;
}

function isUsableUrl(url: string): boolean {
  if (!/^https?:\/\//.test(url)) return false;
  if (url.includes("reddit.com/r/FREEMEDIAHECKYEAH")) return false;
  if (/(^|\.)fmhy\.(net|pages\.dev)\//.test(url.replace(/^https?:\/\//, ""))) return false;
  if (url.includes("FMHYB64")) return false;
  return true;
}

function cleanDescription(rest: string): string | undefined {
  const tokens = stripLinks(rest)
    .replace(/[*`_]/g, "")
    .split(/\s+\/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && !NOISE_TOKEN.test(t));
  let text = tokens.join(" / ").trim();
  if (!text) return undefined;
  if (text.length > MAX_DESCRIPTION) text = `${text.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`;
  return text;
}

/** `* ⭐ **[Name](url)**, [2](url2) or [Alt](url3) - Description / [Discord](...)` */
function parseEntry(line: string): { name: string; url: string; description?: string } | null {
  const m = line.match(/^\*\s+(?:⭐|🌟)\s+\*\*\[([^\]]+)\]\(([^)\s]+)\)\*\*(.*)$/u);
  if (!m) return null;
  const [, rawName, url, tail] = m;
  if (!isUsableUrl(url)) return null;
  const name = rawName.replace(/[.\s]+$/, "").trim();
  if (!name) return null;
  const dash = tail.indexOf(" - ");
  return { name, url, description: dash >= 0 ? cleanDescription(tail.slice(dash + 3)) : undefined };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url;
  }
}

async function loadPage(page: string, fromDir: string | null): Promise<string> {
  if (fromDir) return readFileSync(join(fromDir, `${page}.md`), "utf8");
  const res = await fetch(`${RAW_BASE}/${page}.md`);
  if (!res.ok) throw new Error(`Failed to fetch ${page}.md: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const fromIdx = process.argv.indexOf("--from");
  const fromDir = fromIdx >= 0 ? process.argv[fromIdx + 1] : null;

  const bySlug = new Map<string, Entry[]>();
  const seen = new Map<string, Set<string>>();
  const unmapped = new Set<string>();

  for (const page of PAGES) {
    const md = await loadPage(page, fromDir);
    let h1 = "";
    let h2 = "";
    for (const line of md.split(/\r?\n/)) {
      if (line.startsWith("# ")) {
        h1 = cleanHeading(line);
        h2 = "";
        continue;
      }
      if (line.startsWith("## ")) {
        h2 = cleanHeading(line);
        continue;
      }
      const entry = parseEntry(line);
      if (!entry) continue;

      const slug = matchRule(page, h1, h2);
      if (!slug) {
        unmapped.add(`${page} | ${h1} | ${h2}`);
        continue;
      }
      const key = normalizeUrl(entry.url);
      const slugSeen = seen.get(slug) ?? new Set<string>();
      seen.set(slug, slugSeen);
      if (slugSeen.has(key)) continue;
      slugSeen.add(key);

      const list = bySlug.get(slug) ?? [];
      bySlug.set(slug, list);
      list.push({ ...entry, section: h2 || h1 });
    }
  }

  const lines: string[] = [
    "// AUTO-GENERATED by scripts/sync-fmhy.ts — do not edit by hand, run `npm run sync-fmhy`.",
    "// Source: FMHY (https://fmhy.net) starred picks.",
    "",
    'import type { LinkItem } from "./links";',
    "",
    "export const fmhyLinks: Record<string, LinkItem[]> = {",
  ];
  let total = 0;
  for (const [slug, entries] of bySlug) {
    lines.push(`    ${JSON.stringify(slug)}: [`);
    for (const e of entries) {
      const fields = [`name: ${JSON.stringify(e.name)}`, `url: ${JSON.stringify(e.url)}`, `section: ${JSON.stringify(e.section)}`];
      if (e.description) fields.push(`description: ${JSON.stringify(e.description)}`);
      lines.push(`        { ${fields.join(", ")} },`);
    }
    lines.push("    ],");
    total += entries.length;
    console.log(`${slug.padEnd(14)} ${entries.length}`);
  }
  lines.push("};", "");
  writeFileSync(OUT_FILE, lines.join("\n"), "utf8");

  if (unmapped.size) {
    console.warn(`\nUnmapped sections (add a rule in RULES):\n  ${[...unmapped].join("\n  ")}`);
  }
  console.log(`\nWrote ${total} links to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
