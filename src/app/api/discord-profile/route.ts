import { NextResponse } from "next/server";

const DEV_DISCORD_ID = "553507526805684255";

export async function GET() {
  try {
    let bannerURL: string | null = null;
    let bannerColor: string | null = null;
    let badges: string[] = [];

    // 1. Fetch full profile from japi.rest for full Discord Nitro banner & badges
    try {
      const res = await fetch(`https://japi.rest/discord/v1/user/${DEV_DISCORD_ID}`, {
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 3600 }, // cache for 1 hr
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          bannerURL = json.data.bannerURL || (json.data.banner ? `https://cdn.discordapp.com/banners/${DEV_DISCORD_ID}/${json.data.banner}.png?size=600` : null);
          bannerColor = json.data.banner_color || null;
          badges = json.data.public_flags_array || [];
        }
      }
    } catch {
      // fallback
    }

    // Fallback if banner URL was not returned
    if (!bannerURL) {
      bannerURL = "https://cdn.discordapp.com/banners/553507526805684255/71b08e496d6deb8f8540d58b31eea1a5.png";
    }

    // 2. Fetch live Lanyard presence (status, activities, spotify)
    let lanyardData = null;
    try {
      const lRes = await fetch(`https://api.lanyard.rest/v1/users/${DEV_DISCORD_ID}`, {
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (lRes.ok) {
        const lJson = await lRes.json();
        if (lJson.success && lJson.data) {
          lanyardData = lJson.data;
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      bannerURL,
      bannerColor,
      badges,
      lanyard: lanyardData,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      bannerURL: "https://cdn.discordapp.com/banners/553507526805684255/71b08e496d6deb8f8540d58b31eea1a5.png",
      lanyard: null,
    });
  }
}
