import { NextResponse } from "next/server";
import { getDrama, getDramaSource } from "@/lib/kisskh-api";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = Number(params.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid drama ID" }, { status: 400 });
  try {
    const detail = await getDrama(id);
    if (params.get("mode") === "source") {
      const episodeId = Number(params.get("episodeId"));
      if (!detail.episodes.some((episode) => episode.id === episodeId)) return NextResponse.json({ error: "Invalid episode" }, { status: 400 });
      return NextResponse.json(await getDramaSource(episodeId));
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Drama unavailable" }, { status: 502 });
  }
}
