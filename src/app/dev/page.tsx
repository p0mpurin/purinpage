"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import PageHead from "@/components/zine/PageHead";
import { useZineFx } from "@/components/zine/useZineFx";
import { categoryLinks } from "@/lib/links";

type DiscordStatus = "online" | "idle" | "dnd" | "offline";

interface DiscordProfileState {
  bannerURL: string | null;
  lanyard: {
    discord_status?: DiscordStatus;
    listening_to_spotify?: boolean;
    spotify?: { song?: string; artist?: string } | null;
    activities?: Array<{ type: number; name: string; details?: string }>;
    discord_user?: {
      username: string;
      global_name?: string;
      display_name?: string;
      avatar?: string;
    };
  } | null;
}

const DEV_DISCORD_ID = "553507526805684255";
const FALLBACK_BANNER = "https://cdn.discordapp.com/banners/553507526805684255/288183666656a6d4d42031c07312bafa.png?size=1024";
const FALLBACK_AVATAR = "https://cdn.discordapp.com/avatars/553507526805684255/4efade43e218f55a96af8d98c600360c.png?size=256";

const STATUS_LABEL: Record<DiscordStatus, string> = {
  online: "Online",
  idle: "Away",
  dnd: "Do not disturb",
  offline: "Offline",
};

const TOTAL_LINKS = Object.entries(categoryLinks)
  .filter(([slug]) => slug !== "favorites")
  .reduce((sum, [, c]) => sum + c.links.length, 0);

const photo = (url: string) => ({ "--img": `url("${url}")` }) as CSSProperties;

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

  const lanyard = profile.lanyard;
  const discordUser = lanyard?.discord_user;
  const displayName = discordUser?.global_name || discordUser?.display_name || "sif";
  const username = discordUser?.username || "p0mpur1n";
  const avatarUrl = discordUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${DEV_DISCORD_ID}/${discordUser.avatar}.png?size=256`
    : FALLBACK_AVATAR;
  const bannerUrl = profile.bannerURL || FALLBACK_BANNER;
  const status = lanyard?.discord_status;
  const playing = lanyard?.activities?.find((a) => a.type === 0);
  const spotify = lanyard?.listening_to_spotify ? lanyard.spotify : null;

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(username);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the handle is still visible to copy by hand.
    }
  };

  return (
    <main className="z-page">
      <div className="z-wrap z-pad">
        <PageHead
          kanji="開発"
          romaji="Kaihatsu / Developer"
          title={displayName}
          deck="Builds and looks after WIRED/SYS. The starred picks come from FMHY; everything else is hand-picked."
        />

        <section className="d-profile">
          <figure className="d-print">
            <div className="d-banner img" style={photo(bannerUrl)} role="img" aria-label={`${displayName}'s Discord banner`} />
            <div className="d-avatar img lit" style={photo(avatarUrl)} role="img" aria-label={`${displayName}'s avatar`} />
            <figcaption>Discord</figcaption>
          </figure>

          <dl className="d-facts">
            <div>
              <dt>Handle</dt>
              <dd>
                @{username}
                <button type="button" className="z-link-btn" onClick={copyUsername}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`d-dot ${status ?? ""}`} aria-hidden="true" />
                {status ? STATUS_LABEL[status] : "Unknown"}
              </dd>
            </div>
            {spotify?.song && (
              <div>
                <dt>Listening to</dt>
                <dd>
                  {spotify.song}
                  {spotify.artist && <small>{spotify.artist}</small>}
                </dd>
              </div>
            )}
            {!spotify && playing && (
              <div>
                <dt>Playing</dt>
                <dd>
                  {playing.name}
                  {playing.details && <small>{playing.details}</small>}
                </dd>
              </div>
            )}
            <div>
              <dt>In the vault</dt>
              <dd>
                {TOTAL_LINKS.toLocaleString()} <small>links across {Object.keys(categoryLinks).length - 1} sections</small>
              </dd>
            </div>
          </dl>
        </section>

        <Link href="/" className="z-foot-link">
          ← Contents
        </Link>
      </div>
    </main>
  );
}
