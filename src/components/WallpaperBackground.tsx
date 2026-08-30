"use client";

import { useEffect, useState } from "react";
import { loadSavedTheme, type CustomTheme, DEFAULT_THEME, applyTheme } from "@/lib/theme";

export default function WallpaperBackground() {
  const [theme, setTheme] = useState<CustomTheme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = loadSavedTheme();
    setTheme(saved);
    applyTheme(saved);
    setMounted(true);

    const handleThemeUpdate = (e: CustomEvent<CustomTheme>) => {
      setTheme(e.detail);
      applyTheme(e.detail);
    };

    window.addEventListener("wired_theme_change" as any, handleThemeUpdate);
    return () => {
      window.removeEventListener("wired_theme_change" as any, handleThemeUpdate);
    };
  }, []);

  if (!mounted || !theme.wallpaperUrl) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[-3] overflow-hidden">
      {/* Background Image Layer with Blur & Dim Overlay */}
      <img
        src={theme.wallpaperUrl}
        alt=""
        style={{
          filter: `blur(${theme.wallpaperBlur}px)`,
          transform: "scale(1.05)", // prevent blur edge artifacts
        }}
        className="h-full w-full object-cover transition-all duration-700"
      />
      {/* Dim overlay to ensure 100% text readability */}
      <div
        style={{
          backgroundColor: `rgba(5, 5, 8, ${theme.wallpaperDim})`,
        }}
        className="absolute inset-0 transition-colors duration-500"
      />
    </div>
  );
}
