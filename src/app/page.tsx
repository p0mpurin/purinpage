"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { categoryLinks, type LinkItem } from "@/lib/links";
import { getFavorites } from "@/lib/favorites";
import LoadingScreen from "@/components/LoadingScreen";
import Link from "next/link";

function isImageIcon(icon: string) {
  return icon.startsWith("http") || icon.startsWith("/");
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [favoritesList, setFavoritesList] = useState<LinkItem[]>([]);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Load favorites
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  const categories = Object.entries(categoryLinks).map(([slug, data], index) => {
    const isFavSlug = slug === "favorites";
    const linksCount = isFavSlug ? favoritesList.length : data.links.length;
    return {
      slug,
      index: String(index + 1).padStart(2, "0"),
      ...data,
      count: linksCount,
    };
  });

  const totalLinks = categories.reduce((acc, cat) => acc + cat.count, 0);

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] w-full flex-col items-center justify-center px-4 py-4 sm:px-8 md:px-12">
      <div className="relative mx-auto flex w-full max-w-[1420px] flex-col items-center justify-center rounded-3xl border border-[var(--wired-grid)] bg-black/20 p-6 backdrop-blur-[2px] sm:p-8 md:p-10">
        
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center gap-1.5 text-center sm:mb-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_10px_var(--accent-pink)]" />
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--accent-pink)] text-shadow-pink sm:text-sm">
              Categories
            </p>
          </div>
          <p className="font-mono text-xs text-[var(--text-main)] opacity-60">
            {categories.length} Categories · {totalLinks} Links
          </p>
        </div>

        {/* Bubble Grid */}
        <div className="grid w-full grid-cols-3 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-10 md:grid-cols-5 lg:grid-cols-7 lg:gap-x-6 lg:gap-y-9">
          {categories.map((cat, index) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              style={{ animationDelay: `${index * 30}ms` }}
              className="bubble-tile group relative flex w-full max-w-[11.5rem] flex-col items-center gap-3.5 text-center no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)]"
            >
              {/* Circular Bubble Ring */}
              <div className="relative">
                <span className="bubble-ring flex h-[5.75rem] w-[5.75rem] shrink-0 items-center justify-center rounded-full sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-[7.25rem] lg:w-[7.25rem]">
                  {isImageIcon(cat.icon) ? (
                    <img
                      src={cat.icon}
                      alt=""
                      className="bubble-img h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[3rem] leading-none sm:text-[3.5rem]" aria-hidden>
                      {cat.icon}
                    </span>
                  )}
                </span>

                {/* Floating Link Count Badge on Top-Right */}
                <span className="pointer-events-none absolute right-0 top-0 z-20 flex h-6 min-w-6 items-center justify-center rounded-full border border-[var(--accent-pink)]/50 bg-[#0a0a0f] px-1.5 font-mono text-[0.68rem] font-bold text-[var(--accent-pink)] shadow-[0_0_12px_rgba(255,182,193,0.4)] backdrop-blur-md transition-transform duration-300 -translate-y-1 translate-x-1 group-hover:-translate-y-2 group-hover:translate-x-2 group-hover:scale-105">
                  {cat.count}
                </span>
              </div>

              {/* Category Title */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="line-clamp-1 px-1 text-center text-xs font-bold uppercase tracking-wide text-[var(--accent-pink)] text-shadow-pink transition-all duration-300 group-hover:text-white sm:text-sm md:text-[0.95rem]">
                  {cat.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
