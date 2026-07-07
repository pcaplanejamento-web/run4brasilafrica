import type { Percurso, PercursoRoute } from "./types";

/**
 * The routes to display for the course section: the explicit `routes` list, or
 * a single route built from the legacy single-route fields (back-compat).
 */
export function percursoRoutes(p: Percurso): PercursoRoute[] {
  if (p.routes && p.routes.length) return p.routes;
  return [
    {
      id: "principal",
      title: p.title || "Percurso",
      stravaRouteRef: p.stravaRouteRef,
      garminRouteRef: p.garminRouteRef,
      distance: p.distance,
      elevation: p.elevation,
      startFinish: p.startFinish,
    },
  ];
}

/** Extract a numeric Strava route ID from an ID or a strava.com/routes/<id> link. */
export function stravaRouteId(ref: string | undefined): string | null {
  if (!ref) return null;
  const m = ref.match(/(\d{4,})/);
  return m ? m[1] : null;
}

/**
 * Whether a Strava reference is usable — a direct id/route link, OR any Strava
 * URL (including short links `strava.app.link/…` that must be resolved at
 * runtime via /api/strava-resolve).
 */
export function hasStrava(ref: string | undefined): boolean {
  if (!ref) return false;
  return !!stravaRouteId(ref) || /strava\.(app\.link|com)/i.test(ref);
}

export interface GarminView {
  /** "embed" → an iframe map; "event" → a Garmin event page (link/card). */
  kind: "embed" | "event";
  url: string;
}

/**
 * Interpret a Garmin reference. Course/activity/route links (numeric or UUID)
 * become an embeddable map; **event** links (`/modern/event/<id>`) have no
 * embeddable map, so they're surfaced as the event page (shown as a card/link).
 */
export function garminView(ref: string | undefined): GarminView | null {
  if (!ref) return null;
  const ev = ref.match(/\/event\/([A-Za-z0-9_-]+)/i);
  if (ev) {
    return { kind: "event", url: `https://connect.garmin.com/modern/event/${ev[1]}` };
  }
  const m = ref.match(/\/(course|activity|route)\/(?:embed\/)?([A-Za-z0-9_-]+)/i);
  if (m) {
    return {
      kind: "embed",
      url: `https://connect.garmin.com/modern/${m[1].toLowerCase()}/embed/${m[2]}`,
    };
  }
  const n = ref.match(/^\s*(\d{4,})\s*$/);
  if (n) {
    return { kind: "embed", url: `https://connect.garmin.com/modern/course/embed/${n[1]}` };
  }
  return null;
}
