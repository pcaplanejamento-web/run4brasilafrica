"use client";

import { useState } from "react";
import type { PercursoRoute } from "@/lib/content/types";
import { garminView, stravaRouteId } from "@/lib/content/percurso";
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
  const stravaId = stravaRouteId(route.stravaRouteRef);
  const garmin = garminView(route.garminRouteRef);
  const fallback = route.fallbackImage;

  const views: View[] = [];
  if (stravaId) views.push("strava");
  if (garmin) views.push("garmin");
  if (fallback) views.push("fallback");

  const [view, setView] = useState<View>(views[0] ?? "strava");
  const active = views.includes(view) ? view : views[0];

  if (views.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center md:h-[320px]">
        <span className="font-[monospace] text-[12px] text-muted">
          [ mapa do percurso — configure Strava, Garmin ou uma imagem no ADM ]
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {views.length > 1 && (
        <div
          className="flex overflow-hidden border-b border-line-soft"
          role="tablist"
          aria-label="Escolha a visualização do percurso"
        >
          {views.map((v) => (
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
          ))}
        </div>
      )}

      {active === "strava" && stravaId && <StravaRoute routeId={stravaId} />}
      {active === "garmin" && garmin?.kind === "embed" && <GarminRoute url={garmin.url} />}
      {active === "garmin" && garmin?.kind === "event" && <GarminEvent url={garmin.url} />}
      {active === "fallback" && fallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallback}
          alt={`Mapa do percurso ${route.title}`}
          className="h-[360px] w-full bg-ink object-contain md:h-[440px]"
        />
      )}
    </div>
  );
}
