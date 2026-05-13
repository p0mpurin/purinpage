/**
 * Development utility: HTTP-probe every external URL in src/lib/links.ts.
 *
 * Classifications:
 *   DEAD      — safe to remove (DNS fail, connection refused, TLS hard fail, 404/410, most 4xx)
 *   UNCERTAIN — verify in a real browser (401/403/429, many 5xx, odd network errors)
 *   OK        — responded with success / redirect to success
 *
 * Usage (from purinpage/):  npm run check-links
 * JSON report:             npm run check-links -- --json
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { categoryLinks } from "../src/lib/links";

const TIMEOUT_MS = 22_000;
const CONCURRENCY = 6;
const SAMPLE_MAX_BYTES = 16_384;
const RETRY_DELAY_MS = 2_500;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type Kind = "ok" | "dead" | "uncertain";

type Row = {
  categorySlug: string;
  categoryTitle: string;
  name: string;
  url: string;
};

type UrlOutcome = {
  kind: Kind;
  reason: string;
  status: number;
};

function flattenRows(): Row[] {
  const rows: Row[] = [];
  for (const [slug, data] of Object.entries(categoryLinks)) {
    for (const link of data.links) {
      rows.push({
        categorySlug: slug,
        categoryTitle: data.title,
        name: link.name,
        url: link.url.trim(),
      });
    }
  }
  return rows;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function probe(url: string): Promise<{ status: number; err?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const status = res.status;
    const reader = res.body?.getReader();
    let received = 0;
    try {
      if (reader) {
        while (received < SAMPLE_MAX_BYTES) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value?.byteLength ?? 0;
        }
      }
    } finally {
      try {
        await reader?.cancel();
      } catch {
        /* ignore */
      }
    }
    return { status };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause =
      e && typeof e === "object" && "cause" in e
        ? (e as { cause?: unknown }).cause
        : undefined;
    const causeMsg = cause instanceof Error ? cause.message : cause != null ? String(cause) : "";
    const detail = causeMsg ? `${msg} | ${causeMsg}` : msg;
    return { status: -1, err: detail };
  } finally {
    clearTimeout(timer);
  }
}

function classify(status: number, err?: string): UrlOutcome {
  if (err) {
    const m = err.toLowerCase();
    if (m.includes("abort") || m.includes("aborted")) {
      return { kind: "dead", reason: "timeout", status: -1 };
    }
    if (
      m.includes("enotfound") ||
      m.includes("getaddrinfo") ||
      m.includes("name not resolved") ||
      m.includes("nodename nor servname")
    ) {
      return { kind: "dead", reason: "dns_failure", status: -1 };
    }
    if (m.includes("econnrefused") || m.includes("connection refused")) {
      return { kind: "dead", reason: "connection_refused", status: -1 };
    }
    if (
      m.includes("certificate") ||
      m.includes("cert_authority_invalid") ||
      m.includes("ssl") ||
      m.includes("tls") ||
      m.includes("unable to verify the first certificate")
    ) {
      return { kind: "dead", reason: "tls_error", status: -1 };
    }
    if (m.includes("econnreset") || m.includes("ehostunreach") || m.includes("enetunreach")) {
      return { kind: "uncertain", reason: `network: ${err}`, status: -1 };
    }
    return { kind: "uncertain", reason: `network: ${err}`, status: -1 };
  }

  if (status >= 200 && status < 400) {
    return { kind: "ok", reason: `HTTP ${status}`, status };
  }
  if (status === 404 || status === 410) {
    return { kind: "dead", reason: `HTTP ${status}`, status };
  }
  if (status === 401 || status === 403 || status === 429) {
    return { kind: "uncertain", reason: `HTTP ${status} (often blocks automated clients)`, status };
  }
  if (status >= 500 && status <= 599) {
    return { kind: "uncertain", reason: `HTTP ${status} (may be temporary)`, status };
  }
  if (status >= 400) {
    return { kind: "dead", reason: `HTTP ${status}`, status };
  }
  return { kind: "uncertain", reason: `HTTP ${status}`, status };
}

async function checkOneUrl(url: string): Promise<UrlOutcome> {
  let p = await probe(url);
  let outcome = classify(p.status, p.err);

  const retryable =
    outcome.reason === "timeout" ||
    (outcome.kind === "uncertain" && outcome.reason.startsWith("network:")) ||
    (outcome.kind === "uncertain" && outcome.reason.includes("HTTP 5")) ||
    (outcome.kind === "dead" && outcome.reason.startsWith("network:"));

  if (retryable) {
    await sleep(RETRY_DELAY_MS);
    p = await probe(url);
    outcome = classify(p.status, p.err);
  }

  return outcome;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function run(): Promise<void> {
  const jsonMode = process.argv.includes("--json");

  const rows = flattenRows();
  const probeTargets = [...new Set(rows.map((r) => r.url).filter((u) => u && u !== "#" && u.startsWith("http")))];

  const invalidRows = rows.filter((r) => r.url === "#" || !r.url.startsWith("http"));

  console.log(`Probing ${probeTargets.length} unique URLs (${rows.length} list entries)…`);
  console.log(`Concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS}ms, one retry on uncertain/timeouts.\n`);

  const outcomes = await mapPool(probeTargets, CONCURRENCY, (url) => checkOneUrl(url));
  const byUrl = new Map<string, UrlOutcome>();
  probeTargets.forEach((u, i) => byUrl.set(u, outcomes[i]!));

  const dead: Array<Row & UrlOutcome> = [];
  const uncertain: Array<Row & UrlOutcome> = [];
  let okCount = 0;

  for (const r of rows) {
    if (r.url === "#" || !r.url.startsWith("http")) continue;
    const o = byUrl.get(r.url);
    if (!o) continue;
    if (o.kind === "dead") dead.push({ ...r, ...o });
    else if (o.kind === "uncertain") uncertain.push({ ...r, ...o });
    else okCount++;
  }

  console.log("── Summary ──");
  console.log(`OK         ${okCount}`);
  console.log(`DEAD       ${dead.length}  (candidates to remove)`);
  console.log(`UNCERTAIN  ${uncertain.length}  (check manually in a browser)`);
  if (invalidRows.length > 0) {
    console.log(`Skipped invalid/placeholder: ${invalidRows.length}`);
  }
  console.log();

  if (dead.length > 0) {
    console.log("══ DEAD (high confidence) ══\n");
    for (const d of dead) {
      console.log(`[${d.categorySlug}] ${d.name}`);
      console.log(`  ${d.url}`);
      console.log(`  → ${d.reason}\n`);
    }
  }

  if (uncertain.length > 0) {
    console.log("══ UNCERTAIN (do not auto-delete) ══\n");
    for (const u of uncertain) {
      console.log(`[${u.categorySlug}] ${u.name}`);
      console.log(`  ${u.url}`);
      console.log(`  → ${u.reason}\n`);
    }
  }

  if (jsonMode) {
    const outPath = join(process.cwd(), "scripts", "dead-links-report.json");
    writeFileSync(
      outPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          summary: { ok: okCount, dead: dead.length, uncertain: uncertain.length },
          dead,
          uncertain,
        },
        null,
        2
      ),
      "utf-8"
    );
    console.log(`Wrote ${outPath}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
