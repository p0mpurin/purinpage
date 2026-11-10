import { NextResponse } from "next/server";
import { proxyDramaMediaUrl, validateDramaMediaUrl } from "@/lib/kisskh-api";

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("url") || "";
    const url = validateDramaMediaUrl(raw);
    const response = await fetch(url, { headers: { Referer: "https://kisskh.megaplay.su/" }, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `Media returned ${response.status}` }, { status: 502 });
    const type = response.headers.get("content-type") || "";
    if (url.pathname.endsWith(".m3u8") || type.includes("mpegurl")) {
      const manifest = await response.text();
      const rewritten = manifest.split("\n").map((line) => {
        if (line.startsWith("#")) return line.replace(/URI="([^"]+)"/g, (_match, value: string) => `URI="${proxyDramaMediaUrl(new URL(value, url).toString())}"`);
        if (!line.trim()) return line;
        return proxyDramaMediaUrl(new URL(line.trim(), url).toString());
      }).join("\n");
      return new Response(rewritten, { headers: { "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "private, max-age=60" } });
    }
    if (url.pathname.endsWith(".srt")) {
      const srt = (await response.text()).replace(/\r/g, "").replace(/(\d\d:\d\d:\d\d),(\d{3})/g, "$1.$2");
      return new Response(`WEBVTT\n\n${srt}`, { headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "private, max-age=300" } });
    }
    return new Response(response.body, { headers: { "Content-Type": type || "application/octet-stream", "Cache-Control": "private, max-age=60" } });
  } catch {
    return NextResponse.json({ error: "Invalid drama media request" }, { status: 400 });
  }
}
