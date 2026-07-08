/**
 * Fire a conversion/interaction event to Google Analytics 4 (via `gtag`) when it
 * is loaded — i.e. when a GA id is set in ADM > Configurações. No-ops otherwise,
 * so nothing breaks when analytics isn't configured. Cloudflare Web Analytics
 * (pageviews) needs no wiring; this is only for custom conversion events.
 */
type TrackParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: TrackParams) => void;
  }
}

export function track(name: string, params?: TrackParams): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    /* never let tracking break the UI */
  }
}
