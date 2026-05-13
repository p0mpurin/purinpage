"use client";

export default function AboutPage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden px-4 pb-28 pt-8 md:px-8 md:pt-12">
            <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--accent-pink)] opacity-[0.07] blur-[80px] animate-[bubble-idle_8s_ease-in-out_infinite]" />
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:items-start md:gap-14 md:pt-6">
                <div className="bubble-hero-ring shrink-0 animate-[header-pop_0.65s_cubic-bezier(0.22,1,0.36,1)_both]">
                    <img
                        src="https://i.pinimg.com/736x/31/c8/8c/31c88c752483a072673f6c0ac9caa1db.jpg"
                        alt=""
                        className="h-36 w-36 object-cover md:h-44 md:w-44"
                    />
                </div>
                <div className="animate-[fade-rise_0.7s_cubic-bezier(0.22,1,0.36,1)_0.12s_both] text-center md:flex-1 md:text-left">
                    <p className="mb-2 text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-main)] opacity-75">
                        About
                    </p>
                    <h2 className="mb-5 border-b border-[var(--wired-grid)] pb-3 !normal-case text-2xl font-bold text-[var(--accent-pink)] !tracking-tight md:text-3xl">
                        hai, i&apos;m Sif
                    </h2>
                    <p className="mb-8 text-base leading-relaxed text-[var(--foreground)] opacity-90 md:text-lg">
                        i hope you find something useful in this site. i&apos;ll probably post my personal tools here
                        soon as well. baii
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                        <span className="inline-flex items-center rounded-full border border-[var(--accent-pink)]/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--accent-pink)] transition-[border-color,box-shadow] duration-300 hover:border-[var(--accent-pink)] hover:shadow-[0_0_20px_rgba(255,182,193,0.15)]">
                            status: online-ish
                        </span>
                        <span className="inline-flex animate-pulse items-center rounded-full border border-[var(--accent-pink)]/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--accent-pink)]">
                            network: secure… probably
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
