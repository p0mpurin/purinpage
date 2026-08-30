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
      badge: "Fast 1080p",
      url: type === "tv"
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=ffb6c1`
        : `https://vidlink.pro/movie/${tmdbId}?primaryColor=ffb6c1`,
    },
    {
      id: "vidsrc_su",
      name: "Server 2 (VidSrc SU)",
      badge: "New Releases",
      url: type === "tv"
        ? `https://vidsrc.su/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.su/embed/movie/${tmdbId}`,
    },
    {
      id: "superembed",
      name: "Server 3 (SuperEmbed)",
      badge: "Multi-Source",
      url: type === "tv"
        ? `https://multiembed.mov/?video_id=${imdbId || tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${imdbId || tmdbId}${imdbId ? "" : "&tmdb=1"}`,
    },
    {
      id: "smashystream",
      name: "Server 4 (SmashyStream)",
      badge: "Clean Stream",
      url: type === "tv"
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`,
    },
    {
      id: "rivestream",
      name: "Server 5 (RiveStream)",
      badge: "4K / Sub",
      url: type === "tv"
        ? `https://rivestream.live/embed?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`
        : `https://rivestream.live/embed?type=movie&id=${tmdbId}`,
    },
    {
      id: "vidsrc_to",
      name: "Server 6 (VidSrc TO)",
      badge: "Backup Mirror",
      url: type === "tv"
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`,
    },
  ];

  // Always return the complete reliable server list to ensure parity across all devices
  return NextResponse.json({
    servers: allServers,
  });
}
