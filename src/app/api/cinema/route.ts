import { NextResponse } from "next/server";
import { InternetArchiveClient } from "@/lib/archive-api";
import { browseMoviebox, type CinemaSort } from "@/lib/moviebox-api";

const archive = new InternetArchiveClient();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() || "";
  const category = params.get("category") || "anime";
  const page = Math.min(50, Math.max(1, Number(params.get("page")) || 1));
  const requestedSort = params.get("sort") || "hot";
  const sort: CinemaSort = (["hot", "popular", "rated", "newest", "az"] as string[]).includes(requestedSort) ? requestedSort as CinemaSort : "hot";
  try {
    if (category === "classics") {
      const terms = query.match(/[\p{L}\p{N}]+/gu)?.slice(0, 6) || [];
      const search = terms.length ? ` AND title:(${terms.join(" AND ")})` : "";
      const archiveSort = sort === "newest" ? "publicdate desc" : sort === "az" ? "titleSorter asc" : "downloads desc";
      const data = await archive.advancedSearch({
        query: `collection:feature_films AND mediatype:movies AND format:(MPEG4 OR "H.264" OR WebM)${search}`,
        fields: ["identifier", "title", "year", "description"],
        rows: 24, page, sort: archiveSort,
      });
      return NextResponse.json({
        items: data.response.docs.filter((item) => /^[\w.-]+$/.test(item.identifier)).map((item) => ({
          id: `archive:${item.identifier}`, source: "Internet Archive", title: item.title || item.identifier,
          kind: "movie", poster: archive.getThumbnailUrl(item.identifier), year: item.year || null,
          url: archive.getDetailsUrl(item.identifier), description: item.description || null, blocked: false,
        })),
        more: page * 24 < data.response.numFound, weekly: [],
      });
    }
    if (category !== "anime" && category !== "movies" && category !== "drama") return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    const data = await browseMoviebox(category, query, page, sort);
    const mapItem = (item: typeof data.items[number]) => ({
      id: `moviebox:${item.id}`, source: "MovieBox", title: item.title, slug: item.slug,
      kind: item.kind, poster: item.poster, year: item.year, rating: item.rating, url: null,
      description: item.description, blocked: false,
    });
    return NextResponse.json({ items: data.items.map(mapItem), more: data.more, weekly: !query && page === 1 ? data.weekly.map(mapItem) : [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Source unavailable" }, { status: 502 });
  }
}
