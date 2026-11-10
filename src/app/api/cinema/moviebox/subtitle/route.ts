import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("url") || "";
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "cacdn.hakunaymatata.com" || !url.pathname.startsWith("/subtitle/") || !url.pathname.endsWith(".srt")) {
      return NextResponse.json({ error: "Invalid subtitle URL" }, { status: 400 });
    }
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `Subtitle returned ${response.status}` }, { status: 502 });
    const srt = (await response.text()).replace(/\r/g, "").replace(/(\d\d:\d\d:\d\d),(\d{3})/g, "$1.$2");
    return new Response(`WEBVTT\n\n${srt}`, { headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Invalid subtitle request" }, { status: 400 });
  }
}
