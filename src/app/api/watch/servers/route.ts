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
      id: "smashystream",
      name: "Server 1 (SmashyStream)",
      badge: "Clean 1080p",
      url: type === "tv"
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`,
    },
    {
      id: "superembed",
      name: "Server 2 (SuperEmbed)",
      badge: "Multi-Source 4K",
      url: type === "tv"
        ? `https://multiembed.mov/?video_id=${imdbId || tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${imdbId || tmdbId}${imdbId ? "" : "&tmdb=1"}`,
    },
    {
      id: "rivestream",
      name: "Server 3 (RiveStream)",
      badge: "High Speed HD",
      url: type === "tv"
        ? `https://rivestream.live/embed?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`
        : `https://rivestream.live/embed?type=movie&id=${tmdbId}`,
    },
    {
      id: "twoembed",
      name: "Server 4 (2Embed)",
      badge: "Global Mirror",
      url: type === "tv"
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${tmdbId}`,
    },
  ];

  return NextResponse.json({
    servers: allServers,
  });
}
