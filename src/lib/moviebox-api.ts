const API = "https://h5-api.aoneroom.com/wefeed-h5api-bff";
const HOST = "moviebox.ph";
const BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Referer: "https://moviebox.ph/",
  Origin: "https://moviebox.ph",
  "X-Request-Lang": "en",
  Accept: "application/json",
};

type RawSubject = { subjectId: string; subjectType: number; title: string; description?: string; detailPath: string; cover?: { url?: string }; countryName?: string; releaseDate?: string; genre?: string; hasResource?: boolean };
type RawResponse<T> = { code: number; message?: string; data: T };
type RawHome = { operatingList: { title: string; subjects: RawSubject[] }[] };
type RawSearch = { items?: RawSubject[]; list?: RawSubject[]; pager?: { totalCount?: number } };
type RawDetail = { subject: RawSubject; resource?: { seasons?: { se: number; maxEp: number }[] } };
type RawStream = { id: string; format: string; url: string; resolutions: string; vipLocked?: boolean };
type RawPlay = { streams?: RawStream[]; hls?: RawStream[]; hasResource?: boolean };
type RawCaption = { lan: string; lanName: string; url: string };

export type MovieboxItem = { id: string; title: string; slug: string; poster: string | null; kind: "movie" | "series"; description: string | null; country: string | null; genre: string | null; year: string | null };
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
  if (!raw.subjectId || !raw.detailPath || !raw.title) return null;
  return { id: raw.subjectId, title: raw.title, slug: raw.detailPath, poster: raw.cover?.url || null,
    kind: raw.subjectType === 1 ? "movie" : "series", description: raw.description || null,
    country: raw.countryName || null, genre: raw.genre || null, year: raw.releaseDate?.slice(0, 4) || null };
}

function inCategory(item: MovieboxItem, category: string) {
  if (category === "movies") return item.kind === "movie";
  if (category === "anime") return /anime|animation/i.test(`${item.genre || ""} ${item.title}`);
  return item.kind === "series" && /korea|china|japan|thailand|taiwan|drama/i.test(`${item.country || ""} ${item.genre || ""} ${item.title}`);
}

export async function browseMoviebox(category: "anime" | "movies" | "drama", query: string, page: number) {
  if (query) {
    const data = await request<RawSearch>("/subject/search", { keyword: query.slice(0, 100), page, perPage: 30 });
    const items = (data.items || data.list || []).map(mapItem).filter((item): item is MovieboxItem => Boolean(item)).filter((item) => inCategory(item, category));
    return { items, more: page * 30 < (data.pager?.totalCount || 0) };
  }
  const home = await request<RawHome>("/home");
  const patterns = category === "anime" ? /anime/i : category === "movies" ? /movie|cinema|action|horror|comedy/i : /k-drama|c-drama|drama|bl story/i;
  const seen = new Set<string>();
  let items = home.operatingList.filter((section) => patterns.test(section.title)).flatMap((section) => section.subjects || [])
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
  return { items: items.slice(start, start + 24), more: start + 24 < items.length };
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

export async function getMovieboxPlayerReferer() { return `${await getPlayerDomain()}/`; }

export async function getMovieboxSources(id: string, slug: string, season: number, episode: number) {
  const domain = await getPlayerDomain();
  const token = await getToken();
  const referer = `${domain}/spa/videoPlayPage/movies/${encodeURIComponent(slug)}?id=${id}&type=/movie/detail&detailSe=${season}&detailEp=${episode}&lang=en`;
  const url = `${API}/subject/play?subjectId=${id}&se=${season}&ep=${episode}&detailPath=${encodeURIComponent(slug)}&host=${HOST}`;
  const response = await fetch(url, { headers: { "User-Agent": BASE_HEADERS["User-Agent"], Referer: referer, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`MovieBox player returned ${response.status}`);
  const result = await response.json() as RawResponse<RawPlay>;
  const streams = [...(result.data.streams || []), ...(result.data.hls || [])];
  const sources = streams.filter((stream) => stream.url && !stream.vipLocked && /^https:\/\//.test(stream.url))
    .map((stream) => ({ id: stream.id, label: stream.resolutions ? `${stream.resolutions}p` : stream.format,
      url: stream.format.toUpperCase() === "MP4" ? `/api/cinema/moviebox/media?url=${encodeURIComponent(stream.url)}` : stream.url,
      format: stream.format }));
  const first = streams[0];
  let subtitles: MovieboxSubtitle[] = [];
  if (first?.id) {
    try {
      const data = await request<{ captions?: RawCaption[] }>(`/subject/caption?format=${encodeURIComponent(first.format)}&id=${encodeURIComponent(first.id)}&subjectId=${id}&detailPath=${encodeURIComponent(slug)}`);
      subtitles = (data.captions || []).filter((caption) => caption.url && /^https:\/\//.test(caption.url)).map((caption) => ({
        label: caption.lanName || caption.lan, language: caption.lan || "und",
        url: `/api/cinema/moviebox/subtitle?url=${encodeURIComponent(caption.url)}`,
      })).sort((a, b) => Number(b.language === "en") - Number(a.language === "en"));
    } catch { /* The video can still play without captions. */ }
  }
  return { sources, subtitles };
}
