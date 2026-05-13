"use client";

import { use, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { categoryLinks } from "@/lib/links";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import LinkPreviewCard from "@/components/LinkPreviewCard";
import { LINK_SORT_TIER, type LinkSortBucket } from "@/lib/link-sort";

function isImageIcon(icon: string | undefined) {
  const i = icon || "";
  return i.startsWith("http") || i.startsWith("/");
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(true);
  const { slug } = use(params);
  const [sortTierByKey, setSortTierByKey] = useState<Record<string, number>>({});

  const category = categoryLinks[slug];

  const updateSort = useCallback((sortKey: string, bucket: LinkSortBucket) => {
    const tier = LINK_SORT_TIER[bucket];
    setSortTierByKey((prev) => {
      if (prev[sortKey] === tier) return prev;
      return { ...prev, [sortKey]: tier };
    });
  }, []);

  const sortedLinkEntries = useMemo(() => {
    if (!category) return [];
    const pending = LINK_SORT_TIER.pending;
    const entries = category.links.map((link, originalIndex) => ({
      link,
      originalIndex,
      sortKey: `${link.url}::${link.name}`,
    }));
    return [...entries].sort((a, b) => {
      const ta = sortTierByKey[a.sortKey] ?? pending;
      const tb = sortTierByKey[b.sortKey] ?? pending;
      if (ta !== tb) return ta - tb;
      return a.originalIndex - b.originalIndex;
    });
  }, [category, sortTierByKey]);

  useEffect(() => {
    startTransition(() => {
      setSortTierByKey({});
    });
  }, [slug]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingScreen label="Loading" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold text-[var(--destructive)]">Category not found</h1>
        <button type="button" onClick={() => router.push("/")} className="primary-btn px-6 py-2">
          Back to hub
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[min(100%,88rem)] flex-col px-5 pb-28 pt-6 sm:px-8 md:px-12 md:pt-12">
      <header className="mb-14 md:mb-16 lg:mb-20">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bubble-back mb-8 flex items-center gap-2 border-none bg-transparent text-sm uppercase tracking-[0.2em] text-[var(--accent-pink)] transition-[color,transform] duration-300 hover:translate-x-[-2px] hover:text-white"
        >
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover:-translate-x-0.5">
            ←
          </span>
          Hub
        </button>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="bubble-hero-ring shrink-0 animate-[header-pop_0.6s_cubic-bezier(0.22,1,0.36,1)_both]">
            {isImageIcon(category.icon) ? (
              <img
                src={category.icon}
                alt=""
                className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24 md:h-28 md:w-28"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center text-[3rem] sm:h-24 sm:w-24 sm:text-[3.25rem] md:h-28 md:w-28 md:text-[3.5rem]">
                {category.icon}
              </span>
            )}
          </div>
          <div className="min-w-0 animate-[fade-rise_0.65s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
            <h1 className="text-3xl font-bold uppercase tracking-[0.1em] text-[var(--foreground)] sm:text-4xl md:text-5xl">
              {category.title}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[80rem] grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-9 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4">
        {sortedLinkEntries.map(({ link, sortKey }, index) => (
          <LinkPreviewCard
            key={sortKey}
            sortKey={sortKey}
            name={link.name}
            url={link.url}
            animationDelay={`${Math.min(index, 24) * 45}ms`}
            onSortUpdate={updateSort}
          />
        ))}
      </div>
    </div>
  );
}
