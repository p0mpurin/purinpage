import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

const DNS_CACHE_MS = 20 * 60 * 1000;
const DNS_MAX_ATTEMPTS = 4;
const DNS_RETRY_BASE_MS = 75;

/** hostname -> resolved public IPv4/IPv6 (reduces resolver thrash when many previews load at once) */
const dnsOkCache = new Map<string, { exp: number; address: string }>();

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".localhost")) return true;
  return false;
}

/** True if address is loopback, private, or link-local (SSRF mitigation). */
export function isNonPublicIp(ip: string): boolean {
  if (!ip) return true;
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("ff")) return true;
    return false;
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function resolveHostname(host: string): Promise<string> {
  const now = Date.now();
  const hit = dnsOkCache.get(host);
  if (hit && hit.exp > now) return hit.address;

  for (let attempt = 0; attempt < DNS_MAX_ATTEMPTS; attempt++) {
    try {
      const r = await dns.lookup(host, { verbatim: true });
      const ip = r.address;
      if (isNonPublicIp(ip)) {
        throw new Error("blocked_resolve");
      }
      dnsOkCache.set(host, { exp: now + DNS_CACHE_MS, address: ip });
      return ip;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "blocked_resolve") throw e;
      if (attempt < DNS_MAX_ATTEMPTS - 1) {
        await sleep(DNS_RETRY_BASE_MS * (attempt + 1) + Math.floor(Math.random() * 40));
      }
    }
  }
  throw new Error("dns_failed");
}

/**
 * Parse and validate URL for server-side fetch (http/https, no SSRF to internal nets).
 */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("invalid_url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("invalid_protocol");
  }
  if (!u.hostname) throw new Error("invalid_host");

  const host = u.hostname;
  if (isBlockedHostname(host)) throw new Error("blocked_host");

  if (net.isIP(host)) {
    if (isNonPublicIp(host)) throw new Error("blocked_ip");
    return u;
  }

  try {
    await resolveHostname(host);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "blocked_resolve") throw e;
    throw new Error("dns_failed");
  }

  return u;
}
