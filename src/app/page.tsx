"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { categoryLinks } from "@/lib/links";
import LoadingScreen from "@/components/LoadingScreen";

function isImageIcon(icon: string) {
  return icon.startsWith("http") || icon.startsWith("/");
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

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
        <LoadingScreen />
      </div>
    );
  }

  const categories = Object.entries(categoryLinks).map(([slug, data]) => ({
    slug,
    ...data,
  }));

  return (
    <div className="min-h-screen w-full overflow-y-auto px-4 pb-28 pt-4 md:px-8 md:pt-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-10 text-center text-[0.7rem] uppercase tracking-[0.45em] text-[var(--text-main)] opacity-75 md:mb-14 md:text-xs">
          Select a cluster
        </p>
        <div className="mx-auto grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-x-4 gap-y-12 sm:grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] sm:gap-x-6 md:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
          {categories.map((cat, index) => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              style={{ animationDelay: `${index * 45}ms` }}
              className="bubble-tile category-bubble group flex flex-col items-center gap-4 tracking-normal no-underline hover:!tracking-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span className="bubble-ring bubble-ring-lg flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center rounded-full sm:h-24 sm:w-24 md:h-28 md:w-28">
                {isImageIcon(cat.icon) ? (
                  <img src={cat.icon} alt="" className="bubble-img h-full w-full object-cover" />
                ) : (
                  <span className="text-[3rem] leading-none sm:text-[3.35rem] md:text-[3.75rem]" aria-hidden>
                    {cat.icon}
                  </span>
                )}
              </span>
              <span className="max-w-[10rem] text-center text-sm font-bold uppercase tracking-[0.1em] text-[var(--accent-pink)] transition-[color,transform] duration-300 group-hover:text-white md:text-base">
                {cat.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
