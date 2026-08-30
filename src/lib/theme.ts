"use client";

export interface CustomTheme {
  wallpaperUrl: string;
  wallpaperDim: number; // 0.1 to 0.9
  wallpaperBlur: number; // 0 to 30px
  accentColor: string; // Hex color
  presetName?: string;
  extractedPalette?: string[];
}

export interface PremadeTheme {
  id: string;
  name: string;
  wallpaperUrl: string;
  accentColor: string;
  wallpaperDim: number;
  wallpaperBlur: number;
  author?: string;
}

export const DEFAULT_THEME: CustomTheme = {
  wallpaperUrl: "https://w.wallhaven.cc/full/k8/wallhaven-k8d276.png",
  wallpaperDim: 0.46,
  wallpaperBlur: 3,
  accentColor: "#999999",
  presetName: "main",
};

// Built-in presets list
export const BUILTIN_PRESET_THEMES: PremadeTheme[] = [
  {
    id: "custom-1788122739195",
    name: "blue",
    wallpaperUrl: "https://w.wallhaven.cc/full/d8/wallhaven-d8dmdj.png",
    accentColor: "#7979d2",
    wallpaperDim: 0.46,
    wallpaperBlur: 3,
    author: "User",
  },
  {
    id: "custom-1788122839602",
    name: "main",
    wallpaperUrl: "https://w.wallhaven.cc/full/k8/wallhaven-k8d276.png",
    accentColor: "#999999",
    wallpaperDim: 0.46,
    wallpaperBlur: 3,
    author: "User",
  },
  {
    id: "custom-1788122970426",
    name: "white",
    wallpaperUrl: "https://w.wallhaven.cc/full/1q/wallhaven-1q2kd9.jpg",
    accentColor: "#ffffff",
    wallpaperDim: 0.46,
    wallpaperBlur: 3,
    author: "User",
  },
  {
    id: "custom-1788123096869",
    name: "cyan",
    wallpaperUrl: "https://w.wallhaven.cc/full/xe/wallhaven-xe9g8l.jpg",
    accentColor: "#66cccc",
    wallpaperDim: 0.46,
    wallpaperBlur: 3,
    author: "User",
  },
];

const SAVED_THEMES_STORAGE_KEY = "wired_sys_user_themes_v1";

// Helper to convert Wallhaven thumbnail/page URL to direct full-res image URL
export function normalizeWallpaperUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  const pageMatch = trimmed.match(/wallhaven\.cc\/w\/([a-zA-Z0-9]+)/);
  if (pageMatch && pageMatch[1]) {
    const id = pageMatch[1];
    const prefix = id.substring(0, 2);
    return `https://w.wallhaven.cc/full/${prefix}/wallhaven-${id}.jpg`;
  }

  return trimmed;
}

// Convert Hex to RGBA string
export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  let r = 255, g = 182, b = 193;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type RgbColor = { r: number; g: number; b: number };
type HslColor = { h: number; s: number; l: number };

const UI_SURFACE_COLOR = "#09070e";
const MIN_ACCENT_CONTRAST = 5.2;

function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.trim().replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((part) => part + part).join("")
    : clean;

  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor): string {
  const channel = (value: number) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l: lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === red) hue = 60 * (((green - blue) / delta) % 6);
  else if (max === green) hue = 60 * ((blue - red) / delta + 2);
  else hue = 60 * ((red - green) / delta + 4);

  return { h: hue < 0 ? hue + 360 : hue, s: saturation, l: lightness };
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hue = ((h % 360) + 360) % 360;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green] = [chroma, x];
  else if (segment < 2) [red, green] = [x, chroma];
  else if (segment < 3) [green, blue] = [chroma, x];
  else if (segment < 4) [green, blue] = [x, chroma];
  else if (segment < 5) [red, blue] = [x, chroma];
  else [red, blue] = [chroma, x];

  const match = l - chroma / 2;
  return { r: (red + match) * 255, g: (green + match) * 255, b: (blue + match) * 255 };
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const linearize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

export function getContrastRatio(foreground: string, background = UI_SURFACE_COLOR): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Preserve hue/chroma as much as possible while making the accent readable on dark UI surfaces. */
export function makeReadableAccent(hex: string, minimumContrast = MIN_ACCENT_CONTRAST): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#e2e8f0";

  const normalized = rgbToHex(rgb);
  if (getContrastRatio(normalized) >= minimumContrast) return normalized;

  const hsl = rgbToHsl(rgb);
  let low = hsl.l;
  let high = 0.96;
  let best = rgbToHex(hslToRgb({ ...hsl, l: high }));

  // Binary-search the smallest brightness change that clears the readability target.
  for (let step = 0; step < 14; step++) {
    const lightness = (low + high) / 2;
    const candidate = rgbToHex(hslToRgb({ ...hsl, l: lightness }));
    if (getContrastRatio(candidate) >= minimumContrast) {
      best = candidate;
      high = lightness;
    } else {
      low = lightness;
    }
  }

  return best;
}

function colorDistance(first: string, second: string): number {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  if (!a || !b) return Number.POSITIVE_INFINITY;
  // Red-mean distance better follows human perception than plain RGB distance.
  const redMean = (a.r + b.r) / 2;
  const red = a.r - b.r;
  const green = a.g - b.g;
  const blue = a.b - b.b;
  return Math.sqrt((2 + redMean / 256) * red * red + 4 * green * green + (2 + (255 - redMean) / 256) * blue * blue);
}

function buildAccessiblePalette(colors: string[], monochrome = false): string[] {
  const source = monochrome
    ? ["#f8fafc", "#e2e8f0", "#cbd5e1", "#aebdca", "#94a3b8"]
    : colors;
  const palette: string[] = [];

  for (const color of source) {
    const accessible = makeReadableAccent(color);
    if (!palette.some((existing) => colorDistance(existing, accessible) < 38)) {
      palette.push(accessible);
    }
    if (palette.length === 5) break;
  }

  // Sparse or near-monochrome images can collapse to one swatch. Add tonal variants
  // that retain the strongest detected hue instead of falling back to unrelated colors.
  const baseRgb = hexToRgb(palette[0] || colors[0] || "#e2e8f0") || { r: 226, g: 232, b: 240 };
  const baseHsl = rgbToHsl(baseRgb);
  for (const lightness of [0.88, 0.78, 0.68, 0.58, 0.5]) {
    const variant = makeReadableAccent(rgbToHex(hslToRgb({ ...baseHsl, l: lightness })));
    if (!palette.some((existing) => colorDistance(existing, variant) < 38)) palette.push(variant);
    if (palette.length === 5) break;
  }

  return palette.slice(0, 5);
}

// Extract dominant vibrant colors or monochrome palette from an image
export async function extractDominantColor(imageUrl: string): Promise<{ primary: string; palette: string[]; contrastRatio: number; isMonochrome?: boolean; resolvedUrl?: string } | null> {
  const normalized = normalizeWallpaperUrl(imageUrl);
  if (!normalized) return null;

  try {
    let sourceDataUrl = normalized;
    let resolvedUrl = normalized;

    // Use our internal proxy API to bypass CORS
    try {
      const proxyRes = await fetch(`/api/extract-color?url=${encodeURIComponent(normalized)}`);
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success) {
          if (proxyData.colors && proxyData.colors.length > 0) {
            const palette = buildAccessiblePalette(proxyData.colors, proxyData.isMonochrome);
            return {
              primary: palette[0],
              palette,
              contrastRatio: getContrastRatio(palette[0]),
              isMonochrome: proxyData.isMonochrome,
              resolvedUrl: proxyData.resolvedUrl || resolvedUrl,
            };
          }
          if (proxyData.dataUrl) {
            sourceDataUrl = proxyData.dataUrl;
          }
          if (proxyData.resolvedUrl) {
            resolvedUrl = proxyData.resolvedUrl;
          }
        }
      }
    } catch {
      // fallback to direct URL
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = sourceDataUrl;

      const timeout = setTimeout(() => {
        resolve({
          primary: "#e2e8f0",
          palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
          contrastRatio: getContrastRatio("#e2e8f0"),
          resolvedUrl,
        });
      }, 7000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            return resolve({
              primary: "#e2e8f0",
              palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
              contrastRatio: getContrastRatio("#e2e8f0"),
              resolvedUrl,
            });
          }

          const maxDim = 80;
          let width = img.naturalWidth || img.width || 80;
          let height = img.naturalHeight || img.height || 80;

          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          const colorBuckets: Array<{ r: number; g: number; b: number; score: number; count: number }> = [];
          let totalSaturation = 0;
          let validPixelCount = 0;

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 128) continue;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const l = (max + min) / 510;
            const d = max - min;
            const s = l > 0.5 ? d / (510 - max - min) : (max + min === 0 ? 0 : d / (max + min));

            totalSaturation += s;
            validPixelCount++;

            if (l >= 0.2 && l <= 0.85 && s >= 0.15) {
              const score = s * 1.5 + (1 - Math.abs(l - 0.55));
              let matched = false;

              for (const bucket of colorBuckets) {
                const dr = Math.abs(bucket.r - r);
                const dg = Math.abs(bucket.g - g);
                const db = Math.abs(bucket.b - b);
                if (dr < 35 && dg < 35 && db < 35) {
                  bucket.count += 1;
                  bucket.score = Math.max(bucket.score, score);
                  matched = true;
                  break;
                }
              }

              if (!matched) {
                colorBuckets.push({ r, g, b, score, count: 1 });
              }
            }
          }

          const avgSaturation = validPixelCount > 0 ? totalSaturation / validPixelCount : 0;

          if (avgSaturation < 0.1 || colorBuckets.length === 0) {
            return resolve({
              primary: "#e2e8f0",
              palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
              contrastRatio: getContrastRatio("#e2e8f0"),
              isMonochrome: true,
              resolvedUrl,
            });
          }

          colorBuckets.sort((a, b) => (b.score * Math.log(b.count + 1)) - (a.score * Math.log(a.count + 1)));

          const toHex = (c: number) => c.toString(16).padStart(2, "0");
          const rawPalette = colorBuckets.slice(0, 12).map((c) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`);
          const palette = buildAccessiblePalette(rawPalette);

          if (palette.length > 0) {
            resolve({
              primary: palette[0],
              palette: palette,
              contrastRatio: getContrastRatio(palette[0]),
              isMonochrome: false,
              resolvedUrl,
            });
          } else {
            resolve({
              primary: "#e2e8f0",
              palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
              contrastRatio: getContrastRatio("#e2e8f0"),
              isMonochrome: true,
              resolvedUrl,
            });
          }
        } catch {
          resolve({
            primary: "#e2e8f0",
            palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
            contrastRatio: getContrastRatio("#e2e8f0"),
            resolvedUrl,
          });
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve({
          primary: "#e2e8f0",
          palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
          contrastRatio: getContrastRatio("#e2e8f0"),
          resolvedUrl,
        });
      };
    });
  } catch {
    return {
      primary: "#e2e8f0",
      palette: ["#ffffff", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
      contrastRatio: getContrastRatio("#e2e8f0"),
    };
  }
}

// Apply theme CSS variables to document
export function applyTheme(theme: CustomTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const accent = theme.accentColor || "#ffb6c1";

  root.style.setProperty("--accent-pink", accent);
  root.style.setProperty("--primary", accent);
  root.style.setProperty("--ring", accent);
  root.style.setProperty("--border", hexToRgba(accent, 0.35));
  root.style.setProperty("--wired-grid", hexToRgba(accent, 0.14));
  root.style.setProperty("--bubble-glow", hexToRgba(accent, 0.55));
  root.style.setProperty("--bubble-glow-subtle", hexToRgba(accent, 0.2));
  root.style.setProperty("--bubble-sheen", hexToRgba(accent, 0.3));
  root.style.setProperty("--glass-border", hexToRgba(accent, 0.18));
  root.style.setProperty("--glass-border-hover", hexToRgba(accent, 0.5));
  root.style.setProperty("--text-glow", hexToRgba(accent, 0.65));

  try {
    localStorage.setItem("wired_sys_theme", JSON.stringify(theme));
    window.dispatchEvent(new CustomEvent("wired_theme_change", { detail: theme }));
  } catch {
    // ignore
  }
}

export function loadSavedTheme(): CustomTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const saved = localStorage.getItem("wired_sys_theme");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return DEFAULT_THEME;
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_THEME;
}

// Export theme as formatted JSON string
export function exportThemeJSON(theme: CustomTheme, name: string = "Custom Theme"): string {
  const exportPayload: PremadeTheme = {
    id: `custom-${Date.now()}`,
    name,
    wallpaperUrl: theme.wallpaperUrl,
    accentColor: theme.accentColor,
    wallpaperDim: theme.wallpaperDim,
    wallpaperBlur: theme.wallpaperBlur,
    author: "User",
  };
  return JSON.stringify(exportPayload, null, 2);
}

// Import theme from JSON string
export function importThemeJSON(jsonStr: string): PremadeTheme | null {
  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (!parsed || typeof parsed !== "object") return null;

    if (!parsed.accentColor && !parsed.wallpaperUrl) return null;

    return {
      id: parsed.id || `custom-${Date.now()}`,
      name: parsed.name || "Imported Theme",
      wallpaperUrl: parsed.wallpaperUrl || "",
      accentColor: parsed.accentColor || "#ffb6c1",
      wallpaperDim: typeof parsed.wallpaperDim === "number" ? parsed.wallpaperDim : 0.65,
      wallpaperBlur: typeof parsed.wallpaperBlur === "number" ? parsed.wallpaperBlur : 4,
      author: parsed.author || "Imported",
    };
  } catch {
    return null;
  }
}

// User-saved custom themes in localStorage
export function getUserCustomThemes(): PremadeTheme[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_THEMES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveUserCustomTheme(theme: PremadeTheme) {
  if (typeof window === "undefined") return;
  try {
    const current = getUserCustomThemes();
    const filtered = current.filter((t) => t.id !== theme.id);
    const updated = [theme, ...filtered];
    localStorage.setItem(SAVED_THEMES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("wired_presets_change", { detail: updated }));
  } catch {
    // ignore
  }
}

export function deleteUserCustomTheme(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getUserCustomThemes();
    const updated = current.filter((t) => t.id !== id);
    localStorage.setItem(SAVED_THEMES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("wired_presets_change", { detail: updated }));
  } catch {
    // ignore
  }
}
