/**
 * Extract og:image / twitter:image from HTML head snippet; resolve relative URLs.
 */
export function extractPreviewImage(html: string, baseUrl: string): string | null {
  const slice = () => {
    const headEnd = html.search(/<\/head\s*>/i);
    return headEnd === -1 ? html.slice(0, 400_000) : html.slice(0, headEnd + 7);
  };

  const s = slice();

  const patterns = [
    /<meta\s+[^>]*property\s*=\s*["']og:image["'][^>]*>/i,
    /<meta\s+[^>]*property\s*=\s*["']og:image:url["'][^>]*>/i,
    /<meta\s+[^>]*name\s*=\s*["']twitter:image["'][^>]*>/i,
    /<meta\s+[^>]*name\s*=\s*["']twitter:image:src["'][^>]*>/i,
    /<meta\s+[^>]*content\s*=\s*["'][^"']+["'][^>]*property\s*=\s*["']og:image["'][^>]*>/i,
  ];

  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;
    const tag = m[0];
    const c =
      tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i) || tag.match(/\bcontent\s*=\s*([^\s>]+)/i);
    const url = c?.[1]?.trim();
    if (!url) continue;
    try {
      return new URL(url, baseUrl).href;
    } catch {
      continue;
    }
  }

  return null;
}
