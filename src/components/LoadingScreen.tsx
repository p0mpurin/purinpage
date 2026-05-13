"use client";

export default function LoadingScreen({ label = "Connecting" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-8 px-4"
      role="status"
      aria-live="polite"
    >
      <div className="loading-pulse-ring relative h-14 w-14 rounded-full border-2 border-[var(--accent-dim)]">
        <span className="absolute inset-0 rounded-full border-2 border-t-[var(--accent-pink)] border-r-transparent border-b-transparent border-l-transparent shadow-[0_0_18px_var(--bubble-glow)] animate-[spin_0.9s_linear_infinite]" />
      </div>
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-main)] opacity-80">
        {label}
      </p>
    </div>
  );
}
