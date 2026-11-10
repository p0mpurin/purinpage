import { NextResponse } from "next/server";
import { InternetArchiveClient } from "@/lib/archive-api";
import { browseMoviebox } from "@/lib/moviebox-api";

const archive = new InternetArchiveClient();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() || "";
  const category = params.get("category") || "anime";
  const page = Math.min(50, Math.max(1, Number(params.get("page")) || 1));
  try {
    if (category === "classics") {
      const terms = query.match(/[\p{L}\p{N}]+/gu)?.slice(0, 6) || [];
      const search = terms.length ? ` AND title:(${terms.join(" AND ")})` : "";
      const data = await archive.advancedSearch({
        query: `collection:feature_films AND mediatype:movies${search}`,
        fields: ["identifier", "title", "year", "description"],
        rows: 24, page, sort: "downloads desc",
      });
      return NextResponse.json({
        items: data.response.docs.filter((item) => /^[\w.-]+$/.test(item.identifier)).map((item) => ({
          id: `archive:${item.identifier}`, source: "Internet Archive", title: item.title || item.identifier,
          kind: "movie", poster: archive.getThumbnailUrl(item.identifier),
          url: archive.getDetailsUrl(item.identifier), description: item.description || null, blocked: false,
        })),
        more: page * 24 < data.response.numFound,
      });
    }
    if (category !== "anime" && category !== "movies" && category !== "drama") return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const data = await browseMoviebox(category, query, page);
    return NextResponse.json({ items: data.items.map((item) => ({
      id: `moviebox:${item.id}`, source: "MovieBox", title: item.title, slug: item.slug,
      kind: item.kind, poster: item.poster, url: null,
      description: item.description, blocked: false,
    })), more: data.more });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Source unavailable" }, { status: 502 });
  }
}
