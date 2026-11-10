import { NextResponse } from "next/server";
import { getMiruroSources, getMiruroTitle } from "@/lib/miruro-data";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") || "";
  const slug = params.get("slug") || "";
  const episode = Number(params.get("episode") || "1");
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id) || !/^[a-z0-9-]{1,120}$/.test(slug) || !Number.isInteger(episode) || episode < 1 || episode > 10000) {
    return NextResponse.json({ error: "Invalid anime request" }, { status: 400 });
  }
  try {
    if (params.get("mode") === "sources") {
      return NextResponse.json({ sources: await getMiruroSources(id, slug, episode) });
    }
    return NextResponse.json(await getMiruroTitle(id, slug));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Miruro unavailable" }, { status: 502 });
  }
}
