"use client";

import { useState } from "react";
import type { PercursoRoute } from "@/lib/content/types";
import Reveal from "./Reveal";
import RouteViewer from "./RouteViewer";

/**
 * Course routes with a selector. When there's more than one route the visitor
 * switches between them (segmented tabs) and the map + complementary data update
 * to the chosen route.
 */
export default function PercursoRoutes({ routes }: { routes: PercursoRoute[] }) {
  const [idx, setIdx] = useState(0);
  if (routes.length === 0) return null;
  const active = Math.min(idx, routes.length - 1);
  const route = routes[active];
  const multi = routes.length > 1;

  const facts = [
    { label: "Distância", value: route.distance, big: true },
    { label: "Elevação", value: route.elevation, big: true },
    { label: "Largada/Chegada", value: route.startFinish, big: false },
  ].filter((f) => f.value);

  return (
    <>
      {multi && (
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Escolha o percurso"
        >
          {routes.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-current={i === active ? "true" : undefined}
              onClick={() => setIdx(i)}
              className={`min-h-11 rounded-full px-5 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors ${
                i === active
                  ? "bg-gold text-gold-ink"
                  : "bg-ink-panel text-muted-strong hover:text-cream"
              }`}
            >
              {r.title || `Percurso ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
        {/* The bordered box stays mounted (no reveal replay on switch); only the
            inner RouteViewer is keyed by route so its view/state reset cleanly. */}
        <Reveal className="overflow-hidden border-2 border-gold bg-ink-panel">
          <RouteViewer key={route.id} route={route} />
        </Reveal>

        <Reveal delay={120} className="flex flex-col justify-center gap-6 md:gap-[26px]">
          {multi && (
            <div className="font-display text-[22px] font-bold uppercase text-gold">
              {route.title}
            </div>
          )}
          {facts.map((f) => (
            <div key={f.label}>
              <div className="text-[12px] uppercase opacity-60">{f.label}</div>
              <div
                className={`font-display font-bold ${f.big ? "text-[30px]" : "text-[22px]"}`}
              >
                {f.value}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </>
  );
}
