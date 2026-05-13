/** Fallback banner when no Open Graph image is found (animated “ERROR” terminal GIF). */
export const DEFAULT_PREVIEW_BANNER_URL =
  "https://i.pinimg.com/originals/bf/d5/9b/bfd59b9ae67716222ac0c06d35cf21a6.gif";

/** How long preview results stay valid (server + client). */
export const PREVIEW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const PREVIEW_CLIENT_STORAGE_KEY = "wired-sys-link-preview-v1";

/** Max entries in localStorage to avoid quota issues. */
export const PREVIEW_CLIENT_MAX_ENTRIES = 450;
