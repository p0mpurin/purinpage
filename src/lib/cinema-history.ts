export interface CinemaHistoryItem {
  id: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string | null;
  backdropPath: string | null;
  year: string;
  rating?: string;
  overview?: string;
  season?: number;
  episode?: number;
  updatedAt: number;
}

const HISTORY_KEY = "wired_cinema_history_v1";
const WATCHLIST_KEY = "wired_cinema_watchlist_v1";
const WATCHED_EPISODES_KEY = "wired_cinema_watched_episodes_v1";

// --- WATCH HISTORY ---

export function getCinemaHistory(): CinemaHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCinemaHistory(item: Omit<CinemaHistoryItem, "updatedAt"> & { season?: number; episode?: number }) {
  if (typeof window === "undefined") return;
  try {
    const history = getCinemaHistory();
    const existingIndex = history.findIndex((h) => h.id === item.id && h.type === item.type);
    
    const newItem: CinemaHistoryItem = {
      ...item,
      updatedAt: Date.now(),
    };

    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    
    history.unshift(newItem);
    // Keep last 30 items
    const trimmed = history.slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent("wired_cinema_change"));
  } catch {
    // ignore
  }
}

export function removeCinemaHistoryItem(id: number, type: "movie" | "tv") {
  if (typeof window === "undefined") return;
  try {
    const history = getCinemaHistory().filter((h) => !(h.id === id && h.type === type));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent("wired_cinema_change"));
  } catch {
    // ignore
  }
}

export function clearCinemaHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent("wired_cinema_change"));
  } catch {
    // ignore
  }
}

// --- WATCHLIST / BOOKMARKS ---

export function getCinemaWatchlist(): CinemaHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isCinemaWatchlisted(id: number, type: "movie" | "tv"): boolean {
  return getCinemaWatchlist().some((w) => w.id === id && w.type === type);
}

export function toggleCinemaWatchlist(item: Omit<CinemaHistoryItem, "updatedAt">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getCinemaWatchlist();
    const index = list.findIndex((w) => w.id === item.id && w.type === item.type);
    let isAdded = false;

    if (index > -1) {
      list.splice(index, 1);
      isAdded = false;
    } else {
      list.unshift({ ...item, updatedAt: Date.now() });
      isAdded = true;
    }

    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("wired_cinema_change"));
    return isAdded;
  } catch {
    return false;
  }
}

// --- WATCHED EPISODES TRACKER ---

export function getWatchedEpisodes(mediaId: number): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WATCHED_EPISODES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed[mediaId] || {};
  } catch {
    return {};
  }
}

export function markEpisodeWatched(mediaId: number, season: number, episode: number, watched: boolean = true) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(WATCHED_EPISODES_KEY);
    const store = raw ? JSON.parse(raw) : {};
    if (!store[mediaId]) store[mediaId] = {};
    
    const epKey = `S${season}E${episode}`;
    if (watched) {
      store[mediaId][epKey] = true;
    } else {
      delete store[mediaId][epKey];
    }
    
    localStorage.setItem(WATCHED_EPISODES_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("wired_cinema_change"));
  } catch {
    // ignore
  }
}
