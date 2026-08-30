"use client";

import Link from "next/link";

export default function WatchPage() {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 pb-28 pt-8 sm:px-8 md:px-12 text-center">
      {/* Ambient Cyber Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-pink)] opacity-[0.06] blur-[150px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-xl rounded-3xl border border-[var(--wired-grid)] bg-[#090710]/90 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl">
        {/* Status Beacon */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-pink)] animate-ping" />
          <span className="h-2 w-2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-pink)]">
            [SYSTEM PROTOCOL // MAINTENANCE]
          </span>
        </div>

        {/* Kanji Seal */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-black/60 shadow-[0_0_20px_var(--bubble-glow-subtle)]">
            <span className="font-serif text-3xl font-bold text-[var(--accent-pink)]">
              構
            </span>
          </div>
        </div>

        {/* Header Title */}
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white text-shadow-pink mb-3">
          Cinema Under Development
        </h1>

        {/* Message */}
        <p className="text-xs sm:text-sm text-[var(--text-main)] opacity-75 font-mono leading-relaxed mb-8 max-w-md mx-auto">
          The stream engine and player sandbox are currently offline for architecture upgrades and ad-shield hardening. Check back soon.
        </p>

        {/* Telemetry Box */}
        <div className="mb-8 rounded-2xl border border-[var(--wired-grid)] bg-black/40 p-4 font-mono text-[0.7rem] text-left text-white/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[var(--accent-pink)]">STATUS:</span>
            <span className="text-amber-400">ENGINE_OFFLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--accent-pink)]">MODULE:</span>
            <span>CINEMA_STUDIO_v2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--accent-pink)]">SANDBOX:</span>
            <span className="text-emerald-400">LOCKED</span>
          </div>
        </div>

        {/* Return to Hub Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition-all shadow-[0_0_20px_var(--bubble-glow-subtle)] cursor-pointer no-underline"
        >
          <span>← Return to Hub</span>
        </Link>
      </div>
    </div>
  );
}
