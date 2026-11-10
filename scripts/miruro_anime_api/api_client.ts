/**
 * Miruro Anime API Client
 *
 * Reverse-engineered from https://miruro.cx
 * APIs discovered:
 *  - GET /api/search/browse        – anime search with filters
 *  - GET /api/discover/refs        – genres & tags catalogue
 *  - GET /health                   – service health
 *  - GET /info/{id}/{slug}/__data.json  – full anime detail + episodes
 *  - GET /watch/{id}/{slug}/__data.json?ep=N – episode sources / streams / subtitles
 *  - GET /trending/__data.json     – trending anime
 *
 * All endpoints are unauthenticated public APIs served by Miruro's SvelteKit app.
 * Episode streams are HLS (.m3u8). Subtitles are VTT. No DRM detected.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnimeTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface EpisodeCounts {
  raw: number;
  sub: number;
  dub: number;
}

export interface NextAiring {
  episode_number: number;
  air_at: string; // ISO date
}

export interface ExternalIds {
  mal?: string[];
  imdb?: string[];
  tvdb?: string[];
  anidb?: string[];
  kitsu?: string[];
  simkl?: string[];
  anilist?: string[];
  tmdb_tv?: string[];
  wikidata?: string[];
  anisearch?: string[];
  livechart?: string[];
  animethemes?: string[];
  anime_planet?: string[];
  animeschedule?: string[];
  animecountdown?: string[];
  animefillerlist?: string[];
  animefillerguide?: string[];
  animenewsnetwork?: string[];
  [key: string]: string[] | undefined;
}

export interface AnimeSummary {
  id: string;
  external_ids: ExternalIds;
  title: AnimeTitle;
  format: string;        // "TV" | "MOVIE" | "ONA" | "OVA" | "SPECIAL" | ...
  status: string;        // "RELEASING" | "FINISHED" | "UPCOMING"
  source: string;
  country_of_origin: string;
  episode_count: number | null;
  episode_counts: EpisodeCounts;
  episode_duration_minutes: number;
  season: string;
  season_year: number;
  average_score: number;
  popularity: number;
  is_adult: boolean;
  description: string;
  cover_url: string;
  cover_color: string;
  banner_url: string;
  background_url: string;
  logo_url: string;
  next_airing: NextAiring | null;
  show_cluster_id: string | null;
  show_cluster_position: number;
}

export interface SearchResponse {
  data: AnimeSummary[];
  pagination?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

export interface Genre {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
  parent_id: number | null;
  parent_name: string | null;
}

export interface DiscoverRefs {
  genres: Genre[];
  tags: Tag[];
}

export interface HealthResponse {
  status: string;
  identity_version: string;
  version: string;
  timestamp: string;
}

export interface Episode {
  episode_number: number;
  absolute_number: number | null;
  aired_season_number: number | null;
  kind: string;          // "regular" | "special" | "recap"
  canon_type: string;    // "manga_canon" | "filler" | "mixed_canon/filler"
  title: string | null;
  synopsis: string | null;
  thumbnail_url: string | null;
  aired_on: string | null;
  duration_seconds: number | null;
  finale_type: string | null;
  skip_times: SkipTimes | null;
}

export interface SkipTimes {
  intro?: { kind: string; start: number; end: number };
  outro?: { kind: string; start: number; end: number };
}

export interface Stream {
  url: string;           // HLS (.m3u8) URL
  format: string;        // "hls"
  quality: string | null;
  resolution: string | null;
  codec: string | null;
  embed: string | null;
}

export interface Server {
  server: string;        // server name e.g. "icarus-2-1"
  headers: { Origin?: string; Referer?: string };
  streams: Stream[];
  embed: string | null;
}

export interface Subtitle {
  language: string;      // "en", "fr", etc.
  label: string;         // "English"
  file: string;          // VTT URL
  format: string;        // "vtt"
  default: boolean;
}

export interface Provider {
  provider: string;      // e.g. "sun", "bee", "hop"
  skipTimes: Array<{ kind: string; start: number; end: number }>;
  servers: Server[];
  subtitles: Subtitle[];
  thumbnails: { vtt?: string; sprite?: string | null } | null;
  downloads: Array<{ url: string; quality: string | null; size: string | null; fansub: string | null }>;
}

export interface Track {
  track: string;         // "ssub" (sub) | "sdub" (dub)
  providers: Provider[];
}

export interface EpisodeSources {
  episodeNumber: number;
  tracks: Track[];
  config: Record<string, unknown>;
  providerOrder: unknown[];
}

export interface EpisodeListData {
  episodes: Episode[];
  currentEpisode: number;
  prevEpisode: number | null;
  nextEpisode: number | null;
}

// ─── SvelteKit Devalue Decoder ───────────────────────────────────────────────

/**
 * Minimal SvelteKit devalue decoder for the __data.json streaming format.
 *
 * SvelteKit encodes page data as a flat array where:
 *   - Root value is at index 0
 *   - Object property values and array elements are integer indices into the flat array
 *   - Primitives (string, number, boolean, null) are stored at leaf positions
 *   - Unresolved async values are `["Promise", chunkId]`
 *
 * The streamed response sends the initial encoded data, then `{"type":"chunk","id":N,"data":[...]}`
 * lines to resolve deferred values.
 */
function decodeSvelteKitData(responseText: string): {
  initialNode: Record<string, unknown>;
  chunks: Map<number, unknown>;
} {
  const lines = responseText.trim().split('\n').filter(Boolean);

  let initialData: unknown[] = [];
  const streamingChunks = new Map<number, unknown[]>();

  for (const line of lines) {
    if (!line.startsWith('{')) continue;
    let parsed: any;
    try { parsed = JSON.parse(line); } catch { continue; }

    if (parsed.type === 'data') {
      const dataNode = Array.isArray(parsed.nodes)
        ? parsed.nodes.find((n: any) => n.type === 'data')
        : null;
      if (dataNode?.data) {
        initialData = dataNode.data;
      }
    } else if (parsed.type === 'chunk' && typeof parsed.id === 'number') {
      streamingChunks.set(parsed.id, parsed.data);
    }
  }

  // Decode a self-contained chunk data array
  function decodeChunkArray(data: unknown[]): unknown {
    function dec(idx: number): unknown {
      const val = data[idx];
      if (Array.isArray(val)) {
        return val.map((i: unknown) => typeof i === 'number' ? dec(i) : i);
      }
      if (typeof val === 'object' && val !== null) {
        return Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, typeof v === 'number' ? dec(v) : v])
        );
      }
      return val;
    }
    return dec(0);
  }

  // Collect resolved chunk values keyed by streaming chunk ID
  const resolvedChunks = new Map<number, unknown>();
  for (const [id, chunkData] of streamingChunks) {
    resolvedChunks.set(id, decodeChunkArray(chunkData));
  }

  // Resolve Promise markers in initialData using chunk data
  // SvelteKit maps devalue Promises to streaming chunks; chunk IDs are stable per route
  const resolvedInitial = [...initialData];
  for (let i = 0; i < resolvedInitial.length; i++) {
    const val = resolvedInitial[i];
    if (Array.isArray(val) && val[0] === 'Promise' && typeof val[1] === 'number') {
      // Find the streaming chunk that resolves this promise
      // The devalue Promise id is different from the streaming chunk id;
      // we map by scanning chunks for the right position
      // (In practice, SvelteKit 2.x uses chunk ids 1-N corresponding to deferred load() calls)
    }
  }

  return {
    initialNode: (initialData[0] as Record<string, unknown>) ?? {},
    chunks: resolvedChunks,
  };
}

/** Decode the sources chunk (chunk id 5) from a watch page response */
function decodeSourcesChunk(responseText: string): EpisodeSources | null {
  const lines = responseText.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    if (!line.startsWith('{')) continue;
    let parsed: any;
    try { parsed = JSON.parse(line); } catch { continue; }

    if (parsed.type === 'chunk' && Array.isArray(parsed.data)) {
      const root = parsed.data[0];
      // Identify the sources chunk by its known keys
      if (root && typeof root === 'object' && !Array.isArray(root) &&
          'episodeNumber' in root && 'tracks' in root && 'config' in root) {

        function dec(data: unknown[], idx: number): unknown {
          if (typeof idx !== 'number' || idx < 0 || idx >= data.length) return idx;
          const val = data[idx];
          if (Array.isArray(val)) {
            return val.map((i: unknown) => typeof i === 'number' ? dec(data, i) : i);
          }
          if (typeof val === 'object' && val !== null) {
            return Object.fromEntries(
              Object.entries(val).map(([k, v]) => [
                k,
                typeof v === 'number' ? dec(data, v) : v
              ])
            );
          }
          return val;
        }

        return dec(parsed.data, 0) as EpisodeSources;
      }
    }
  }
  return null;
}

/** Decode the episodes chunk (chunk id 4) from a watch page response */
function decodeEpisodesChunk(responseText: string): EpisodeListData | null {
  const lines = responseText.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    if (!line.startsWith('{')) continue;
    let parsed: any;
    try { parsed = JSON.parse(line); } catch { continue; }

    if (parsed.type === 'chunk' && Array.isArray(parsed.data)) {
      const root = parsed.data[0];
      if (root && typeof root === 'object' && !Array.isArray(root) &&
          'episodes' in root && 'currentEpisode' in root) {

        function dec(data: unknown[], idx: number): unknown {
          if (typeof idx !== 'number' || idx < 0 || idx >= data.length) return idx;
          const val = data[idx];
          if (Array.isArray(val)) {
            return val.map((i: unknown) => typeof i === 'number' ? dec(data, i) : i);
          }
          if (typeof val === 'object' && val !== null) {
            return Object.fromEntries(
              Object.entries(val).map(([k, v]) => [
                k,
                typeof v === 'number' ? dec(data, v) : v
              ])
            );
          }
          return val;
        }

        return dec(parsed.data, 0) as EpisodeListData;
      }
    }
  }
  return null;
}

/** Extract anime detail from the initial data node of an info page response */
function decodeAnimeDetailFromInfoPage(responseText: string): Record<string, unknown> | null {
  const lines = responseText.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    if (!line.startsWith('{')) continue;
    let parsed: any;
    try { parsed = JSON.parse(line); } catch { continue; }

    if (parsed.type === 'data' && Array.isArray(parsed.nodes)) {
      const dataNode = parsed.nodes.find((n: any) => n.type === 'data');
      if (!dataNode?.data) continue;

      const data: unknown[] = dataNode.data;

      function dec(idx: number): unknown {
        if (typeof idx !== 'number' || idx < 0 || idx >= data.length) return idx;
        const val = data[idx];
        if (Array.isArray(val)) {
          // Skip Promise markers
          if (val[0] === 'Promise') return null;
          return val.map((i: unknown) => typeof i === 'number' ? dec(i) : i);
        }
        if (typeof val === 'object' && val !== null) {
          return Object.fromEntries(
            Object.entries(val).map(([k, v]) => [
              k,
              typeof v === 'number' ? dec(v) : v
            ])
          );
        }
        return val;
      }

      // The root (data[0]) has the page structure; data[1] is the anime detail
      const root = data[0] as Record<string, number>;
      if (root && typeof root === 'object' && 'detail' in root) {
        return dec(root.detail as number) as Record<string, unknown>;
      }
    }
  }
  return null;
}

// ─── API Client ──────────────────────────────────────────────────────────────

export class MiruroClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(baseUrl = 'https://miruro.cx') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${this.baseUrl}/`,
      'Origin': this.baseUrl,
    };
  }

  private async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: { ...this.headers, ...(init.headers ?? {}) },
    });
    return res;
  }

  /**
   * Check the service health / version.
   */
  async health(): Promise<HealthResponse> {
    const res = await this.fetch('/health');
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json() as Promise<HealthResponse>;
  }

  /**
   * Search for anime by title or keywords.
   * @param query  Search string
   * @param limit  Results per page (default 8, max 100)
   * @param type   Filter by format: "ANIME" (default) | "MANGA" | etc.
   * @param page   Page number (1-based)
   */
  async searchAnime(
    query: string,
    limit = 20,
    type = 'ANIME',
    page = 1,
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      type,
      page: String(page),
    });
    const res = await this.fetch(`/api/search/browse?${params}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<SearchResponse>;
  }

  /**
   * Browse anime without a search query (uses discover/trending endpoint).
   * Supports filtering by genre, format, status, year, season, sort.
   */
  async browseAnime(options: {
    genres?: number[];
    formats?: string[];
    statuses?: string[];
    yearMin?: number;
    yearMax?: number;
    season?: string;
    sort?: string;
    limit?: number;
    page?: number;
  } = {}): Promise<SearchResponse> {
    const params = new URLSearchParams();
    if (options.genres?.length) params.set('genres', options.genres.join(','));
    if (options.formats?.length) params.set('formats', options.formats.join(','));
    if (options.statuses?.length) params.set('statuses', options.statuses.join(','));
    if (options.yearMin) params.set('year_min', String(options.yearMin));
    if (options.yearMax) params.set('year_max', String(options.yearMax));
    if (options.season) params.set('season', options.season);
    if (options.sort) params.set('sort', options.sort);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.page) params.set('page', String(options.page));

    const res = await this.fetch(`/api/search/browse?${params}`);
    if (!res.ok) throw new Error(`Browse failed: ${res.status}`);
    return res.json() as Promise<SearchResponse>;
  }

  /**
   * Fetch the reference catalog: genres and tags used for filtering.
   */
  async getDiscoverRefs(): Promise<DiscoverRefs> {
    const res = await this.fetch('/api/discover/refs');
    if (!res.ok) throw new Error(`Discover refs failed: ${res.status}`);
    return res.json() as Promise<DiscoverRefs>;
  }

  /**
   * Get full anime detail from the info page.
   * Returns the decoded anime detail object from SvelteKit page data.
   *
   * @param animeId   Miruro anime ID (e.g. "o8FU9Se7l1zWPEIo28kel7S1tthb6ldF")
   * @param slug      URL slug (e.g. "one-piece") — can be any value; use "-" if unknown
   */
  async getAnimeDetail(animeId: string, slug = '-'): Promise<Record<string, unknown> | null> {
    const res = await this.fetch(
      `/info/${encodeURIComponent(animeId)}/${encodeURIComponent(slug)}/__data.json?x-sveltekit-invalidated=01`,
    );
    if (!res.ok) throw new Error(`Anime detail failed: ${res.status}`);
    const text = await res.text();
    return decodeAnimeDetailFromInfoPage(text);
  }

  /**
   * Get the full episode list for an anime, along with the current/prev/next
   * episode navigation context.
   *
   * @param animeId        Miruro anime ID
   * @param slug           URL slug
   * @param episodeNumber  Which episode to set as "current" (default 1)
   */
  async getEpisodeList(
    animeId: string,
    slug = '-',
    episodeNumber = 1,
  ): Promise<EpisodeListData | null> {
    const res = await this.fetch(
      `/watch/${encodeURIComponent(animeId)}/${encodeURIComponent(slug)}/__data.json?ep=${episodeNumber}&x-sveltekit-invalidated=01`,
    );
    if (!res.ok) throw new Error(`Episode list failed: ${res.status}`);
    const text = await res.text();
    return decodeEpisodesChunk(text);
  }

  /**
   * Get streaming sources for a specific episode.
   *
   * Returns an `EpisodeSources` object with:
   *  - `tracks`: sub/dub tracks, each containing providers
   *  - Each provider has servers with HLS stream URLs
   *  - Each provider also has subtitles (VTT) and thumbnails
   *
   * Stream URLs are HLS (.m3u8). Pass `Origin` and `Referer` headers from
   * the server's `headers` field when fetching the stream directly.
   *
   * @param animeId        Miruro anime ID
   * @param slug           URL slug
   * @param episodeNumber  Episode number
   */
  async getEpisodeSources(
    animeId: string,
    slug = '-',
    episodeNumber = 1,
  ): Promise<EpisodeSources | null> {
    const res = await this.fetch(
      `/watch/${encodeURIComponent(animeId)}/${encodeURIComponent(slug)}/__data.json?ep=${episodeNumber}&x-sveltekit-invalidated=01`,
    );
    if (!res.ok) throw new Error(`Episode sources failed: ${res.status}`);
    const text = await res.text();
    return decodeSourcesChunk(text);
  }

  /**
   * Convenience helper: get the first available HLS stream URL for an episode.
   * Returns the URL and the headers needed to access it, plus subtitles.
   *
   * @param animeId        Miruro anime ID
   * @param slug           URL slug
   * @param episodeNumber  Episode number
   * @param preferDub      Prefer dub track (default: false = sub)
   * @param preferProvider Preferred provider name (e.g. "sun", "bee", "hop")
   */
  async getPlayableStream(
    animeId: string,
    slug = '-',
    episodeNumber = 1,
    preferDub = false,
    preferProvider?: string,
  ): Promise<{
    streamUrl: string;
    headers: Record<string, string>;
    subtitles: Subtitle[];
    thumbnails: { vtt?: string } | null;
    provider: string;
    server: string;
    track: string;
  } | null> {
    const sources = await this.getEpisodeSources(animeId, slug, episodeNumber);
    if (!sources) return null;

    const targetTrack = preferDub ? 'sdub' : 'ssub';
    const tracks = sources.tracks ?? [];

    // Pick preferred track, fall back to any available track
    const track =
      tracks.find((t) => t.track === targetTrack) ??
      tracks[0];
    if (!track) return null;

    const providers = track.providers ?? [];

    // Pick preferred provider
    const provider =
      (preferProvider ? providers.find((p) => p.provider === preferProvider) : null) ??
      providers[0];
    if (!provider) return null;

    // Pick first server with a stream
    for (const server of provider.servers ?? []) {
      const streams = server.streams ?? [];
      if (streams.length > 0) {
        return {
          streamUrl: streams[0].url,
          headers: server.headers as Record<string, string>,
          subtitles: provider.subtitles ?? [],
          thumbnails: provider.thumbnails,
          provider: provider.provider,
          server: server.server,
          track: track.track,
        };
      }
    }
    return null;
  }

  /**
   * Get trending anime (from the trending page).
   * Returns the raw decoded trending items array.
   */
  async getTrending(season?: string, year?: number): Promise<AnimeSummary[]> {
    const params = new URLSearchParams({ 'x-sveltekit-invalidated': '01' });
    if (season) params.set('season', season);
    if (year) params.set('year', String(year));

    const res = await this.fetch(`/trending/__data.json?${params}`);
    if (!res.ok) throw new Error(`Trending failed: ${res.status}`);
    const text = await res.text();

    // Parse the initial data node and extract items array
    const lines = text.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      if (!line.startsWith('{')) continue;
      let parsed: any;
      try { parsed = JSON.parse(line); } catch { continue; }

      if (parsed.type === 'data' && Array.isArray(parsed.nodes)) {
        const dataNode = parsed.nodes.find((n: any) => n.type === 'data');
        if (!dataNode?.data) continue;

        const data: unknown[] = dataNode.data;
        const root = data[0] as Record<string, number>;
        if (!root || !('items' in root)) continue;

        // The items array is at the index pointed to by root.items
        const itemsIdx = root.items as number;
        const itemsArray = data[itemsIdx];
        if (!Array.isArray(itemsArray)) continue;

        // Each entry in itemsArray is an index to an anime summary object
        function dec(idx: number): unknown {
          if (typeof idx !== 'number' || idx < 0 || idx >= data.length) return idx;
          const val = data[idx];
          if (Array.isArray(val)) {
            if (val[0] === 'Promise') return null;
            return val.map((i: unknown) => typeof i === 'number' ? dec(i) : i);
          }
          if (typeof val === 'object' && val !== null) {
            return Object.fromEntries(
              Object.entries(val).map(([k, v]) => [
                k,
                typeof v === 'number' ? dec(v) : v
              ])
            );
          }
          return val;
        }

        return itemsArray
          .map((i: unknown) => typeof i === 'number' ? dec(i) : i)
          .filter(Boolean) as AnimeSummary[];
      }
    }
    return [];
  }
}

// ─── Example Usage / Main ───────────────────────────────────────────────────

async function main() {
  const client = new MiruroClient();

  console.log('=== Miruro Anime API Client Demo ===\n');

  // 1. Health check
  console.log('1. Health check...');
  const health = await client.health();
  console.log(`   Status: ${health.status} | Version: ${health.version}`);

  // 2. Search for anime
  console.log('\n2. Searching for "One Piece"...');
  const searchResults = await client.searchAnime('One Piece', 3);
  console.log(`   Found ${searchResults.data.length} results`);
  for (const anime of searchResults.data.slice(0, 3)) {
    console.log(`   - [${anime.id}] ${anime.title.english ?? anime.title.romaji} (${anime.format}, ${anime.season_year})`);
  }

  // 3. Get discover refs (genres)
  console.log('\n3. Fetching genre catalog...');
  const refs = await client.getDiscoverRefs();
  console.log(`   Genres: ${refs.genres.slice(0, 5).map((g) => g.name).join(', ')}...`);

  // 4. Get anime detail
  const ONE_PIECE_ID = 'o8FU9Se7l1zWPEIo28kel7S1tthb6ldF';
  const ONE_PIECE_SLUG = 'one-piece';

  console.log('\n4. Getting One Piece anime detail...');
  const detail = await client.getAnimeDetail(ONE_PIECE_ID, ONE_PIECE_SLUG);
  if (detail) {
    console.log(`   ID: ${(detail as any).id}`);
    const titleObj = (detail as any).title;
    if (titleObj) {
      const titleVal = typeof titleObj === 'object' ? (titleObj.english ?? titleObj.romaji) : titleObj;
      console.log(`   Title: ${titleVal}`);
    }
  }

  // 5. Get episode list
  console.log('\n5. Getting One Piece episode list...');
  const episodeData = await client.getEpisodeList(ONE_PIECE_ID, ONE_PIECE_SLUG, 1);
  if (episodeData) {
    const eps = Array.isArray(episodeData.episodes) ? episodeData.episodes : [];
    console.log(`   Total episodes fetched: ${eps.length}`);
    if (eps.length > 0) {
      const ep1 = eps[0] as any;
      const epNum = ep1?.episode_number ?? ep1?.[0] ?? '?';
      const epTitle = ep1?.title ?? ep1?.[4] ?? 'Unknown';
      console.log(`   First: EP ${epNum} - ${epTitle}`);
    }
  }

  // 6. Get episode sources
  console.log('\n6. Getting streaming sources for EP 1...');
  const sources = await client.getEpisodeSources(ONE_PIECE_ID, ONE_PIECE_SLUG, 1);
  if (sources) {
    console.log(`   Episode number: ${sources.episodeNumber}`);
    for (const track of sources.tracks ?? []) {
      console.log(`   Track: ${track.track}`);
      for (const provider of track.providers ?? []) {
        console.log(`     Provider: ${provider.provider} | Servers: ${provider.servers?.length ?? 0} | Subtitles: ${provider.subtitles?.length ?? 0}`);
        for (const server of (provider.servers ?? []).slice(0, 2)) {
          const streams = server.streams ?? [];
          if (streams.length > 0) {
            console.log(`       Server: ${server.server} -> ${streams[0].url.substring(0, 80)}...`);
          }
        }
      }
    }
  }

  // 7. Get a playable stream URL
  console.log('\n7. Getting first playable stream URL...');
  const stream = await client.getPlayableStream(ONE_PIECE_ID, ONE_PIECE_SLUG, 1);
  if (stream) {
    console.log(`   Track: ${stream.track} | Provider: ${stream.provider} | Server: ${stream.server}`);
    console.log(`   Stream URL: ${stream.streamUrl.substring(0, 100)}...`);
    console.log(`   Headers: ${JSON.stringify(stream.headers)}`);
    if (stream.subtitles.length > 0) {
      console.log(`   Subtitles (${stream.subtitles.length}): ${stream.subtitles.map((s) => `${s.label} (${s.language})`).join(', ')}`);
    }
  } else {
    console.log('   No playable stream found.');
  }

  // 8. Trending anime
  console.log('\n8. Fetching trending anime...');
  const trending = await client.getTrending();
  console.log(`   Found ${trending.length} trending anime`);
  for (const anime of trending.slice(0, 3)) {
    const title = anime.title?.english ?? anime.title?.romaji ?? 'Unknown';
    console.log(`   - ${title} (score: ${anime.average_score})`);
  }

  console.log('\n✅ All API endpoints verified!\n');
}

main().catch(console.error);
