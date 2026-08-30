import { NextResponse } from "next/server";

async function processExtractColor(rawUrl: string) {
  let url = rawUrl.trim();
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  // 1. Detect Wallhaven URLs (page URL, full CDN URL, or thumb URL)
  // E.g.: https://w.wallhaven.cc/full/3q/wallhaven-3q2ol3.jpg OR https://wallhaven.cc/w/3q2ol3
  const whMatch = url.match(/wallhaven\.cc\/(?:w|full\/[a-z0-9]+\/wallhaven|small\/[a-z0-9]+)\/([a-zA-Z0-9]+)/i)
    || url.match(/wallhaven-([a-zA-Z0-9]+)\.(?:jpg|png)/i);

  if (whMatch && whMatch[1]) {
    const id = whMatch[1];
    try {
      const whRes = await fetch(`https://wallhaven.cc/api/v1/w/${id}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(6000),
      });

      if (whRes.ok) {
        const whData = await whRes.json();
        if (whData?.data) {
          const directPath = whData.data.path || url;
          const colors = whData.data.colors || [];
          if (colors.length > 0) {
            const formattedColors = colors.map((c: string) => (c.startsWith("#") ? c : `#${c}`));

            // Check if all colors are low-saturation monochrome grayscale
            const isAllGray = formattedColors.every((hex: string) => {
              const clean = hex.replace("#", "");
              const r = parseInt(clean.substring(0, 2), 16);
              const g = parseInt(clean.substring(2, 4), 16);
              const b = parseInt(clean.substring(4, 6), 16);
              return Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && Math.abs(r - b) < 18;
            });

            return NextResponse.json({
              success: true,
              resolvedUrl: directPath,
              colors: isAllGray
                ? ["#e2e8f0", "#ffffff", "#cbd5e1", "#94a3b8", "#64748b"]
                : formattedColors,
              isMonochrome: isAllGray,
            });
          }
        }
      }
    } catch {
      // fallback to proxy
    }
  }

  // 2. Fetch image through proxy with appropriate Referer to bypass CORS
  try {
    const parsedObj = new URL(url);
    const origin = parsedObj.origin;

    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Referer": origin.includes("wallhaven.cc") ? "https://wallhaven.cc/" : origin,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit base64 payload to 8MB
    const base64 = buffer.slice(0, 8 * 1024 * 1024).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      resolvedUrl: url,
      dataUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to proxy image" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  return processExtractColor(url);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body?.url || "";
    return processExtractColor(url);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid JSON" }, { status: 400 });
  }
}
