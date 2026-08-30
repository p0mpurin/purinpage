import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("id") || "157336";
  const imdbId = searchParams.get("imdbId") || "";
  const type = searchParams.get("type") || "movie";
  const season = searchParams.get("season") || "1";
  const episode = searchParams.get("episode") || "1";

  const allServers = [
    {
      id: "vidlink",
      name: "Server 1 (VidLink HD)",
      badge: "Clean 1080p",
      url: type === "tv"
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=ffb6c1`
        : `https://vidlink.pro/movie/${tmdbId}?primaryColor=ffb6c1`,
    },
    {
      id: "autoembed",
      name: "Server 2 (AutoEmbed Pro)",
      badge: "Fast Stream",
      url: type === "tv"
        ? `https://autoembed.co/tv/tmdb/${tmdbId}/${season}/${episode}`
        : `https://autoembed.co/movie/tmdb/${tmdbId}`,
    },
    {
      id: "vidfast",
      name: "Server 3 (VidFast HD)",
      badge: "Zero-Ad HD",
      url: type === "tv"
        ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidfast.pro/movie/${tmdbId}`,
    },
    {
      id: "movies111",
      name: "Server 4 (111Movies)",
      badge: "Direct Mirror",
      url: type === "tv"
        ? `https://111movies.com/tv/${tmdbId}/${season}/${episode}`
        : `https://111movies.com/movie/${tmdbId}`,
    },
    {
      id: "superembed",
      name: "Server 5 (SuperEmbed Multi)",
      badge: "Multi-Source 4K",
      url: type === "tv"
        ? `https://multiembed.mov/?video_id=${imdbId || tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${imdbId || tmdbId}${imdbId ? "" : "&tmdb=1"}`,
    },
  ];

  return NextResponse.json({
    servers: allServers,
  });
}
