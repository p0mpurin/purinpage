import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("id") || "157336"; // default Interstellar
  const type = searchParams.get("type") || "movie";
  const season = searchParams.get("season") || "1";
  const episode = searchParams.get("episode") || "1";

  const serversToTest = [
    {
      id: "vidlink",
      name: "Server 1 (VidLink HD)",
      badge: "Fast 1080p",
      url: type === "tv"
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidlink.pro/movie/${tmdbId}`,
    },
    {
      id: "superembed",
      name: "Server 2 (SuperEmbed)",
      badge: "4K / Multi",
      url: type === "tv"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    },
    {
      id: "smashystream",
      name: "Server 3 (SmashyStream)",
      badge: "Clean Stream",
      url: type === "tv"
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`,
    },
    {
      id: "vidsrc_to",
      name: "Server 4 (VidSrc TO)",
      badge: "Mirror",
      url: type === "tv"
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`,
    },
    {
      id: "autoembed",
      name: "Server 5 (AutoEmbed)",
      badge: "Auto",
      url: type === "tv"
        ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${tmdbId}`,
    },
  ];

  const results = await Promise.all(
    serversToTest.map(async (server) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const startTime = Date.now();

        const res = await fetch(server.url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          },
          signal: controller.signal,
        });

        clearTimeout(timer);
        const latency = Date.now() - startTime;

        if (!res.ok) {
          return { ...server, isOnline: false, latency, reason: `HTTP ${res.status}` };
        }

        const text = await res.text();
        const isBlocked =
          text.includes("Please Disable Sandbox") ||
          text.includes("Disable Sandbox") ||
          text.includes("sandbox detected") ||
          text.includes("Cloudflare Ray ID") && text.includes("Access denied");

        if (isBlocked) {
          return { ...server, isOnline: false, latency, reason: "Sandbox Blocked" };
        }

        return { ...server, isOnline: true, latency };
      } catch (err: any) {
        return { ...server, isOnline: false, latency: 999, reason: err.name || "Timeout" };
      }
    })
  );

  const activeServers = results.filter((s) => s.isOnline);
  return NextResponse.json({
    servers: activeServers.length > 0 ? activeServers : results.slice(0, 2),
  });
}
