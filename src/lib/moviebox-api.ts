const API = "https://h5-api.aoneroom.com/wefeed-h5api-bff";
const HOST = "moviebox.ph";
const BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Referer: "https://moviebox.ph/",
  Origin: "https://moviebox.ph",
  "X-Request-Lang": "en",
  Accept: "application/json",
};

type RawSubject = { subjectId: string; subjectType: number; title: string; description?: string; detailPath: string; cover?: { url?: string }; countryName?: string; releaseDate?: string; genre?: string; hasResource?: boolean; imdbRatingValue?: string; imdbRatingCount?: number };
type RawResponse<T> = { code: number; message?: string; data: T };
type RawHome = { operatingList: { title: string; subjects: RawSubject[] }[] };
type RawSearch = { items?: RawSubject[]; list?: RawSubject[]; pager?: { totalCount?: number } };
type RawDetail = { subject: RawSubject; resource?: { seasons?: { se: number; maxEp: number }[] } };
type RawStream = { id: string; format: string; url: string; resolutions: string; vipLocked?: boolean };
type RawPlay = { streams?: RawStream[]; hls?: RawStream[]; hasResource?: boolean };
type RawCaption = { lan: string; lanName: string; url: string };

function qualityRank(stream: RawStream) {
  const label = stream.resolutions || "";
  if (/4k/i.test(label)) return 2160;
  const resolution = Number(label.match(/\d+/)?.[0] || 0);
  return Number.isFinite(resolution) ? resolution : 0;
}

function subtitleLanguage(code: string) {
  if (code.toLowerCase() === "in_id") return "id";
  return code.replace(/_/g, "-").toLowerCase() || "und";
}

export type CinemaSort = "hot" | "popular" | "rated" | "newest" | "az";
export type MovieboxItem = { id: string; title: string; slug: string; poster: string | null; kind: "movie" | "series"; description: string | null; country: string | null; genre: string | null; year: string | null; releaseDate: string | null; rating: number | null; votes: number };
export type MovieboxDetail = { item: MovieboxItem; seasons: { number: number; episodes: number }[] };
export type MovieboxSource = { id: string; label: string; url: string; format: string };
export type MovieboxSubtitle = { label: string; language: string; url: string };

let tokenState: { value: string; expires: number } | null = null;
let domainState: { value: string; expires: number } | null = null;
let animeCatalog: { items: MovieboxItem[]; expires: number } | null = null;

async function getToken() {
  if (tokenState && tokenState.expires > Date.now()) return tokenState.value;
  const response = await fetch(`${API}/home?host=${HOST}`, { headers: BASE_HEADERS, cache: "no-store" });
  if (!response.ok) throw new Error(`MovieBox catalog returned ${response.status}`);
  const header = response.headers.get("x-user");
  const token = header ? (JSON.parse(header) as { token?: string }).token : undefined;
  if (!token) throw new Error("MovieBox guest session unavailable");
  tokenState = { value: token, expires: Date.now() + 240_000 };
  return token;
}

async function request<T>(path: string, body?: Record<string, unknown>, retry = true): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API}${path}${path.includes("?") ? "&" : "?"}host=${HOST}`, {
    method: body ? "POST" : "GET",
    headers: { ...BASE_HEADERS, Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json() as RawResponse<T>;
  if ((response.status === 401 || /invalid token/i.test(data.message || "")) && retry) {
    tokenState = null;
    return request<T>(path, body, false);
  }
  if (!response.ok || data.code !== 0) throw new Error(`MovieBox returned ${response.status}: ${data.message || "source unavailable"}`);
  return data.data;
}

function mapItem(raw: RawSubject): MovieboxItem | null {
  if (!raw.subjectId || !raw.detailPath || !raw.title || ![1, 2].includes(raw.subjectType) || raw.hasResource === false) return null;
  const rating = Number(raw.imdbRatingValue);
  return { id: raw.subjectId, title: raw.title, slug: raw.detailPath, poster: raw.cover?.url || null,
    kind: raw.subjectType === 1 ? "movie" : "series", description: raw.description || null,
    country: raw.countryName || null, genre: raw.genre || null, year: raw.releaseDate?.slice(0, 4) || null,
    releaseDate: raw.releaseDate || null, rating: rating > 0 && rating <= 10 ? rating : null, votes: Math.max(0, Number(raw.imdbRatingCount) || 0) };
}

function sectionRank(category: string, title: string) {
  const ranked = category === "movies" ? ["Popular Movie", "Action Movies", "Horror Movies", "Nollywood Movie"]
    : category === "drama" ? ["K-Drama", "C-Drama", "BL Story", "Trending Short Drama"] : ["Anime[English Dubbed]"];
  const index = ranked.findIndex((name) => name.toLowerCase() === title.toLowerCase());
  return index < 0 ? ranked.length : index;
}

function sortItems(items: MovieboxItem[], sort: CinemaSort) {
  if (sort === "hot") return items;
  const titleOrder = (a: MovieboxItem, b: MovieboxItem) => a.title.localeCompare(b.title, "en");
  return [...items].sort((a, b) => {
    if (sort === "az") return titleOrder(a, b);
    if (sort === "newest") return (b.releaseDate || "").localeCompare(a.releaseDate || "") || b.votes - a.votes || titleOrder(a, b);
    if (sort === "rated") {
      const score = (item: MovieboxItem) => item.rating === null ? 0 : (item.votes * item.rating + 1000 * 6) / (item.votes + 1000);
      return score(b) - score(a) || b.votes - a.votes || titleOrder(a, b);
    }
    return b.votes - a.votes || (b.rating || 0) - (a.rating || 0) || titleOrder(a, b);
  });
}

function inCategory(item: MovieboxItem, category: string) {
  if (category === "movies") return item.kind === "movie";
  if (category === "anime") return /anime|animation/i.test(`${item.genre || ""} ${item.title}`);
  return item.kind === "series" && /korea|china|japan|thailand|taiwan|drama/i.test(`${item.country || ""} ${item.genre || ""} ${item.title}`);
}

export async function browseMoviebox(category: "anime" | "movies" | "drama", query: string, page: number, sort: CinemaSort = "hot") {
  if (query) {
    const data = await request<RawSearch>("/subject/search", { keyword: query.slice(0, 100), page, perPage: 30 });
    const raw = data.items || data.list || [];
    const items = raw.map(mapItem).filter((item): item is MovieboxItem => Boolean(item)).filter((item) => inCategory(item, category));
    const total = data.pager?.totalCount || 0;
    return { items, more: raw.length >= 30 && (total >= 1_000_000 || page * 30 < total) };
  }
  const home = await request<RawHome>("/home");
  const patterns = category === "anime" ? /anime/i : category === "movies" ? /movie|cinema|action|horror|comedy/i : /k-drama|c-drama|drama|bl story/i;
  const seen = new Set<string>();
  let items = home.operatingList.filter((section) => patterns.test(section.title) && section.subjects?.length)
    .sort((a, b) => sectionRank(category, a.title) - sectionRank(category, b.title))
    .flatMap((section) => section.subjects || [])
    .map(mapItem).filter((item): item is MovieboxItem => Boolean(item)).filter((item) => inCategory(item, category))
    .filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
  if (category === "anime") {
    if (animeCatalog && animeCatalog.expires > Date.now()) items = animeCatalog.items;
    else {
      const seeds = ["Naruto", "Dragon Ball", "Demon Slayer", "Attack on Titan", "Jujutsu Kaisen", "Bleach", "One Piece"];
      const results = await Promise.allSettled(seeds.map((keyword) => request<RawSearch>("/subject/search", { keyword, page: 1, perPage: 30 })));
      for (const result of results) if (result.status === "fulfilled") {
        for (const raw of result.value.items || result.value.list || []) {
          const item = mapItem(raw);
          if (item && inCategory(item, "anime") && !seen.has(item.id)) { seen.add(item.id); items.push(item); }
        }
      }
      animeCatalog = { items, expires: Date.now() + 300_000 };
    }
  }
  const start = (page - 1) * 24;
  const ordered = sortItems(items, sort);
  return { items: ordered.slice(start, start + 24), more: start + 24 < ordered.length };
}

export async function getMovieboxDetail(slug: string): Promise<MovieboxDetail> {
  const data = await request<RawDetail>(`/detail?detailPath=${encodeURIComponent(slug)}`);
  const item = mapItem(data.subject);
  if (!item) throw new Error("MovieBox title unavailable");
  const seasons = data.resource?.seasons?.map((season) => ({ number: season.se, episodes: season.maxEp })) || [];
  return { item, seasons: seasons.length ? seasons : [{ number: item.kind === "movie" ? 0 : 1, episodes: 1 }] };
}

async function getPlayerDomain() {
  if (domainState && domainState.expires > Date.now()) return domainState.value;
  const value = await request<string>("/media-player/get-domain");
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Invalid player domain");
  domainState = { value: url.origin, expires: Date.now() + 300_000 };
  return url.origin;
}


export async function getMovieboxSources(id: string, slug: string, season: number, episode: number) {
  const domain = await getPlayerDomain();
  const token = await getToken();
  const referer = `${domain}/spa/videoPlayPage/movies/${encodeURIComponent(slug)}?id=${id}&type=/movie/detail&detailSe=${season}&detailEp=${episode}&lang=en`;
  const url = `${API}/subject/play?subjectId=${id}&se=${season}&ep=${episode}&detailPath=${encodeURIComponent(slug)}&host=${HOST}`;
  const response = await fetch(url, { headers: { "User-Agent": BASE_HEADERS["User-Agent"], Referer: referer, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`MovieBox player returned ${response.status}`);
  const result = await response.json() as RawResponse<RawPlay>;
  const streams = [...(result.data.streams || []), ...(result.data.hls || [])].sort((a, b) => qualityRank(b) - qualityRank(a));
  const sources = streams.filter((stream) => stream.url && !stream.vipLocked && /^https:\/\//.test(stream.url))
    .map((stream) => ({ id: stream.id, label: stream.resolutions ? `${stream.resolutions}p` : stream.format,
      url: stream.format.toUpperCase() === "MP4" ? `/api/cinema/moviebox/media?url=${encodeURIComponent(stream.url)}&ref=${encodeURIComponent(domain)}` : stream.url,
      format: stream.format }));
  const first = streams[0];
  let subtitles: MovieboxSubtitle[] = [];
  if (first?.id) {
    try {
      const data = await request<{ captions?: RawCaption[] }>(`/subject/caption?format=${encodeURIComponent(first.format)}&id=${encodeURIComponent(first.id)}&subjectId=${id}&detailPath=${encodeURIComponent(slug)}`);
      subtitles = (data.captions || []).filter((caption) => caption.url && /^https:\/\//.test(caption.url)).map((caption) => ({
        label: caption.lanName || caption.lan, language: subtitleLanguage(caption.lan),
        url: `/api/cinema/moviebox/subtitle?url=${encodeURIComponent(caption.url)}`,
      })).sort((a, b) => Number(b.language === "en") - Number(a.language === "en"));
    } catch { /* The video can still play without captions. */ }
  }
  return { sources, subtitles };
}
