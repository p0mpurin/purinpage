import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let domain = body?.domain?.trim();

    if (!domain) {
      return NextResponse.json({ error: "Please provide a domain to test" }, { status: 400 });
    }

    // Clean domain string
    try {
      if (domain.startsWith("http://") || domain.startsWith("https://")) {
        domain = new URL(domain).hostname;
      }
      domain = domain.replace(/^www\./, "").split("/")[0].split(":")[0];
    } catch {
      // keep raw
    }

    const providers = [
      {
        name: "Cloudflare (1.1.1.1)",
        url: `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
        headers: { Accept: "application/dns-json" },
      },
      {
        name: "Google DNS (8.8.8.8)",
        url: `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
        headers: { Accept: "application/json" },
      },
      {
        name: "Quad9 (9.9.9.9)",
        url: `https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(domain)}&type=A`,
        headers: { Accept: "application/dns-json" },
      },
      {
        name: "AdGuard DNS",
        url: `https://dns.adguard-dns.com/resolve?name=${encodeURIComponent(domain)}&type=A`,
        headers: { Accept: "application/json" },
      },
    ];

    const results = await Promise.all(
      providers.map(async (provider) => {
        const start = performance.now();
        try {
          const res = await fetch(provider.url, {
            headers: provider.headers,
            signal: AbortSignal.timeout(4000),
          });
          const latency = Math.round(performance.now() - start);

          if (res.ok) {
            const json = await res.json();
            const answers = json.Answer || [];
            const ips = answers
              .filter((a: any) => a.type === 1 || a.type === 28) // A or AAAA records
              .map((a: any) => a.data);

            const status = json.Status === 0 ? "Resolved" : json.Status === 3 ? "NXDOMAIN" : `Error ${json.Status}`;
            return {
              provider: provider.name,
              status,
              latency: `${latency}ms`,
              ips: ips.length > 0 ? ips : ["No IP records"],
              success: json.Status === 0 && ips.length > 0,
            };
          } else {
            return {
              provider: provider.name,
              status: `HTTP ${res.status}`,
              latency: `${latency}ms`,
              ips: [],
              success: false,
            };
          }
        } catch (err: any) {
          return {
            provider: provider.name,
            status: "Timed Out / Blocked",
            latency: ">4000ms",
            ips: [],
            success: false,
          };
        }
      })
    );

    const successfulLookups = results.filter((r) => r.success);
    const isDomainActive = successfulLookups.length >= 2;

    return NextResponse.json({
      domain,
      isDomainActive,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to test DNS resolution" }, { status: 500 });
  }
}
