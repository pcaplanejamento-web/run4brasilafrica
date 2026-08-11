"use client";

import { useState } from "react";
import type { PercursoRoute } from "@/lib/content/types";
import { garminView, hasStrava } from "@/lib/content/percurso";
import StravaRoute from "./StravaRoute";
import GarminRoute from "./GarminRoute";
import GarminEvent from "./GarminEvent";
import SegmentedTabs from "./SegmentedTabs";

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
    return (
      <div className="flex h-[400px] items-center justify-center md:h-[520px]">
        <span className="px-6 text-center font-[monospace] text-[12px] text-muted">
          [ mapa do percurso — configure Strava, Garmin ou uma imagem no ADM ]
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* Toolbar — ALWAYS present (fixed height) so switching between routes with
          or without Garmin never moves the map/facts. Com >1 visão é o
          `SegmentedTabs` (mesmo seletor da Galeria); com 1 visão, um rótulo
          estático do único provedor (mesma barra/altura). */}
      {views.length > 1 ? (
        <SegmentedTabs
          items={views.map((v) => LABEL[v])}
          active={views.indexOf(active)}
          onSelect={(i) => setView(views[i])}
          ariaLabel="Visualização do percurso"
        />
      ) : (
        <div
          className="flex min-h-11 items-stretch overflow-hidden border-b border-line-soft"
          aria-label="Visualização do percurso"
        >
          <span className="flex min-h-11 items-center px-4 text-[13px] font-bold uppercase tracking-[0.06em] text-muted-strong">
            {LABEL[views[0]]}
          </span>
        </div>
      )}

      {/* Map area — auto height. The Strava embed sizes itself to its width
          (responsive), so it fits at every proportion (no cut, no empty space).
          Two Strava routes at the same width get the same height → switching
          routes doesn't move anything. Garmin/fallback use their own heights. */}
      <div className="w-full">
        {active === "strava" && strava && <StravaRoute stravaRef={route.stravaRouteRef!} />}
        {active === "garmin" && garmin?.kind === "embed" && <GarminRoute url={garmin.url} />}
        {active === "garmin" && garmin?.kind === "event" && <GarminEvent url={garmin.url} />}
        {active === "fallback" && fallback && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallback}
            alt={`Mapa do percurso ${route.title}`}
            className="h-[400px] w-full bg-ink object-contain md:h-[520px]"
          />
        )}
      </div>
    </div>
  );
}
