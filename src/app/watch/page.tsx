"use client";

import Link from "next/link";

export default function WatchPage() {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 pb-28 pt-8 sm:px-8 md:px-12 text-center">
      {/* Ambient Cyber Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-pink)] opacity-[0.05] blur-[140px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-md rounded-3xl border border-[var(--wired-grid)] bg-[#090710]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Status Beacon */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)] animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-pink)]">
            [UNDER DEVELOPMENT]
          </span>
        </div>

        {/* Header Title */}
        <h1 className="text-2xl font-black uppercase tracking-wider text-white text-shadow-pink mb-3 sm:text-3xl">
          Cinema
        </h1>

        {/* Simplified Message */}
        <p className="text-xs sm:text-sm text-[var(--text-main)] opacity-75 font-mono leading-relaxed mb-6">
          This section is currently under development.
        </p>

        {/* Return to Hub Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[var(--accent-pink)] hover:bg-[var(--accent-pink)] hover:text-black transition-all shadow-[0_0_16px_var(--bubble-glow-subtle)] cursor-pointer no-underline"
        >
          <span>← Return to Hub</span>
        </Link>
      </div>
    </div>
  );
}
