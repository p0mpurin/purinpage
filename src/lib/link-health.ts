import report from "./link-health.json";

/** Written by `npm run check-health`. Only high-confidence failures are listed as dead. */
const dead = new Set<string>(report.dead);
const unsure = new Set<string>(report.unsure);

export type LinkHealth = "ok" | "dead" | "unknown";

export const healthCheckedAt: string | null = report.checkedAt;

export function linkHealth(url: string): LinkHealth {
  if (!report.checkedAt) return "unknown";
  if (dead.has(url)) return "dead";
  if (unsure.has(url)) return "unknown";
  return "ok";
}
