"use client";

import { useState } from "react";
import StravaRoute from "./StravaRoute";
import GarminRoute from "./GarminRoute";

/**
 * Shows the course map. When both Strava and Garmin are configured, the visitor
 * chooses which to see via a segmented toggle (Strava is shown by default);
 * with only one configured it shows that one; otherwise a placeholder. Embeds
 * fill the section width.
 */
export default function RouteViewer({
  stravaId,
  garminUrl,
}: {
  stravaId: string | null;
  garminUrl: string | null;
}) {
  const hasStrava = !!stravaId;
  const hasGarmin = !!garminUrl;
  const both = hasStrava && hasGarmin;
  const [provider, setProvider] = useState<"strava" | "garmin">("strava");

  if (!hasStrava && !hasGarmin) {
    return (
      <div className="flex h-[240px] items-center justify-center md:h-[320px]">
        <span className="font-[monospace] text-[12px] text-muted">
          [ mapa do percurso — configure Strava ou Garmin no ADM ]
        </span>
      </div>
    );
  }

  const showStrava = both ? provider === "strava" : hasStrava;

  return (
    <div className="flex w-full flex-col">
      {both && (
        <div
          className="flex overflow-hidden border-b border-line-soft"
          role="tablist"
          aria-label="Escolha a visualização do percurso"
        >
          {(["strava", "garmin"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-current={provider === p ? "true" : undefined}
              onClick={() => setProvider(p)}
              className={`min-h-11 flex-1 px-4 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors sm:flex-none ${
                provider === p
                  ? "bg-gold text-gold-ink"
                  : "bg-ink-panel text-muted-strong hover:text-cream"
              }`}
            >
              {p === "strava" ? "Strava" : "Garmin"}
            </button>
          ))}
        </div>
      )}

      {showStrava ? (
        <StravaRoute routeId={stravaId as string} />
      ) : (
        <GarminRoute url={garminUrl as string} />
      )}
    </div>
  );
}
