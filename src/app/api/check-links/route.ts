import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Returns true if the error means the site is definitively unreachable */
function isNetworkFailure(err: unknown): boolean {
    const e = err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException };
    const code = e?.code ?? e?.cause?.code ?? "";
    const msg = (e?.message ?? "").toLowerCase();

    const deadCodes = new Set([
        "ENOTFOUND",      // DNS: no such host
        "EAI_NODATA",     // DNS: no address
        "EAI_AGAIN",      // DNS: temporary failure
        "EAI_FAIL",       // DNS: permanent failure
        "EAI_NONAME",     // DNS: host not found
        "ESERVFAIL",      // DNS: server failure
        "ECONNREFUSED",   // Server is down / port closed
        "ECONNRESET",     // Server closed connection immediately
        "ECONNABORTED",   // Connection aborted
        "ENETUNREACH",    // Network unreachable
        "EHOSTUNREACH",   // Host unreachable
        "EHOSTDOWN",      // Host is down
    ]);

    if (deadCodes.has(code)) return true;

    // Fallback: match error text for cases where code is missing
    return (
        msg.includes("enotfound") ||
        msg.includes("getaddrinfo") ||
        msg.includes("unknown host") ||
        msg.includes("name or service not known") ||
        msg.includes("econnrefused") ||
        msg.includes("econnreset")
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

        if (res.status === 404 || res.status === 410) {
            res.body?.cancel();
            return true;
        }

        // Explicit 0-byte content-length = empty/parked response
        const contentLength = res.headers.get("content-length");
        if (contentLength === "0") {
            res.body?.cancel();
            return true;
        }

        // Many servers omit Content-Length (chunked) or send a non-empty first chunk later.
        // A single read() can return done:false with an empty chunk — wrongly treated as "alive" before.
        const reader = res.body?.getReader();
        if (!reader) {
            // No body stream but request "succeeded" — treat as empty document
            if (res.ok && res.status !== 204 && res.status !== 304) return true;
            return false;
        }

        try {
            let total = 0;
            const maxSampleBytes = 65536; // cap download; any bytes here means "has content"
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value?.length) total += value.length;
                if (total >= maxSampleBytes) {
                    await reader.cancel();
                    return false;
                }
            }

            if (total > 0) return false;

            // Entire body is 0 bytes: dead for "normal" pages, not for intentional no-content codes
            const emptyMeansDead =
                res.ok && res.status !== 204 && res.status !== 304 && res.status !== 205;
            return emptyMeansDead;
        } catch {
            // read error — assume alive to avoid false positives
        }

        return false;
    } catch (err: unknown) {
        clearTimeout(timeout);
        return isNetworkFailure(err);
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
