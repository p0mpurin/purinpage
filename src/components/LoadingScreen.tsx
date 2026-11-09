"use client";

export default function LoadingScreen({ label = "Connecting" }: { label?: string }) {
  return (
    <main className="z-page">
      <p className="z-loading" role="status" aria-live="polite">
        {label}
        <span>_</span>
      </p>
    </main>
  );
}
