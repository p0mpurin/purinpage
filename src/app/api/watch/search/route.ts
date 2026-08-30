import { NextResponse } from "next/server";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "trending";
  const query = searchParams.get("query")?.trim() || "";
  const id = searchParams.get("id");
  const mediaType = searchParams.get("type") || "movie"; // "movie" | "tv"
  const seasonNum = searchParams.get("season") || "1";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  try {
    // 1. Fetch TV / Drama Episode Details
    if (mode === "episodes" && id) {
      const res = await fetch(
        `${TMDB_BASE_URL}/tv/${id}/season/${seasonNum}?api_key=${TMDB_API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 502 });
      }
      const data = await res.json();
      return NextResponse.json({
        season: data.season_number,
        episodes: (data.episodes || []).map((ep: any) => ({
          episodeNumber: ep.episode_number,
          name: ep.name || `Episode ${ep.episode_number}`,
          overview: ep.overview,
          stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
          airDate: ep.air_date,
        })),
      });
    }

    // 2. Fetch Media Details (Seasons count, runtime, genres)
    if (mode === "details" && id) {
      const res = await fetch(
        `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch details" }, { status: 502 });
      }
      const data = await res.json();
      return NextResponse.json({
        id: data.id,
        title: data.title || data.name,
        overview: data.overview,
        posterPath: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
        backdropPath: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
        rating: data.vote_average ? data.vote_average.toFixed(1) : "N/A",
        year: (data.release_date || data.first_air_date || "").substring(0, 4),
        genres: (data.genres || []).map((g: any) => g.name),
        totalSeasons: data.number_of_seasons || 1,
        totalEpisodes: data.number_of_episodes || 1,
        seasons: (data.seasons || [])
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => ({
            seasonNumber: s.season_number,
            name: s.name || `Season ${s.season_number}`,
            episodeCount: s.episode_count,
          })),
      });
    }

    // 3. Search Mode (with pagination)
    if (query) {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
        { next: { revalidate: 600 } }
      );
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          type: item.media_type,
          posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          year: (item.release_date || item.first_air_date || "").substring(0, 4),
          rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
          overview: item.overview,
        }));

      return NextResponse.json({
        results,
        page: data.page || page,
        totalPages: data.total_pages || 1,
      });
    }

    // 4. Anime Discovery (with pagination)
    if (mode === "anime") {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=210024|287501|334|10349&with_original_language=ja&sort_by=popularity.desc&page=${page}`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      const results = (data.results || []).map((item: any) => ({
        id: item.id,
        title: item.name,
        type: "tv",
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        year: (item.first_air_date || "").substring(0, 4),
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        overview: item.overview,
      }));
      return NextResponse.json({
        results,
        page: data.page || page,
        totalPages: data.total_pages || 1,
      });
    }

    // 5. K-Drama Discovery (with pagination)
    if (mode === "kdrama") {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&sort_by=popularity.desc&page=${page}`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      const results = (data.results || []).map((item: any) => ({
        id: item.id,
        title: item.name,
        type: "tv",
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        year: (item.first_air_date || "").substring(0, 4),
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        overview: item.overview,
      }));
      return NextResponse.json({
        results,
        page: data.page || page,
        totalPages: data.total_pages || 1,
      });
    }

    // 6. Default: Trending (with pagination)
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const results = (data.results || [])
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        type: item.media_type,
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        year: (item.release_date || item.first_air_date || "").substring(0, 4),
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        overview: item.overview,
      }));

    return NextResponse.json({
      results,
      page: data.page || page,
      totalPages: data.total_pages || 1,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query watch database" },
      { status: 500 }
    );
  }
}
