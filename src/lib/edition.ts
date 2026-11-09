export type Edition = "day" | "night";

export const EDITION_STORAGE_KEY = "wired_sys_edition_v1";

export function getEdition(): Edition {
  if (typeof document === "undefined") return "day";
  return document.documentElement.dataset.edition === "night" ? "night" : "day";
}

export function setEdition(edition: Edition) {
  document.documentElement.dataset.edition = edition;
  try {
    localStorage.setItem(EDITION_STORAGE_KEY, edition);
  } catch {
    // storage blocked: the choice still applies for this visit
  }
}

const EDITION_EVENT = "wired_edition_change";

export function subscribeEdition(onChange: () => void): () => void {
  window.addEventListener(EDITION_EVENT, onChange);
  return () => window.removeEventListener(EDITION_EVENT, onChange);
}

export function toggleEdition() {
  setEdition(getEdition() === "night" ? "day" : "night");
  window.dispatchEvent(new Event(EDITION_EVENT));
}
