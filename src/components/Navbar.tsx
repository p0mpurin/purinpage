"use client";

import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import SettingsModal from "@/components/SettingsModal";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseClient();
  const [isScrolled, setIsScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);

    // Live digital clock (HH:MM:SS)
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      setTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  if (pathname === "/login") return null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-6 md:px-8 pointer-events-none">
        
        {/* Floating HUD Cyber Deck Container */}
        <div
          className={`pointer-events-auto mx-auto max-w-[1440px] rounded-3xl border transition-all duration-500 backdrop-blur-2xl ${
            isScrolled
              ? "border-[var(--accent-pink)]/40 bg-[#06040a]/92 shadow-[0_16px_45px_rgba(0,0,0,0.9),0_0_25px_var(--bubble-glow-subtle)] py-2 px-4 sm:px-6"
              : "border-[var(--wired-grid)] bg-[#07050e]/70 shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-3 px-4 sm:px-6"
          }`}
        >
          {/* Top Edge Ambient Corner Accents */}
          <div className="relative flex items-center justify-between">
            
            {/* Left: Holographic Logo & Cyber Seal */}
            <Link
              href="/"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className="group flex items-center gap-3 no-underline focus:outline-none shrink-0"
            >
              {/* Animated Rotating Hex / Kanji Seal */}
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center">
                
                {/* Rotating Cyber Outer Ring */}
                <div
                  className={`absolute inset-0 rounded-2xl border transition-all duration-700 ${
                    logoHovered
                      ? "border-[var(--accent-pink)] rotate-45 scale-110 shadow-[0_0_22px_var(--accent-pink)] bg-[var(--accent-pink)]/10"
                      : "border-[var(--border)] rotate-0 shadow-[0_0_12px_var(--bubble-glow-subtle)] bg-black/60"
                  }`}
                />

                {/* Glowing Inner Core */}
                <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent-pink)]/15 font-serif text-sm font-bold text-[var(--accent-pink)] transition-all duration-300 group-hover:bg-[var(--accent-pink)] group-hover:text-black">
                  線
                </div>

                {/* Pulse Signal Beacon */}
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--accent-pink)] animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_6px_var(--accent-pink)]" />
              </div>

              {/* Brand Typography & Telemetry */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black tracking-[0.24em] text-white text-shadow-pink transition-all duration-300 group-hover:text-[var(--accent-pink)] sm:text-lg">
                    WIRED<span className="text-[var(--accent-pink)]">/</span>SYS
                  </span>

                  {/* Equalizer Waveform */}
                  <div className="hidden lg:flex items-end gap-0.5 h-3 opacity-80">
                    <span className="w-0.5 h-2 bg-[var(--accent-pink)] animate-pulse" />
                    <span className="w-0.5 h-3.5 bg-[var(--accent-pink)] animate-bounce" />
                    <span className="w-0.5 h-1.5 bg-[var(--accent-pink)] animate-pulse" />
                    <span className="w-0.5 h-2.5 bg-[var(--accent-pink)]" />
                  </div>
                </div>

                {/* Sub-label with Live Clock */}
                <div className="hidden sm:flex items-center gap-2 font-mono text-[0.62rem] text-[var(--text-main)] opacity-60">
                  <span className="tracking-[0.2em] uppercase text-[var(--accent-pink)]">
                    [ONLINE]
                  </span>
                  {timeStr && (
                    <>
                      <span>·</span>
                      <span className="tracking-widest text-white/80">{timeStr}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>

            {/* Center: Futuristic HUD Segmented Navigation Island */}
            <nav className="flex items-center gap-1 rounded-2xl border border-[var(--border)] bg-black/60 p-1.5 backdrop-blur-xl shadow-inner">
              <Link
                href="/"
                className={`relative rounded-xl px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 no-underline sm:text-sm ${
                  isActive("/")
                    ? "bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] shadow-[0_0_16px_var(--bubble-glow-subtle)] border border-[var(--border)]"
                    : "text-[var(--text-main)] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>Hub</span>
                {isActive("/") && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
                )}
              </Link>

              <Link
                href="/tools"
                className={`relative rounded-xl px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 no-underline sm:text-sm ${
                  isActive("/tools")
                    ? "bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] shadow-[0_0_16px_var(--bubble-glow-subtle)] border border-[var(--border)]"
                    : "text-[var(--text-main)] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>Tools</span>
                {isActive("/tools") && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
                )}
              </Link>

              <Link
                href="/dev"
                className={`relative rounded-xl px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 no-underline sm:text-sm ${
                  isActive("/dev") || isActive("/about")
                    ? "bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] shadow-[0_0_16px_var(--bubble-glow-subtle)] border border-[var(--border)]"
                    : "text-[var(--text-main)] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>Dev</span>
                {(isActive("/dev") || isActive("/about")) && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
                )}
              </Link>
            </nav>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Theme Settings Studio Button */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Theme Studio"
                className="group flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-black/50 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-pink)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-[var(--accent-pink)] hover:bg-[var(--accent-pink)]/15 hover:shadow-[0_0_18px_var(--bubble-glow-subtle)] cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-700 group-hover:rotate-180"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className="hidden sm:inline">Theme</span>
              </button>

              {/* Profile Link */}
              <Link
                href="/profile"
                className="hidden sm:inline-flex rounded-2xl border border-[var(--wired-grid)] bg-black/40 px-3.5 py-2 font-mono text-xs font-semibold text-[var(--text-main)] transition-all duration-200 hover:border-[var(--border)] hover:text-white no-underline backdrop-blur-md"
              >
                Profile
              </Link>

              {/* Exit Session Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-[var(--wired-grid)] bg-black/40 px-3 py-2 font-mono text-xs text-[var(--text-main)] opacity-60 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 hover:opacity-100 cursor-pointer backdrop-blur-md"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Theme Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
