import { NextResponse } from "next/server";

const DEV_DISCORD_ID = "553507526805684255";
// Discord serves banners at their uploaded size at most; 1024 asks for the full-resolution file.
const FALLBACK_BANNER = `https://cdn.discordapp.com/banners/${DEV_DISCORD_ID}/288183666656a6d4d42031c07312bafa.png?size=1024`;

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
          const banner: string | undefined = json.data.banner;
          bannerURL = banner
            ? `https://cdn.discordapp.com/banners/${DEV_DISCORD_ID}/${banner}.${banner.startsWith("a_") ? "gif" : "png"}?size=1024`
            : json.data.bannerURL || null;
          bannerColor = json.data.banner_color || null;
          badges = json.data.public_flags_array || [];
        }
      }
    } catch {
      // fallback
    }

    // Fallback if banner URL was not returned
    if (!bannerURL) {
      bannerURL = FALLBACK_BANNER;
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
      bannerURL: FALLBACK_BANNER,
      lanyard: null,
    });
  }
}
