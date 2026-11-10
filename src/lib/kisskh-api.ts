const CATALOG = "https://kisskh.id";
const PLAYER = "https://kisskh.megaplay.su";

export type DramaCard = { id: number; title: string; thumbnail: string; episodesCount: number };
export type DramaEpisode = { id: number; number: number; sub: number };
export type DramaDetail = DramaCard & { description: string; country: string; status: string; type: string; episodes: DramaEpisode[] };
export type DramaSource = { url: string; subtitles: { label: string; url: string; language: string }[] };

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${CATALOG}${path}`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Drama source returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function browseDrama(query: string, page: number) {
  if (query) {
    const results = await getJson<DramaCard[]>(`/api/DramaList/Search?q=${encodeURIComponent(query.slice(0, 100))}`);
    return { items: results, more: false };
  }
  if (page === 1) {
    const items = await getJson<DramaCard[]>("/api/DramaList/LastUpdate?ispc=true");
    return { items, more: true };
  }
  const data = await getJson<{ data: DramaCard[]; totalCount: number }>(`/api/DramaList/List?page=${page}&pageSize=24`);
  return { items: data.data, more: page * 24 < data.totalCount };
}

export function getDrama(id: number) {
  return getJson<DramaDetail>(`/api/DramaList/Drama/${id}?isq=false`);
}

function mediaPath(url: string) {
  const parsed = new URL(url);
  if (parsed.origin !== PLAYER || !/^\/(vid|sub)\/[A-Za-z0-9_./-]+$/.test(parsed.pathname)) throw new Error("Invalid drama media URL");
  return `/api/cinema/drama/media?url=${encodeURIComponent(parsed.toString())}`;
}

export async function getDramaSource(episodeId: number): Promise<DramaSource> {
  const response = await fetch(`${PLAYER}/kisskh/${episodeId}`, {
    headers: { Referer: "https://kisskh.id/" }, cache: "no-store",
  });
  if (!response.ok) throw new Error(`Drama player returned ${response.status}`);
  const html = await response.text();
  const payload = html.match(/<script type="application\/json" id="player-payload">([^<]+)<\/script>/)?.[1];
  if (!payload) throw new Error("Drama player source unavailable");
  const data = JSON.parse(payload) as { source?: string; tracks?: { file?: string; label?: string }[] };
  if (!data.source) throw new Error("Drama video source unavailable");
  return {
    url: mediaPath(data.source),
    subtitles: (data.tracks || []).filter((track) => track.file).sort((a, b) => Number(/english/i.test(b.label || "")) - Number(/english/i.test(a.label || ""))).map((track) => ({
      label: track.label || "Subtitle", url: mediaPath(track.file!),
      language: /english/i.test(track.label || "") ? "en" : "und",
    })),
  };
}

export function validateDramaMediaUrl(raw: string) {
  const url = new URL(raw);
  if (url.origin !== PLAYER || !/^\/(vid|sub)\/[A-Za-z0-9_./-]+$/.test(url.pathname)) throw new Error("Invalid drama media URL");
  return url;
}

export function proxyDramaMediaUrl(url: string) { return mediaPath(url); }
