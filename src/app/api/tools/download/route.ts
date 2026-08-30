import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUrl = body?.url?.trim();
    const isAudioOnly = body?.isAudioOnly ?? false;

    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.startsWith("http")) {
      return NextResponse.json({ error: "Please enter a valid media URL" }, { status: 400 });
    }

    const urlObj = new URL(rawUrl);
    const host = urlObj.hostname.toLowerCase();

    // 1. TIKTOK HANDLER (TikWM Engine - High Speed No-Watermark MP4 & MP3)
    if (host.includes("tiktok.com") || host.includes("douyin.com")) {
      try {
        const tikRes = await fetch("https://www.tikwm.com/api/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          body: `url=${encodeURIComponent(rawUrl)}&count=12&cursor=0&web=1&hd=1`,
          signal: AbortSignal.timeout(8000),
        });

        if (tikRes.ok) {
          const json = await tikRes.json();
          if (json.code === 0 && json.data) {
            const videoUrl = json.data.hdplay || json.data.play || json.data.wmplay;
            const audioUrl = json.data.music || json.data.music_info?.play;
            const chosenUrl = isAudioOnly ? (audioUrl || videoUrl) : (videoUrl || audioUrl);

            if (chosenUrl) {
              return NextResponse.json({
                success: true,
                url: chosenUrl,
                title: json.data.title || "TikTok Video",
                author: json.data.author?.nickname || "TikTok Creator",
                cover: json.data.cover,
                type: isAudioOnly ? "audio" : "video",
              });
            }
          }
        }
      } catch (err: any) {
        console.error("TikWM error:", err.message);
      }
    }

    // 2. TWITTER / X HANDLER (VxTwitter API)
    if (host.includes("twitter.com") || host.includes("x.com")) {
      try {
        const path = urlObj.pathname;
        const vxEndpoint = `https://api.vxtwitter.com${path}`;
        const vxRes = await fetch(vxEndpoint, {
          signal: AbortSignal.timeout(6000),
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });

        if (vxRes.ok) {
          const vxJson = await vxRes.json();
          const media = vxJson.mediaURLs || [];
          const video = media.find((m: string) => m.includes(".mp4") || m.includes("video")) || media[0];

          if (video) {
            return NextResponse.json({
              success: true,
              url: video,
              title: vxJson.text?.slice(0, 80) || "Twitter Media",
              author: vxJson.user_name,
            });
          }
        }
      } catch {
        // continue
      }
    }

    // 3. GENERAL COBALT & MULTI-INSTANCE FALLBACK
    const cobaltInstances = [
      "https://cobalt-backend.canine.tools",
      "https://api.wuk.sh",
      "https://cobalt-api.kwiatekm.tokyo",
    ];

    for (const instance of cobaltInstances) {
      try {
        const response = await fetch(`${instance}/`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          body: JSON.stringify({
            url: rawUrl,
            vQuality: body?.vQuality || "1080",
            isAudioOnly,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url || data.stream) {
            return NextResponse.json({ success: true, url: data.url || data.stream });
          }
        }
      } catch {
        // try next
      }
    }

    return NextResponse.json({
      error: "Could not extract media stream directly. Please verify the link is public.",
    }, { status: 502 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process download" }, { status: 500 });
  }
}
