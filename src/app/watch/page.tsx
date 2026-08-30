"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";

interface MediaItem {
  id: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string | null;
  backdropPath: string | null;
  year: string;
  rating: string;
  overview: string;
}

interface SeasonItem {
  seasonNumber: number;
  name: string;
  episodeCount: number;
}

interface EpisodeItem {
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
}

interface MediaDetails extends MediaItem {
  genres: string[];
  imdbId?: string | null;
  totalSeasons: number;
  totalEpisodes: number;
  seasons: SeasonItem[];
}

interface ServerOption {
  id: string;
  name: string;
  badge: string;
  latency?: number;
}

const DEFAULT_VERIFIED_SERVERS: ServerOption[] = [
  { id: "vidlink", name: "Server 1 (VidLink HD)", badge: "Fast 1080p" },
  { id: "vidsrc_su", name: "Server 2 (VidSrc SU)", badge: "New Releases" },
  { id: "superembed", name: "Server 3 (SuperEmbed)", badge: "Multi-Source" },
  { id: "smashystream", name: "Server 4 (SmashyStream)", badge: "Clean Stream" },
  { id: "rivestream", name: "Server 5 (RiveStream)", badge: "4K / Sub" },
  { id: "vidsrc_to", name: "Server 6 (VidSrc TO)", badge: "Backup Mirror" },
];

export default function WatchPage() {
  const [activeTab, setActiveTab] = useState<"trending" | "anime" | "kdrama">("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Active Playing State
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState<EpisodeItem[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [availableServers, setAvailableServers] = useState<ServerOption[]>(DEFAULT_VERIFIED_SERVERS);
  const [checkingServers, setCheckingServers] = useState(false);
  const [activeServer, setActiveServer] = useState("vidlink");
  const [theaterMode, setTheaterMode] = useState(false);
  const [isAdBlockShieldActive, setIsAdBlockShieldActive] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);
  const catalogGridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch initial catalog on tab switch or search
  useEffect(() => {
    let isCancelled = false;
    setCatalogItems([]);
    setPage(1);
    setHasMore(true);
    setLoadingInitial(true);

    const fetchInitial = async () => {
      try {
        let url = `/api/watch/search?mode=${activeTab}&page=1`;
        if (searchQuery.trim().length >= 2) {
          url = `/api/watch/search?query=${encodeURIComponent(searchQuery.trim())}&page=1`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setCatalogItems(data.results || []);
            setHasMore((data.results || []).length >= 12 && (data.page < (data.totalPages || 1)));
          }
        }
      } catch {
        // ignore
      } finally {
        if (!isCancelled) setLoadingInitial(false);
      }
    };

    const debounce = setTimeout(fetchInitial, searchQuery ? 300 : 0);
    return () => {
      isCancelled = true;
      clearTimeout(debounce);
    };
  }, [activeTab, searchQuery]);

  // Load next page function
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loadingInitial) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      let url = `/api/watch/search?mode=${activeTab}&page=${nextPage}`;
      if (searchQuery.trim().length >= 2) {
        url = `/api/watch/search?query=${encodeURIComponent(searchQuery.trim())}&page=${nextPage}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newResults: MediaItem[] = data.results || [];
        if (newResults.length > 0) {
          setCatalogItems((prev) => {
            const seen = new Set(prev.map((i) => `${i.type}-${i.id}`));
            const filtered = newResults.filter((i) => !seen.has(`${i.type}-${i.id}`));
            return [...prev, ...filtered];
          });
          setPage(nextPage);
          setHasMore(nextPage < (data.totalPages || 1));
        } else {
          setHasMore(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loadingInitial, page, activeTab, searchQuery]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  // Fetch media details (seasons & imdbId) when media is selected
  useEffect(() => {
    if (!selectedMedia) return;

    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/watch/search?mode=details&id=${selectedMedia.id}&type=${selectedMedia.type}`);
        if (res.ok) {
          const details: MediaDetails = await res.json();
          setMediaDetails(details);
          if (details.type === "tv") {
            const firstSeason = details.seasons?.[0]?.seasonNumber || 1;
            setSelectedSeason(firstSeason);
            setSelectedEpisode(1);
          }
        }
      } catch {
        // fallback
      }
    };
    fetchDetails();
  }, [selectedMedia]);

  // Live Server Health Check & Filter
  useEffect(() => {
    if (!selectedMedia) return;

    const checkServerHealth = async () => {
      setCheckingServers(true);
      try {
        const imdbParam = mediaDetails?.imdbId ? `&imdbId=${mediaDetails.imdbId}` : "";
        const res = await fetch(
          `/api/watch/servers?id=${selectedMedia.id}&type=${selectedMedia.type}&season=${selectedSeason}&episode=${selectedEpisode}${imdbParam}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.servers && data.servers.length > 0) {
            setAvailableServers(data.servers);
            if (!data.servers.some((s: ServerOption) => s.id === activeServer)) {
              setActiveServer(data.servers[0].id);
            }
          }
        }
      } catch {
        // keep defaults
      } finally {
        setCheckingServers(false);
      }
    };

    checkServerHealth();
  }, [selectedMedia, selectedSeason, selectedEpisode, mediaDetails?.imdbId]);

  // Fetch episode list when season changes on a TV show
  useEffect(() => {
    if (!selectedMedia || selectedMedia.type !== "tv") return;

    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/watch/search?mode=episodes&id=${selectedMedia.id}&season=${selectedSeason}`);
        if (res.ok) {
          const data = await res.json();
          setEpisodesList(data.episodes || []);
        }
      } catch {
        // fallback
      } finally {
        setLoadingEpisodes(false);
      }
    };
    fetchEpisodes();
  }, [selectedMedia, selectedSeason]);

  const handleSelectMedia = (item: MediaItem) => {
    setSelectedMedia(item);
    setMediaDetails(null);
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleBackToMenu = () => {
    setSelectedMedia(null);
    setTimeout(() => {
      catalogGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Generate Stream URL based on Verified Server and Media
  const streamUrl = useMemo(() => {
    if (!selectedMedia) return "";
    const id = selectedMedia.id;
    const imdb = mediaDetails?.imdbId;
    const isTv = selectedMedia.type === "tv";

    switch (activeServer) {
      case "vidlink":
        return isTv
          ? `https://vidlink.pro/tv/${id}/${selectedSeason}/${selectedEpisode}?primaryColor=ffb6c1`
          : `https://vidlink.pro/movie/${id}?primaryColor=ffb6c1`;
      case "vidsrc_su":
        return isTv
          ? `https://vidsrc.su/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`
          : `https://vidsrc.su/embed/movie/${id}`;
      case "superembed":
        return isTv
          ? `https://multiembed.mov/?video_id=${imdb || id}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}`
          : `https://multiembed.mov/?video_id=${imdb || id}${imdb ? "" : "&tmdb=1"}`;
      case "smashystream":
        return isTv
          ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${selectedSeason}&episode=${selectedEpisode}`
          : `https://embed.smashystream.com/playere.php?tmdb=${id}`;
      case "rivestream":
        return isTv
          ? `https://rivestream.live/embed?type=tv&id=${id}&season=${selectedSeason}&episode=${selectedEpisode}`
          : `https://rivestream.live/embed?type=movie&id=${id}`;
      case "vidsrc_to":
        return isTv
          ? `https://vidsrc.to/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`
          : `https://vidsrc.to/embed/movie/${id}`;
      default:
        return `https://vidlink.pro/${isTv ? "tv" : "movie"}/${id}`;
    }
  }, [selectedMedia, activeServer, selectedSeason, selectedEpisode, mediaDetails]);

  return (
    <div className="relative min-h-[100dvh] w-full px-4 pb-28 pt-4 sm:px-8 md:px-12 md:pt-6">
      {/* Background Soft Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-10 h-96 w-[700px] -translate-x-1/2 rounded-full bg-[var(--accent-pink)] opacity-[0.04] blur-[160px]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1440px]">
        
        {/* Top Header & Cyber Cinema Intro */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--wired-grid)] pb-5 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
              <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[var(--accent-pink)]">
                [WIRED.CINEMA // STREAM STUDIO]
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white text-shadow-pink sm:text-3xl">
              Cinema
            </h1>
            <p className="text-xs text-[var(--text-main)] opacity-70">
              High-definition direct streaming for Movies, Series, Anime, and Asian Cinema.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-pink)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search title, series or anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[var(--wired-grid)] bg-black/60 py-2.5 pl-10 pr-9 font-mono text-xs text-white placeholder:text-[var(--text-main)]/40 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-pink)] transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-xs text-[var(--text-main)] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE STREAM PLAYER SECTION */}
        {selectedMedia && (
          <section
            ref={playerRef}
            className={`mb-10 overflow-hidden rounded-3xl border border-[var(--border)] bg-[#090710]/95 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
              theaterMode ? "max-w-full" : "max-w-6xl mx-auto"
            }`}
          >
            {/* Top Return to Menu Bar */}
            <div className="mb-4 flex items-center justify-between border-b border-[var(--wired-grid)] pb-3">
              <button
                type="button"
                onClick={handleBackToMenu}
                className="group flex items-center gap-2 rounded-xl border border-[var(--wired-grid)] bg-black/70 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white/90 hover:border-[var(--accent-pink)] hover:bg-[var(--accent-pink)]/10 hover:text-[var(--accent-pink)] transition-all cursor-pointer shadow-sm"
              >
                <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                <span>Back to Menu</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Ad-Block Shield Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAdBlockShieldActive(!isAdBlockShieldActive)}
                  title={isAdBlockShieldActive ? "Ad-Block Shield Active" : "Shield Relaxed"}
                  className={`rounded-xl px-2.5 py-1 font-mono text-[0.68rem] font-bold uppercase transition-all cursor-pointer border ${
                    isAdBlockShieldActive
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/50 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {isAdBlockShieldActive ? "Shield [ON]" : "Shield [OFF]"}
                </button>

                {/* Close Player */}
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  title="Close Player"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-mono text-xs text-red-300 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Title + Server Selector */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 text-left">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--accent-pink)]/20 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase text-[var(--accent-pink)]">
                    {selectedMedia.type === "movie" ? "Movie" : "Series"}
                  </span>
                  <span className="font-mono text-xs text-white/50">{selectedMedia.year}</span>
                  {selectedMedia.rating && (
                    <span className="font-mono text-xs text-amber-300">Rating: {selectedMedia.rating}</span>
                  )}
                  {checkingServers && (
                    <span className="font-mono text-[0.62rem] text-[var(--accent-pink)] animate-pulse">
                      · Checking servers...
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-lg sm:text-xl font-bold uppercase text-white tracking-wide">
                  {selectedMedia.title}
                  {selectedMedia.type === "tv" && (
                    <span className="ml-2 font-mono text-sm font-semibold text-[var(--accent-pink)]">
                      S{selectedSeason} · E{selectedEpisode}
                    </span>
                  )}
                </h2>
              </div>

              {/* Verified Online Servers Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="font-mono text-[0.65rem] text-white/40 uppercase shrink-0">Server:</span>
                {availableServers.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setActiveServer(srv.id)}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      activeServer === srv.id
                        ? "bg-[var(--accent-pink)] text-black font-bold shadow-[0_0_12px_var(--bubble-glow-subtle)]"
                        : "bg-black/60 text-white/70 hover:text-white border border-[var(--wired-grid)]"
                    }`}
                  >
                    {srv.name}
                    {srv.latency && (
                      <span className="ml-1.5 text-[0.6rem] opacity-70">
                        {srv.latency}ms
                      </span>
                    )}
                  </button>
                ))}

                {/* Theater Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setTheaterMode(!theaterMode)}
                  title={theaterMode ? "Normal View" : "Theater View"}
                  className="rounded-xl border border-[var(--wired-grid)] bg-black/60 p-2 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M10 4v4M14 4v4M10 20v-4M14 20v-4"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Video Embed Container */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-[var(--wired-grid)] aspect-video">
              <iframe
                src={streamUrl}
                title={selectedMedia.title}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                sandbox={
                  isAdBlockShieldActive
                    ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation-by-user-activation"
                    : undefined
                }
                className="h-full w-full border-0"
              />
            </div>

            {/* Quick Server Switcher Helper / Fallback Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--wired-grid)] bg-black/40 px-3.5 py-2 text-left">
              <div className="flex items-center gap-2 font-mono text-[0.68rem] text-white/60">
                <span className="text-[var(--accent-pink)]">⚡ Stream Tip:</span>
                <span>If a video is buffering or unavailable, try switching to another server above.</span>
              </div>
              <div className="flex items-center gap-1.5">
                {availableServers.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveServer(s.id)}
                    className={`rounded-lg px-2 py-0.5 font-mono text-[0.65rem] transition-colors cursor-pointer ${
                      activeServer === s.id
                        ? "bg-[var(--accent-pink)] text-black font-bold"
                        : "bg-white/10 text-white/70 hover:text-white"
                    }`}
                  >
                    {s.name.split(" ")[0]} {s.name.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* TV Show / K-Drama Season & Episode Grid Picker */}
            {selectedMedia.type === "tv" && mediaDetails && (
              <div className="mt-6 border-t border-[var(--wired-grid)] pt-4 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <span className="font-mono text-xs text-white/50 uppercase shrink-0">Season:</span>
                    {mediaDetails.seasons?.map((s) => (
                      <button
                        key={s.seasonNumber}
                        type="button"
                        onClick={() => setSelectedSeason(s.seasonNumber)}
                        className={`rounded-xl px-3 py-1 font-mono text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                          selectedSeason === s.seasonNumber
                            ? "bg-[var(--accent-pink)] text-black font-bold"
                            : "bg-black/60 text-white/70 hover:text-white border border-[var(--wired-grid)]"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {/* Prev / Next Episode Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={selectedEpisode <= 1}
                      onClick={() => setSelectedEpisode((prev) => Math.max(1, prev - 1))}
                      className="rounded-lg border border-[var(--wired-grid)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white disabled:opacity-30 cursor-pointer"
                    >
                      ← Prev Ep
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEpisode((prev) => prev + 1)}
                      className="rounded-lg border border-[var(--wired-grid)] bg-black/60 px-2.5 py-1 font-mono text-xs text-white cursor-pointer"
                    >
                      Next Ep →
                    </button>
                  </div>
                </div>

                {/* Episodes Grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                  {loadingEpisodes ? (
                    <div className="col-span-full py-6 text-center font-mono text-xs text-white/50">
                      Loading episodes...
                    </div>
                  ) : episodesList.length > 0 ? (
                    episodesList.map((ep) => {
                      const isCurrent = selectedEpisode === ep.episodeNumber;
                      return (
                        <button
                          key={ep.episodeNumber}
                          type="button"
                          onClick={() => setSelectedEpisode(ep.episodeNumber)}
                          className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? "border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 shadow-[0_0_12px_var(--bubble-glow-subtle)]"
                              : "border-[var(--wired-grid)] bg-black/40 hover:border-white/30"
                          }`}
                        >
                          <span className="font-mono text-[0.68rem] font-bold text-[var(--accent-pink)]">
                            EP {ep.episodeNumber}
                          </span>
                          <span className="truncate text-xs font-semibold text-white/90">
                            {ep.name}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    Array.from({ length: 12 }).map((_, idx) => {
                      const epNum = idx + 1;
                      const isCurrent = selectedEpisode === epNum;
                      return (
                        <button
                          key={epNum}
                          type="button"
                          onClick={() => setSelectedEpisode(epNum)}
                          className={`p-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? "border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 text-[var(--accent-pink)]"
                              : "border-[var(--wired-grid)] bg-black/40 text-white/70 hover:text-white"
                          }`}
                        >
                          Episode {epNum}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Synopsis Overview */}
            {selectedMedia.overview && (
              <div className="mt-4 pt-3 border-t border-[var(--wired-grid)] text-left">
                <p className="line-clamp-2 text-xs text-white/70">
                  {selectedMedia.overview}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Catalog Grid Anchor */}
        <div ref={catalogGridRef} />

        {/* Category Mode Selector Tabs */}
        {!searchQuery && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-left">
            <button
              type="button"
              onClick={() => setActiveTab("trending")}
              className={`rounded-2xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "trending"
                  ? "bg-[var(--accent-pink)] text-black shadow-[0_0_16px_var(--bubble-glow-subtle)]"
                  : "bg-black/50 text-white/70 hover:text-white border border-[var(--wired-grid)]"
              }`}
            >
              Trending Movies & Shows
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("anime")}
              className={`rounded-2xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "anime"
                  ? "bg-[var(--accent-pink)] text-black shadow-[0_0_16px_var(--bubble-glow-subtle)]"
                  : "bg-black/50 text-white/70 hover:text-white border border-[var(--wired-grid)]"
              }`}
            >
              Anime Series
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("kdrama")}
              className={`rounded-2xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "kdrama"
                  ? "bg-[var(--accent-pink)] text-black shadow-[0_0_16px_var(--bubble-glow-subtle)]"
                  : "bg-black/50 text-white/70 hover:text-white border border-[var(--wired-grid)]"
              }`}
            >
              Asian Cinema & Drama
            </button>
          </div>
        )}

        {/* Discovery & Infinite Search Results Grid */}
        {loadingInitial ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 text-left">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-black/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : catalogItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 text-left">
              {catalogItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectMedia(item)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--wired-grid)] bg-black/40 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent-pink)] hover:shadow-[0_0_20px_var(--bubble-glow-subtle)] cursor-pointer"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/80">
                    {item.posterPath ? (
                      <img
                        src={item.posterPath}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/90 p-3 text-center font-mono text-xs text-white/40">
                        {item.title}
                      </div>
                    )}

                    {/* Rating Pill */}
                    {item.rating && item.rating !== "N/A" && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[0.62rem] font-bold text-white backdrop-blur-md border border-white/10">
                        <span>{item.rating}</span>
                      </div>
                    )}

                    <span className="absolute bottom-2 left-2 rounded-md bg-[var(--accent-pink)]/90 px-1.5 py-0.5 font-mono text-[0.6rem] font-black uppercase text-black">
                      {item.type === "movie" ? "Movie" : "Series"}
                    </span>
                  </div>

                  {/* Info Card */}
                  <div className="p-3 bg-black/60">
                    <h3 className="truncate font-mono text-xs font-bold text-white group-hover:text-[var(--accent-pink)] transition-colors">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[0.68rem] text-white/50 font-mono">
                      <span>{item.year || "N/A"}</span>
                      <span className="text-[var(--accent-pink)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        PLAY
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Sentinel for Infinite Scroll */}
            <div ref={sentinelRef} className="py-8 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent-pink)]">
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--accent-pink)] border-t-transparent animate-spin" />
                  <span>Loading more titles...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="my-16 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--wired-grid)] bg-black/20 p-12 text-center">
            <span className="font-serif text-4xl text-[var(--accent-pink)]">線</span>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent-pink)]">
              No results found for &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 rounded-xl border border-[var(--accent-pink)]/40 bg-[var(--accent-pink)]/10 px-4 py-1.5 font-mono text-xs uppercase text-[var(--accent-pink)] hover:bg-[var(--accent-pink)]/20 cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
