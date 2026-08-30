"use client";

import { useEffect, useState } from "react";

interface DiscordProfileState {
  bannerURL: string | null;
  lanyard: {
    discord_user?: {
      username: string;
      global_name?: string;
      display_name?: string;
      avatar?: string;
    };
  } | null;
}

const DEV_DISCORD_ID = "553507526805684255";
const FALLBACK_BANNER = "https://cdn.discordapp.com/banners/553507526805684255/71b08e496d6deb8f8540d58b31eea1a5.png";
const FALLBACK_AVATAR = "https://cdn.discordapp.com/avatars/553507526805684255/41838b815edb058aede5d30d0525557f.png";

export default function DevPage() {
  const [profile, setProfile] = useState<DiscordProfileState>({
    bannerURL: FALLBACK_BANNER,
    lanyard: null,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/discord-profile");
        const data = await response.json();
        if (active && response.ok && data.success) setProfile(data);
      } catch {
        // Keep the fallback profile when Discord is unavailable.
      }
    };

    void fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  const discordUser = profile.lanyard?.discord_user;
  const displayName = discordUser?.global_name || discordUser?.display_name || "sif";
  const username = discordUser?.username || "p0mpur1n";
  const avatarUrl = discordUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${DEV_DISCORD_ID}/${discordUser.avatar}.png?size=256`
    : FALLBACK_AVATAR;
  const bannerUrl = profile.bannerURL || FALLBACK_BANNER;

  const copyUsername = async () => {
    await navigator.clipboard.writeText(username);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] w-full items-center justify-center overflow-hidden px-4 py-8 sm:px-8 md:px-12">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-pink)] opacity-[0.055] blur-[130px]" aria-hidden />

      <section className="relative min-h-[420px] w-full max-w-[760px] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[#08070c]/85 shadow-[0_28px_90px_rgba(0,0,0,0.6),0_0_40px_var(--bubble-glow-subtle)] backdrop-blur-2xl">
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-[0.8] transition-transform duration-[1400ms] hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08070c] via-[#08070c]/80 to-[#08070c]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08070c] via-transparent to-black/20" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--accent-pink)_1px,transparent_1px),linear-gradient(90deg,var(--accent-pink)_1px,transparent_1px)] [background-size:42px_42px]" aria-hidden />

        <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-6 sm:p-9">
          <span className="w-fit rounded-full border border-white/10 bg-black/45 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/60 backdrop-blur-md">
            DEV
          </span>

          <div className="flex items-end gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.65rem] border-2 border-[var(--accent-pink)] bg-black shadow-[0_0_28px_var(--bubble-glow-subtle)] sm:h-28 sm:w-28">
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-3xl font-bold tracking-tight text-white sm:text-5xl">{displayName}</h1>
              <button type="button" onClick={copyUsername} className="mt-1 font-mono text-xs text-white/45 transition hover:text-[var(--accent-pink)]">
                @{username} · {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
