"use client";

import { use, useEffect, useState } from "react";
import { categoryLinks } from "@/lib/links";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const supabase = createSupabaseClient();
    const [loading, setLoading] = useState(true);
    const [deadLinks, setDeadLinks] = useState<Set<string>>(new Set());
    const [checking, setChecking] = useState(false);
    const [progress, setProgress] = useState({ checked: 0, total: 0 });

    // Unwrap params using React.use()
    const { slug } = use(params);

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

    useEffect(() => {
        if (loading) return;
        const category = categoryLinks[slug];
        if (!category) return;

        const cacheKey = `dead-links:${slug}`;
        void (async () => {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            setDeadLinks(new Set(JSON.parse(cached)));
            return;
        }

        const allUrls = category.links.map((l) => l.url);
        const BATCH = 8;
        setChecking(true);
        setProgress({ checked: 0, total: allUrls.length });

        const allDead: string[] = [];
        for (let i = 0; i < allUrls.length; i += BATCH) {
            const batch = allUrls.slice(i, i + BATCH);
            try {
                const res = await fetch("/api/check-links", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ urls: batch }),
                });
                const { dead }: { dead: string[] } = await res.json();
                allDead.push(...dead);
                setDeadLinks((prev) => new Set([...prev, ...dead]));
            } catch {
                // silently keep links if a batch fails
            }
            setProgress({ checked: Math.min(i + BATCH, allUrls.length), total: allUrls.length });
        }

        sessionStorage.setItem(cacheKey, JSON.stringify(allDead));
        setChecking(false);
        })();
    }, [loading, slug]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                Loading...
            </div>
        );
    }

    const category = categoryLinks[slug];
    const visibleLinks = category?.links.filter((link) => !deadLinks.has(link.url)) ?? [];
    const removedCount = (category?.links.length ?? 0) - visibleLinks.length;

    if (!category) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-5">
                <h1 className="text-2xl font-bold text-[var(--destructive)]">CATEGORY NOT FOUND</h1>
                <button
                    onClick={() => router.push("/")}
                    className="primary-btn"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-[1200px] mx-auto min-h-screen flex flex-col">
            <header className="mb-10">
                <button
                    onClick={() => router.push("/")}
                    className="text-[var(--accent-pink)] hover:text-white transition-colors mb-4 flex items-center gap-2 cursor-pointer bg-transparent border-none text-base"
                >
                    ← Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                    {category.icon.startsWith("http") || category.icon.startsWith("/") ? (
                        <img
                            src={category.icon}
                            alt={category.title}
                            className="w-16 h-16 object-cover rounded-full"
                        />
                    ) : (
                        <span className="text-[3rem]">{category.icon}</span>
                    )}
                    <h1 className="text-[2.5rem] font-bold uppercase tracking-wider text-[var(--foreground)]">
                        {category.title}
                    </h1>
                </div>
                {checking && (
                    <div className="mt-4 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs opacity-50 w-64">
                            <span className="tracking-wider uppercase">Scanning links</span>
                            <span>{progress.checked} / {progress.total}</span>
                        </div>
                        <div className="h-[2px] w-64 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--accent-pink)] rounded-full transition-all duration-500"
                                style={{ width: `${progress.total > 0 ? (progress.checked / progress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}
                {!checking && removedCount > 0 && (
                    <p className="text-xs opacity-40 mt-3 tracking-wider uppercase">
                        {removedCount} dead link{removedCount > 1 ? "s" : ""} removed
                    </p>
                )}
            </header>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
                {visibleLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-panel flex items-center p-6 gap-4 transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/5 no-underline group"
                    >
                        {(link.icon || "🔗").startsWith("http") || (link.icon || "").startsWith("/") ? (
                            <img
                                src={link.icon}
                                alt={link.name}
                                className="w-10 h-10 object-cover rounded-full"
                            />
                        ) : (
                            <span className="text-[2rem]">{link.icon || "🔗"}</span>
                        )}
                        <span className="text-[1.1rem] font-bold text-[var(--accent-pink)] group-hover:text-white transition-colors">
                            {link.name}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}
