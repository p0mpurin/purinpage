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
      id: "superembed",
      name: "Server 1 (SuperEmbed Multi-Source)",
      badge: "4K / Multi-Server",
      url: type === "tv"
        ? `https://multiembed.mov/?video_id=${imdbId || tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${imdbId || tmdbId}${imdbId ? "" : "&tmdb=1"}`,
    },
    {
      id: "autoembed",
      name: "Server 2 (AutoEmbed Pro)",
      badge: "Fast Mirror",
      url: type === "tv"
        ? `https://autoembed.co/tv/tmdb/${tmdbId}/${season}/${episode}`
        : `https://autoembed.co/movie/tmdb/${tmdbId}`,
    },
  ];

  return NextResponse.json({
    servers: allServers,
  });
}
