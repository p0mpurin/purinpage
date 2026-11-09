"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useZineFx } from "@/components/zine/useZineFx";

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
  useZineFx("dev");

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
    <main className="z-page">
      <div className="z-wrap">
        <section className="d-spread">
          <div className="d-banner img" style={{ "--img": `url("${bannerUrl}")` } as CSSProperties} />
          <div className="d-card z-pad">
            <div className="d-avatar img" style={{ "--img": `url("${avatarUrl}")` } as CSSProperties} role="img" aria-label={displayName} />
            <div>
              <span className="c-romaji">Kaihatsu / Developer</span>
              <h1>{displayName}</h1>
              <button type="button" className="z-link-btn" onClick={copyUsername}>
                @{username} · {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </section>
        <div className="z-pad">
          <section className="z-soon">
            <p>
              WIRED/SYS is built and kept up by {displayName}. The starred picks come from FMHY; everything else is
              hand-picked.
            </p>
          </section>
          <Link href="/" className="z-foot-link">
            ← Contents
          </Link>
        </div>
      </div>
    </main>
  );
}
