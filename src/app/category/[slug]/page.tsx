"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryLinks, type LinkItem } from "@/lib/links";
import { getFavorites, addCustomFavorite } from "@/lib/favorites";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import Link from "next/link";

function isImageIcon(icon: string | undefined) {
  const i = icon || "";
  return i.startsWith("http") || i.startsWith("/");
}

export default function CategoryPage() {
  const router = useRouter();
  const rawParams = useParams();
  const slug = typeof rawParams?.slug === "string" ? rawParams.slug : Array.isArray(rawParams?.slug) ? rawParams.slug[0] : "";
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesList, setFavoritesList] = useState<LinkItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  const category = slug ? categoryLinks[slug] : undefined;
  const isFavoritesCategory = slug === "favorites";
  const allCategoryEntries = Object.entries(categoryLinks);

  useEffect(() => {
    setFavoritesList(getFavorites());
    const handleFavChange = (e: CustomEvent<LinkItem[]>) => {
      setFavoritesList(e.detail || getFavorites());
    };
    window.addEventListener("wired_favorites_change" as any, handleFavChange);

    const checkUser = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setLoading(false);
        return;
      }
      try {
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 400)
        );
        const {
          data: { session },
        } = await Promise.race([supabase.auth.getSession(), timeoutPromise]);
        if (!session && process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true") {
          router.replace("/login");
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    checkUser();

    return () => {
      window.removeEventListener("wired_favorites_change" as any, handleFavChange);
    };
  }, [router, supabase]);

  const rawLinks = isFavoritesCategory ? favoritesList : category?.links || [];

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return rawLinks;

    const query = searchQuery.toLowerCase().trim();
    return rawLinks.filter(
      (link) =>
        link.name.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query)
    );
  }, [rawLinks, searchQuery]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    addCustomFavorite(customName, customUrl);
    setCustomName("");
    setCustomUrl("");
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingScreen label="Connecting" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-[var(--destructive)]">Category Not Found</h1>
        <p className="font-mono text-xs text-[var(--text-main)] opacity-70">
          The requested category could not be found.
        </p>
        <Link href="/" className="primary-btn px-6 py-2 no-underline">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full px-4 pb-28 pt-4 sm:px-8 md:px-12 md:pt-6">
      {/* Background Soft Glow */}
      <div
        className="pointer-events-none absolute left-1/3 top-16 h-80 w-96 rounded-full bg-[var(--accent-pink)] opacity-[0.04] blur-[120px]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px]">
        {/* Category Quick Navigation Chips */}
        <div className="mb-6 flex w-full items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[var(--wired-grid)] bg-black/40 px-3.5 py-1.5 font-mono text-xs font-semibold text-[var(--text-main)] transition-all duration-200 hover:border-[var(--accent-pink)] hover:text-white no-underline"
          >
            ← Hub
          </Link>
          <div className="h-4 w-px bg-[var(--wired-grid)] shrink-0 mx-1" />
          {allCategoryEntries.map(([catSlug, catData]) => {
            const isCurrent = catSlug === slug;
            const count = catSlug === "favorites" ? favoritesList.length : catData.links.length;
            return (
              <Link
                key={catSlug}
                href={`/category/${catSlug}`}
                className={`shrink-0 rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold transition-all duration-200 no-underline ${
                  isCurrent
                    ? "border border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] shadow-[0_0_16px_rgba(255,182,193,0.35)]"
                    : "border border-[var(--wired-grid)] bg-black/30 text-[var(--text-main)] hover:border-[var(--accent-pink)]/40 hover:text-white"
                }`}
              >
                <span className="font-serif mr-1.5 opacity-70">{catData.kanji}</span>
                {catData.title}
                <span className="ml-1.5 rounded-full bg-black/50 px-1.5 py-0.2 font-mono text-[0.62rem] opacity-60">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Hero Category Header */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--wired-grid)] pb-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="bubble-hero-ring shrink-0 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-black/60 shadow-[0_0_20px_rgba(255,182,193,0.3)]">
              {isImageIcon(category.icon) ? (
                <img
                  src={category.icon}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="font-serif text-2xl font-bold text-[var(--accent-pink)]">
                  {category.kanji}
                </span>
              )}
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--accent-pink)] opacity-85">
                  {category.romaji}
                </span>
                <span className="text-white/20">·</span>
                <span className="font-mono text-[0.68rem] text-[var(--text-main)] opacity-60">
                  {rawLinks.length} links
                </span>
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-white text-shadow-pink sm:text-3xl md:text-4xl">
                {category.title}
              </h1>
              <p className="mt-0.5 max-w-xl text-xs text-[var(--text-main)] opacity-75">
                {category.tagline}
              </p>
            </div>
          </div>

          {/* Action Header: Add Custom Link Button + Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isFavoritesCategory && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="shrink-0 rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-pink)] shadow-[0_0_12px_var(--bubble-glow-subtle)] hover:bg-[var(--accent-pink)] hover:text-black transition-all cursor-pointer"
              >
                + Add Custom Link
              </button>
            )}

            {/* Live Filter / Search Input */}
            <div className="relative w-full sm:w-64 md:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
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
                placeholder="Search in category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--wired-grid)] bg-black/40 py-2.5 pl-10 pr-9 font-mono text-xs text-white placeholder:text-[var(--text-main)]/40 focus:border-[var(--accent-pink)] focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-pink)] transition-all duration-200"
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
          </div>
        </header>

        {/* Add Custom Link Inline Modal */}
        {showAddModal && (
          <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[#0c0a14]/95 p-6 backdrop-blur-xl shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[var(--wired-grid)] pb-3 mb-4">
              <h3 className="font-mono text-sm font-bold uppercase text-[var(--accent-pink)]">
                Add Custom Favorite Link
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddCustom} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Site Name (e.g. My Anime Site)..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full sm:w-1/3 rounded-xl border border-[var(--border)] bg-black/60 px-4 py-2.5 font-mono text-xs text-white placeholder:text-white/30 focus:border-[var(--accent-pink)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Website URL (e.g. https://...)..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                required
                className="w-full sm:flex-1 rounded-xl border border-[var(--border)] bg-black/60 px-4 py-2.5 font-mono text-xs text-white placeholder:text-white/30 focus:border-[var(--accent-pink)] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)] px-6 py-2.5 font-mono text-xs font-bold uppercase text-black hover:bg-white transition-all cursor-pointer shrink-0"
              >
                Save Link
              </button>
            </form>
          </div>
        )}

        {/* Grid of Clean Cards */}
        {filteredLinks.length > 0 ? (
          <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLinks.map((link, index) => (
              <LinkPreviewCard
                key={`${link.url}-${index}`}
                name={link.name}
                url={link.url}
                categoryIcon={category.icon}
                animationDelay={`${Math.min(index, 20) * 30}ms`}
              />
            ))}
          </div>
        ) : (
          /* Empty Favorites / Search State */
          <div className="my-14 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--wired-grid)] bg-black/20 p-12 text-center">
            <span className="font-serif text-4xl text-[var(--accent-pink)]">星</span>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent-pink)]">
              {isFavoritesCategory ? "No favorites yet" : "No matching links found"}
            </p>
            <p className="font-mono text-xs text-[var(--text-main)] opacity-60 max-w-sm">
              {isFavoritesCategory
                ? "Click the star (★) on any link card across any category, or add your own custom links using the button above."
                : `No links matched "${searchQuery}" in this category.`}
            </p>
            {isFavoritesCategory ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-2 rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)]/20 px-5 py-2 font-mono text-xs font-bold uppercase text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition-all cursor-pointer"
              >
                + Add Your First Link
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 rounded-lg border border-[var(--accent-pink)]/40 bg-[var(--accent-pink)]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--accent-pink)] transition-all hover:bg-[var(--accent-pink)]/20 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
