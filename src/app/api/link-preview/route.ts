import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl } from "@/lib/url-safety";
import { extractPreviewImage } from "@/lib/og-parse";
import { getServerPreviewCache, setServerPreviewCache } from "@/lib/preview-cache-server";

export const runtime = "nodejs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const MAX_HTML_BYTES = 180_000;
const FETCH_MS = 12_000;

async function readUntilHeadOrLimit(
  body: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<{ text: string; truncated: boolean }> {
  const reader = body.getReader();
  const dec = new TextDecoder("utf-8", { fatal: false });
  let received = 0;
  let buffer = "";

  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.length) {
        received += value.length;
        buffer += dec.decode(value, { stream: true });
        if (/<\/head\s*>/i.test(buffer)) break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }

  return { text: buffer, truncated: received >= maxBytes };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const url = typeof body === "object" && body !== null && "url" in body ? (body as { url: unknown }).url : null;
  if (typeof url !== "string" || url.length > 2048 || url === "#") {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  let safeUrl: URL | null = null;
  let assertError: string | null = null;
  try {
    safeUrl = await assertPublicHttpUrl(url);
  } catch (e) {
    assertError = e instanceof Error ? e.message : "unknown";
  }

  if (!safeUrl) {
    const code = assertError ?? "unsafe_or_invalid_url";
    if (code === "dns_failed") {
      return NextResponse.json(
        { error: code, retryable: true },
        { status: 503, headers: { "Retry-After": "2" } }
      );
    }
    return NextResponse.json({ error: code }, { status: 400 });
  }

  const href = safeUrl.href;

  const cached = getServerPreviewCache(href);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Preview-Cache": "hit" },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_MS);

  try {
    const res = await fetch(href, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const reachable = res.ok || res.status === 403 || res.status === 401;
    const statusCode = res.status;

    let previewImage: string | null = null;

    const ct = res.headers.get("content-type") || "";
    const looksHtml =
      !ct || ct.includes("text/html") || ct.includes("application/xhtml+xml");

    if (res.body && looksHtml) {
      const { text } = await readUntilHeadOrLimit(res.body, MAX_HTML_BYTES);
      previewImage = extractPreviewImage(text, href);
    } else if (res.body) {
      try {
        await res.body.cancel();
      } catch {
        /* ignore */
      }
    }

    const payload = {
      ok: true as const,
      reachable,
      statusCode,
      previewImage,
    };
    setServerPreviewCache(href, payload);
    return NextResponse.json(payload, {
      headers: { "X-Preview-Cache": "miss" },
    });
  } catch {
    const payload = {
      ok: true as const,
      reachable: false,
      statusCode: null as number | null,
      previewImage: null as string | null,
    };
    setServerPreviewCache(href, payload);
    return NextResponse.json(payload, {
      headers: { "X-Preview-Cache": "miss" },
    });
  } finally {
    clearTimeout(timeout);
  }
}
