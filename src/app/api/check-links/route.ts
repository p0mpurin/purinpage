import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isDNSError(err: unknown): boolean {
    const e = err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException };
    // Error code can live on the error itself or on its cause
    const code = e?.code ?? e?.cause?.code ?? "";
    const msg = (e?.message ?? "").toLowerCase();

    return (
        code === "ENOTFOUND" ||
        code === "EAI_NODATA" ||
        code === "EAI_AGAIN" ||
        code === "EAI_FAIL" ||
        code === "ESERVFAIL" ||
        code === "ENOENT" ||
        // Fallback: match common DNS error strings in the message
        msg.includes("enotfound") ||
        msg.includes("getaddrinfo") ||
        msg.includes("unknown host") ||
        msg.includes("name or service not known")
    );
}

async function isDeadLink(url: string): Promise<boolean> {
    if (url === "#") return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            redirect: "follow",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });
        clearTimeout(timeout);

        if (res.status === 404) {
            res.body?.cancel();
            return true;
        }

        // Explicit 0-byte content-length → dead/parked domain serving empty response
        const contentLength = res.headers.get("content-length");
        if (contentLength === "0") {
            res.body?.cancel();
            return true;
        }

        // Read the first chunk to verify there's actual content
        const reader = res.body?.getReader();
        if (reader) {
            try {
                const { value, done } = await reader.read();
                reader.cancel();
                // done immediately with no bytes = empty body
                if (done && (!value || value.length === 0)) return true;
            } catch {
                // read error → assume alive (don't false-positive)
            }
        }

        return false;
    } catch (err: unknown) {
        clearTimeout(timeout);
        return isDNSError(err);
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

    // Process in batches of 8 to avoid overwhelming the serverless function
    const batch = 8;
    const dead: string[] = [];
    for (let i = 0; i < (urls as string[]).length; i += batch) {
        const chunk = (urls as string[]).slice(i, i + batch);
        const results = await Promise.all(
            chunk.map(async (url) => ({ url, dead: await isDeadLink(url) }))
        );
        dead.push(...results.filter((r) => r.dead).map((r) => r.url));
    }

    return NextResponse.json({ dead });
}
