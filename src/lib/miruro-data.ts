const ORIGIN = "https://miruro.cx";

type WireMessage = { type: "data" | "chunk"; nodes?: { type: string; data?: unknown[] }[]; id?: number; data?: unknown[] };

function unflatten(values: unknown[], start = 0): unknown {
  const seen = new Map<number, unknown>();
  function read(index: number): unknown {
    if (index < 0) return null;
    if (seen.has(index)) return seen.get(index);
    const value = values[index];
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        if (value[0] === "Date") return new Date(String(values[value[1] as number])).toISOString();
        if (value[0] === "Set") return (value.slice(1) as number[]).map(read);
        return null;
      }
      const result: unknown[] = [];
      seen.set(index, result);
      for (const ref of value) result.push(read(ref as number));
      return result;
    }
    const result: Record<string, unknown> = {};
    seen.set(index, result);
    for (const [key, ref] of Object.entries(value)) result[key] = read(ref as number);
    return result;
  }
  return read(start);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function getPageData(path: string) {
  const response = await fetch(`${ORIGIN}${path}`, { next: { revalidate: 300 }, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Miruro returned ${response.status}`);
  const text = await response.text();
  if (!text.startsWith('{"type":"data"')) throw new Error("Miruro returned an unexpected page response");
  const messages = text.trim().split("\n").map((line) => JSON.parse(line) as WireMessage);
  const node = messages[0].nodes?.find((entry) => entry.type === "data");
  const flat: unknown[] = node?.data || [];
  if (!flat.length) throw new Error("Miruro page data unavailable");
  const rootRefs = asRecord(flat[0]);
  const page = asRecord(unflatten(flat));
  const chunks = new Map<number, unknown>();
  for (const message of messages) if (message.type === "chunk" && message.id !== undefined && message.data) chunks.set(message.id, unflatten(message.data));
  function resolve(key: string): unknown {
    const ref = rootRefs[key];
    const value = typeof ref === "number" ? flat[ref] : undefined;
    if (Array.isArray(value) && value[0] === "Promise") return chunks.get(flat[value[1] as number] as number);
    return page[key];
  }
  return { page, resolve };
}

export type MiruroTitle = { id: string; title: string; poster: string | null; slug: string; description: string | null; episodes: number | null };
export type MiruroEpisode = { number: number; title: string; thumbnail: string | null };
export type MiruroSource = { id: string; label: string; url: string; format: string; subtitles: { label: string; url: string; language: string }[] };

function str(value: unknown): string { return typeof value === "string" ? value : ""; }
function num(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }

function mapTitle(raw: unknown): MiruroTitle | null {
  const item = asRecord(raw);
  const title = asRecord(item.title);
  const id = str(item.id);
  if (!id) return null;
  return {
    id,
    title: str(title.english) || str(title.romaji) || str(item.title) || "Untitled",
    poster: str(item.cover_url) || str(asRecord(item.coverImage).large) || null,
    slug: str(item.slug) || (str(title.romaji) || str(title.english)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description: str(item.description) || null,
    episodes: num(item.episode_count) || num(item.episodes),
  };
}

export async function browseMiruro(query = "", cursor = ""): Promise<{ items: MiruroTitle[]; more: boolean; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (query) params.set("q", query.slice(0, 100));
  if (cursor) params.set("cursor", cursor.slice(0, 2000));
  params.set("x-sveltekit-invalidated", "01");
  const data = await getPageData(`/search/__data.json?${params}`);
  const items = Array.isArray(data.page.items) ? data.page.items.map(mapTitle).filter((item): item is MiruroTitle => Boolean(item)) : [];
  return { items, more: Boolean(data.page.hasMore), nextCursor: str(data.page.nextCursor) || null };
}

export async function getMiruroTitle(id: string, slug: string) {
  const data = await getPageData(`/watch/${encodeURIComponent(id)}/${encodeURIComponent(slug)}/__data.json?ep=1&x-sveltekit-invalidated=01`);
  const title = mapTitle(data.page.media);
  const rawEpisodes = asRecord(data.resolve("episodesData"));
  const episodes = Array.isArray(rawEpisodes.episodes) ? rawEpisodes.episodes.map((raw) => {
    const episode = asRecord(raw);
    return { number: num(episode.number) || num(episode.episode_number) || 0, title: str(episode.title) || `Episode ${episode.number}`, thumbnail: str(episode.thumbnail) || null };
  }).filter((episode) => episode.number > 0) : [];
  return { title, episodes };
}

export async function getMiruroSources(id: string, slug: string, episode: number): Promise<MiruroSource[]> {
  const data = await getPageData(`/watch/${encodeURIComponent(id)}/${encodeURIComponent(slug)}/__data.json?ep=${episode}&x-sveltekit-invalidated=01`);
  const sources = asRecord(data.resolve("sourcesData"));
  const tracks = Array.isArray(sources.tracks) ? sources.tracks : [];
  const output: MiruroSource[] = [];
  for (const rawTrack of tracks) {
    const track = asRecord(rawTrack);
    for (const rawProvider of Array.isArray(track.providers) ? track.providers : []) {
      const provider = asRecord(rawProvider);
      const subtitles = (Array.isArray(provider.subtitles) ? provider.subtitles : []).map((raw) => {
        const item = asRecord(raw);
        return { label: str(item.label) || str(item.language), language: str(item.language), url: str(item.file) };
      }).filter((item) => item.url.startsWith("https://"));
      for (const rawServer of Array.isArray(provider.servers) ? provider.servers : []) {
        const server = asRecord(rawServer);
        for (const rawStream of Array.isArray(server.streams) ? server.streams : []) {
          const stream = asRecord(rawStream);
          const url = str(stream.url);
          if (!url.startsWith("https://") || str(stream.format) !== "hls") continue;
          output.push({ id: `${str(track.track)}:${str(provider.provider)}:${str(server.server)}`, label: `${str(track.track).toUpperCase()} · ${str(provider.provider)} · ${str(server.server)}`, url, format: "hls", subtitles });
        }
      }
    }
  }
  return output;
}
