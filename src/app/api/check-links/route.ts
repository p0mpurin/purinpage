import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function isDeadLink(url: string): Promise<boolean> {
    if (url === "#") return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; link-checker/1.0)",
            },
        });
        clearTimeout(timeout);
        return res.status === 404;
    } catch (err: unknown) {
        clearTimeout(timeout);
        // Only treat definitive DNS failures as dead links
        // Timeouts, SSL errors, 403 bot-blocks, etc. are kept
        const code = (err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException })?.cause?.code;
        return code === "ENOTFOUND" || code === "EAI_NODATA" || code === "EAI_AGAIN";
    }
}

export async function POST(req: NextRequest) {
    let urls: unknown;
    try {
        ({ urls } = await req.json());
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!Array.isArray(urls) || urls.some((u) => typeof u !== "string")) {
        return NextResponse.json({ error: "urls must be an array of strings" }, { status: 400 });
    }

    const results = await Promise.all(
        (urls as string[]).map(async (url) => ({ url, dead: await isDeadLink(url) }))
    );

    const dead = results.filter((r) => r.dead).map((r) => r.url);

    return NextResponse.json({ dead });
}
