import { NextResponse } from "next/server";
import { browseMiruro } from "@/lib/miruro-data";
import { InternetArchiveClient } from "@/lib/archive-api";
import { browseDrama } from "@/lib/kisskh-api";

const archive = new InternetArchiveClient();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() || "";
  const category = params.get("category") || "drama";
  const page = Math.min(50, Math.max(1, Number(params.get("page")) || 1));
  try {
    if (category === "anime") {
      const data = await browseMiruro(query, params.get("cursor") || "");
      return NextResponse.json({
        items: data.items.map((item) => ({
          id: `miruro:${item.id}`, source: "Miruro", title: item.title,
          kind: "series", poster: item.poster, slug: item.slug,
          url: null, description: item.description, blocked: false,
        })), more: data.more, nextCursor: data.nextCursor,
      });
    }
    if (category === "movies") {
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
    const data = await browseDrama(query, page);
    return NextResponse.json({ items: data.items.map((item) => ({
      id: `kisskh:${item.id}`, source: "KissKH", title: item.title,
      kind: "series", poster: item.thumbnail || null, url: null,
      description: null, blocked: false,
    })), more: data.more });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Source unavailable" }, { status: 502 });
  }
}
