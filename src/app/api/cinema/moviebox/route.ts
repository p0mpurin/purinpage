import { NextResponse } from "next/server";
import { getMovieboxDetail, getMovieboxSources } from "@/lib/moviebox-api";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") || "";
  const slug = params.get("slug") || "";
  if (!/^\d{8,22}$/.test(id) || !/^[a-zA-Z0-9_-]{3,160}$/.test(slug)) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  try {
    const detail = await getMovieboxDetail(slug);
    if (detail.item.id !== id) return NextResponse.json({ error: "Title mismatch" }, { status: 400 });
    if (params.get("mode") === "sources") {
      const season = Number(params.get("season"));
      const episode = Number(params.get("episode"));
      if (!Number.isSafeInteger(season) || !Number.isSafeInteger(episode) || episode < 0 || !detail.seasons.some((item) => item.number === season && episode <= item.episodes)) {
        return NextResponse.json({ error: "Invalid episode" }, { status: 400 });
      }
      return NextResponse.json(await getMovieboxSources(id, slug, season, episode));
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MovieBox unavailable" }, { status: 502 });
  }
}
