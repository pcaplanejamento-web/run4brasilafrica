"use client";

import { useState } from "react";
import type { PercursoRoute } from "@/lib/content/types";
import { garminView, hasStrava } from "@/lib/content/percurso";
import StravaRoute from "./StravaRoute";
import GarminRoute from "./GarminRoute";
import GarminEvent from "./GarminEvent";

type View = "strava" | "garmin" | "fallback";

const LABEL: Record<View, string> = {
  strava: "Strava",
  garmin: "Garmin",
  fallback: "Mapa",
};

/**
 * Shows a single route's map. A route can expose more than one view — Strava,
 * Garmin (embed map or event), and/or a manual fallback image; when more than
 * one is available the visitor picks via a segmented toggle. Embeds fill the
 * section width.
 */
export default function RouteViewer({ route }: { route: PercursoRoute }) {
  const strava = hasStrava(route.stravaRouteRef);
  const garmin = garminView(route.garminRouteRef);
  const fallback = route.fallbackImage;

  const views: View[] = [];
  if (strava) views.push("strava");
  if (garmin) views.push("garmin");
  if (fallback) views.push("fallback");

  const [view, setView] = useState<View>(views[0] ?? "strava");
  const active = views.includes(view) ? view : views[0];

  if (views.length === 0) {
    // Same height as a configured map so the section doesn't jump between routes.
    return (
      <div className="flex h-[474px] items-center justify-center md:h-[584px]">
        <span className="px-6 text-center font-[monospace] text-[12px] text-muted">
          [ mapa do percurso — configure Strava, Garmin ou uma imagem no ADM ]
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* Toolbar — ALWAYS present (fixed height) so switching between routes with
          or without Garmin never moves the map/facts. Toggle when >1 view, else
          a static label of the single provider. */}
      <div
        className="flex min-h-11 items-stretch overflow-hidden border-b border-line-soft"
        role={views.length > 1 ? "tablist" : undefined}
        aria-label="Visualização do percurso"
      >
        {views.length > 1 ? (
          views.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-current={active === v ? "true" : undefined}
              onClick={() => setView(v)}
              className={`min-h-11 flex-1 px-4 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors sm:flex-none ${
                active === v
                  ? "bg-gold text-gold-ink"
                  : "bg-ink-panel text-muted-strong hover:text-cream"
              }`}
            >
              {LABEL[v]}
            </button>
          ))
        ) : (
          <span className="flex min-h-11 items-center px-4 text-[13px] font-bold uppercase tracking-[0.06em] text-muted-strong">
            {LABEL[views[0]]}
          </span>
        )}
      </div>

      {/* Map area — a single fixed height for every provider so it never jumps.
          Tall enough for the Strava map + elevation profile (no crop). */}
      <div className="h-[430px] w-full md:h-[540px]">
        {active === "strava" && strava && <StravaRoute stravaRef={route.stravaRouteRef!} />}
        {active === "garmin" && garmin?.kind === "embed" && <GarminRoute url={garmin.url} />}
        {active === "garmin" && garmin?.kind === "event" && <GarminEvent url={garmin.url} />}
        {active === "fallback" && fallback && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallback}
            alt={`Mapa do percurso ${route.title}`}
            className="h-full w-full bg-ink object-contain"
          />
        )}
      </div>
    </div>
  );
}
