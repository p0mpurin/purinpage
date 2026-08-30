"use client";

import { useEffect, useState } from "react";
import {
  type CustomTheme,
  type PremadeTheme,
  DEFAULT_THEME,
  BUILTIN_PRESET_THEMES,
  normalizeWallpaperUrl,
  extractDominantColor,
  applyTheme,
  loadSavedTheme,
  exportThemeJSON,
  importThemeJSON,
  getUserCustomThemes,
  saveUserCustomTheme,
  deleteUserCustomTheme,
  getContrastRatio,
} from "@/lib/theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<CustomTheme>(DEFAULT_THEME);
  const [rawWallpaperInput, setRawWallpaperInput] = useState("");
  const [syncingColor, setSyncingColor] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [syncedContrast, setSyncedContrast] = useState<number | null>(null);
  
  // Premade & User Themes State
  const [userThemes, setUserThemes] = useState<PremadeTheme[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportThemeName, setExportThemeName] = useState("My Theme");
  const [importJsonText, setImportJsonText] = useState("");
  const [copiedExport, setCopiedExport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedTheme();
      setTheme(saved);
      setRawWallpaperInput(saved.wallpaperUrl);
      setExtractedPalette(saved.extractedPalette || []);
      setSyncedContrast(saved.extractedPalette?.length ? getContrastRatio(saved.accentColor) : null);
      setUserThemes(getUserCustomThemes());
      setSavedSuccess(false);
      setSyncMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allThemes: PremadeTheme[] = [
    ...userThemes,
    ...BUILTIN_PRESET_THEMES.filter((b) => !userThemes.some((u) => u.id === b.id)),
  ];

  const handleApplyWallpaper = (url: string) => {
    const normalized = normalizeWallpaperUrl(url);
    const updated = { ...theme, wallpaperUrl: normalized };
    setTheme(updated);
    setRawWallpaperInput(url);
    applyTheme(updated);
  };

  const handleSyncColors = async () => {
    if (!theme.wallpaperUrl) {
      setSyncMsg("Please enter a wallpaper link first.");
      return;
    }
    setSyncingColor(true);
    setSyncMsg(null);

    const result = await extractDominantColor(theme.wallpaperUrl);
    setSyncingColor(false);

    if (result && result.primary) {
      const updated = {
        ...theme,
        wallpaperUrl: result.resolvedUrl || theme.wallpaperUrl,
        accentColor: result.primary,
        extractedPalette: result.palette,
      };
      setTheme(updated);
      setExtractedPalette(result.palette);
      setSyncedContrast(result.contrastRatio);
      applyTheme(updated);
      setSyncMsg(
        result.isMonochrome
          ? `Monochrome palette tuned for clarity · ${result.contrastRatio.toFixed(1)}:1 contrast.`
          : `Wallpaper hue matched · ${result.contrastRatio.toFixed(1)}:1 contrast (WCAG AA).`
      );
    } else {
      setSyncMsg("Could not extract colors. You can pick an accent color below.");
    }
  };

  const handleSelectColor = (hex: string) => {
    const updated = { ...theme, accentColor: hex };
    setTheme(updated);
    setSyncedContrast(getContrastRatio(hex));
    applyTheme(updated);
  };

  const handleApplyPreset = (preset: PremadeTheme) => {
    const updated: CustomTheme = {
      wallpaperUrl: preset.wallpaperUrl,
      accentColor: preset.accentColor,
      wallpaperDim: preset.wallpaperDim,
      wallpaperBlur: preset.wallpaperBlur,
      presetName: preset.name,
      extractedPalette: [],
    };
    setTheme(updated);
    setRawWallpaperInput(preset.wallpaperUrl);
    applyTheme(updated);
    setSyncMsg(`Applied "${preset.name}".`);
  };

  const handleSave = () => {
    applyTheme(theme);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    setRawWallpaperInput("");
    setExtractedPalette([]);
    setSyncedContrast(null);
    applyTheme(DEFAULT_THEME);
    setSyncMsg("Reset to default theme.");
  };

  const handleCopyExportJSON = () => {
    const jsonStr = exportThemeJSON(theme, exportThemeName);
    navigator.clipboard.writeText(jsonStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleSaveToMyPresets = () => {
    const newPreset: PremadeTheme = {
      id: `custom-${Date.now()}`,
      name: exportThemeName.trim() || "My Theme",
      wallpaperUrl: theme.wallpaperUrl,
      accentColor: theme.accentColor,
      wallpaperDim: theme.wallpaperDim,
      wallpaperBlur: theme.wallpaperBlur,
      author: "Me",
    };
    saveUserCustomTheme(newPreset);
    setUserThemes(getUserCustomThemes());
    setShowExportModal(false);
    setSyncMsg(`Saved "${newPreset.name}" to your presets!`);
  };

  const handleDoImport = () => {
    setImportError(null);
    const parsed = importThemeJSON(importJsonText);
    if (!parsed) {
      setImportError("Invalid theme JSON. Please check formatting.");
      return;
    }

    handleApplyPreset(parsed);
    saveUserCustomTheme(parsed);
    setUserThemes(getUserCustomThemes());
    setShowImportModal(false);
    setImportJsonText("");
    setSyncMsg(`Imported and applied "${parsed.name}".`);
  };

  const handleDeleteUserTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteUserCustomTheme(id);
    setUserThemes(getUserCustomThemes());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[#0a0812]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--wired-grid)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)] shadow-[0_0_8px_var(--accent-pink)]" />
              <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[var(--accent-pink)]">
                [WIRED.SYS // APPEARANCE]
              </span>
            </div>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Theme & Wallpaper Studio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--wired-grid)] bg-black/40 text-white/60 transition-colors hover:border-[var(--accent-pink)] hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Settings Form Body */}
        <div className="flex flex-col gap-5 overflow-y-auto py-5 pr-1 scrollbar-none">
          
          {/* User Themes & Export/Import Controls */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-white/90">
                {allThemes.length > 0 ? `Saved Themes (${allThemes.length})` : "Theme Presets"}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="font-mono text-[0.68rem] text-[var(--accent-pink)] hover:underline cursor-pointer"
                >
                  Export Current
                </button>
                <span className="text-white/20">·</span>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="font-mono text-[0.68rem] text-[var(--accent-pink)] hover:underline cursor-pointer"
                >
                  Import JSON
                </button>
              </div>
            </div>

            {/* Presets Horizontal Slider (only if user saved or imported any) */}
            {allThemes.length > 0 ? (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {allThemes.map((preset) => {
                  const isActive = theme.wallpaperUrl === preset.wallpaperUrl;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`group relative shrink-0 flex flex-col w-32 overflow-hidden rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? "border-[var(--accent-pink)] ring-2 ring-[var(--accent-pink)] shadow-[0_0_15px_var(--bubble-glow-subtle)]"
                          : "border-[var(--wired-grid)] bg-black/40 hover:border-white/40"
                      }`}
                    >
                      {/* Thumbnail Image */}
                      <div className="relative h-18 w-full overflow-hidden bg-black/60">
                        {preset.wallpaperUrl ? (
                          <img
                            src={preset.wallpaperUrl}
                            alt={preset.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-black/80 font-mono text-[0.65rem] text-white/40">
                            No Image
                          </div>
                        )}
                        
                        {/* Accent Dot on Top-Right */}
                        <span
                          className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full border border-black/80 shadow-md"
                          style={{ backgroundColor: preset.accentColor }}
                        />

                        {/* Delete Custom Preset Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteUserTheme(preset.id, e)}
                          title="Delete saved preset"
                          className="absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-[0.6rem] text-white hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Preset Name */}
                      <div className="p-2 bg-black/80">
                        <p className="truncate font-mono text-[0.68rem] font-bold text-white">
                          {preset.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Wallpaper URL Input */}
          <div className="space-y-2 text-left">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-white/90">
              Custom Wallpaper URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste direct image link or Wallhaven URL..."
                value={rawWallpaperInput}
                onChange={(e) => {
                  setRawWallpaperInput(e.target.value);
                  handleApplyWallpaper(e.target.value);
                }}
                className="w-full rounded-xl border border-[var(--wired-grid)] bg-black/50 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-white/30 focus:border-[var(--accent-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-pink)]"
              />
              {rawWallpaperInput && (
                <button
                  type="button"
                  onClick={() => handleApplyWallpaper("")}
                  className="shrink-0 rounded-xl border border-[var(--wired-grid)] bg-black/40 px-3 font-mono text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Sync Colors Action */}
          {theme.wallpaperUrl && (
            <div className="rounded-2xl border border-[var(--wired-grid)] bg-black/30 p-3.5 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-white/90">
                    Sync Colors with Image
                  </p>
                  <p className="text-[0.7rem] text-[var(--text-main)] opacity-70">
                    Matches wallpaper hues and lifts dark colors for readable text
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncColors}
                  disabled={syncingColor}
                  className="shrink-0 rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)]/15 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-pink)] transition-all hover:bg-[var(--accent-pink)] hover:text-black disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  {syncingColor ? "Scanning..." : "Sync Colors"}
                </button>
              </div>

              {/* Extracted Swatches */}
              {extractedPalette.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--wired-grid)] flex items-center gap-2">
                  <span className="font-mono text-[0.68rem] text-white/60">Readable palette:</span>
                  <div className="flex items-center gap-1.5">
                    {extractedPalette.map((hex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectColor(hex)}
                        title={`${hex.toUpperCase()} · ${getContrastRatio(hex).toFixed(1)}:1 contrast`}
                        className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                          theme.accentColor.toLowerCase() === hex.toLowerCase()
                            ? "border-white ring-2 ring-[var(--accent-pink)] scale-110"
                            : "border-black/60"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {syncMsg && (
                <p className="mt-2 font-mono text-xs text-[var(--accent-pink)]">
                  {syncMsg}
                </p>
              )}
              {syncedContrast !== null && (
                <p className="mt-1 font-mono text-[0.65rem] text-white/45">
                  Text clarity: {syncedContrast >= 7 ? "AAA" : syncedContrast >= 4.5 ? "AA" : "Low"} · {syncedContrast.toFixed(1)}:1 on dark panels
                </p>
              )}
            </div>
          )}

          {/* Accent Color Picker */}
          <div className="space-y-2 text-left">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-white/90">
              Accent Color
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--wired-grid)] bg-black/40 p-3">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-white/20 bg-transparent p-0"
              />
              <span className="font-mono text-xs font-semibold uppercase text-[var(--accent-pink)]">
                {theme.accentColor}
              </span>
            </div>
          </div>

          {/* Wallpaper Sliders */}
          {theme.wallpaperUrl && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--wired-grid)] bg-black/30 p-3.5 sm:grid-cols-2 text-left">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-white/80">Darkness</span>
                  <span className="font-mono text-xs text-[var(--accent-pink)]">
                    {Math.round(theme.wallpaperDim * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.92"
                  step="0.02"
                  value={theme.wallpaperDim}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const updated = { ...theme, wallpaperDim: val };
                    setTheme(updated);
                    applyTheme(updated);
                  }}
                  className="w-full accent-[var(--accent-pink)] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-white/80">Blur</span>
                  <span className="font-mono text-xs text-[var(--accent-pink)]">
                    {theme.wallpaperBlur}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={theme.wallpaperBlur}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const updated = { ...theme, wallpaperBlur: val };
                    setTheme(updated);
                    applyTheme(updated);
                  }}
                  className="w-full accent-[var(--accent-pink)] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between border-t border-[var(--wired-grid)] pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="font-mono text-xs text-white/50 hover:text-red-300 transition-colors cursor-pointer"
          >
            Reset Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--wired-grid)] bg-black/40 px-3.5 py-2 font-mono text-xs text-white/70 hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black shadow-md transition-all hover:bg-white cursor-pointer"
            >
              {savedSuccess ? "Saved" : "Save & Apply"}
            </button>
          </div>
        </div>

        {/* Export Theme Modal Dialog */}
        {showExportModal && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between bg-[#0a0812] p-6 text-left rounded-3xl animate-in fade-in zoom-in-95">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--wired-grid)] pb-3">
                <h3 className="font-mono text-sm font-bold uppercase text-[var(--accent-pink)]">
                  Export Custom Theme
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="text-white/60 hover:text-white font-mono text-xs cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <label className="block font-mono text-xs text-white/80 mb-1.5">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={exportThemeName}
                  onChange={(e) => setExportThemeName(e.target.value)}
                  placeholder="e.g. Cyberpunk Violet..."
                  className="w-full rounded-xl border border-[var(--border)] bg-black/60 p-2.5 font-mono text-xs text-white"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-white/80 mb-1.5">
                  Theme JSON Code
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={exportThemeJSON(theme, exportThemeName)}
                  className="w-full rounded-xl border border-[var(--wired-grid)] bg-black/80 p-3 font-mono text-[0.7rem] text-white/90 select-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--wired-grid)]">
              <button
                type="button"
                onClick={handleSaveToMyPresets}
                className="rounded-xl border border-[var(--border)] bg-black/60 px-4 py-2 font-mono text-xs font-semibold text-white hover:border-[var(--accent-pink)] cursor-pointer"
              >
                Save to My Presets Shelf
              </button>
              <button
                type="button"
                onClick={handleCopyExportJSON}
                className="rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)] px-4 py-2 font-mono text-xs font-bold uppercase text-black hover:bg-white cursor-pointer"
              >
                {copiedExport ? "Copied JSON!" : "Copy Code"}
              </button>
            </div>
          </div>
        )}

        {/* Import Theme Modal Dialog */}
        {showImportModal && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between bg-[#0a0812] p-6 text-left rounded-3xl animate-in fade-in zoom-in-95">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--wired-grid)] pb-3">
                <h3 className="font-mono text-sm font-bold uppercase text-[var(--accent-pink)]">
                  Import Theme JSON
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError(null);
                  }}
                  className="text-white/60 hover:text-white font-mono text-xs cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <label className="block font-mono text-xs text-white/80 mb-1.5">
                  Paste Theme JSON Code
                </label>
                <textarea
                  rows={8}
                  placeholder={`{\n  "name": "My Custom Theme",\n  "wallpaperUrl": "https://...",\n  "accentColor": "#ffb6c1",\n  "wallpaperDim": 0.65,\n  "wallpaperBlur": 4\n}`}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-black/80 p-3 font-mono text-xs text-white placeholder:text-white/20 focus:border-[var(--accent-pink)] focus:outline-none"
                />
                {importError && (
                  <p className="mt-1.5 font-mono text-xs text-red-400">{importError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--wired-grid)]">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="rounded-xl border border-[var(--wired-grid)] bg-black/60 px-4 py-2 font-mono text-xs text-white/80 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDoImport}
                disabled={!importJsonText.trim()}
                className="rounded-xl border border-[var(--accent-pink)] bg-[var(--accent-pink)] px-5 py-2 font-mono text-xs font-bold uppercase text-black hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                Apply & Save Theme
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
