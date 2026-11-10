import { NextResponse } from "next/server";
import { getMovieboxPlayerReferer } from "@/lib/moviebox-api";

const CHUNK_SIZE = 1_048_576;

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("url") || "";
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".hakunaymatata.com") || !/\.mp4$/.test(url.pathname)) {
      return NextResponse.json({ error: "Invalid video URL" }, { status: 400 });
    }
    const range = request.headers.get("range");
    const match = range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range && !match) return NextResponse.json({ error: "Invalid video range" }, { status: 416 });
    const start = match ? Number(match[1]) : 0;
    if (!Number.isSafeInteger(start) || start < 0) return NextResponse.json({ error: "Invalid video range" }, { status: 416 });
    const requestedEnd = match?.[2] ? Number(match[2]) : Number.MAX_SAFE_INTEGER;
    const end = Math.min(requestedEnd, start + CHUNK_SIZE - 1);
    if (!Number.isSafeInteger(end) || end < start) return NextResponse.json({ error: "Invalid video range" }, { status: 416 });
    const response = await fetch(url, {
      headers: { Referer: await getMovieboxPlayerReferer(), "User-Agent": "Mozilla/5.0", Range: `bytes=${start}-${end}` },
      cache: "no-store",
    });
    if (response.status !== 206 || !response.body) return NextResponse.json({ error: `Video returned ${response.status}` }, { status: 502 });
    const contentRange = response.headers.get("content-range");
    if (!contentRange) return NextResponse.json({ error: "Video range unavailable" }, { status: 502 });
    const headers = new Headers({ "Content-Type": response.headers.get("content-type") || "video/mp4", "Content-Range": contentRange,
      "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=60" });
    const length = response.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new Response(response.body, { status: 206, headers });
  } catch {
    return NextResponse.json({ error: "Video unavailable" }, { status: 502 });
  }
}
