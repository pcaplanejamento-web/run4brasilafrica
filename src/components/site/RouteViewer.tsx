"use client";

import { useState } from "react";
import StravaRoute from "./StravaRoute";
import GarminRoute from "./GarminRoute";

/**
 * Shows the course map. When both Strava and Garmin are configured, the visitor
 * picks the provider with a toggle; otherwise shows whichever is set (or a
 * placeholder). Embeds fill the section width.
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
  const [provider, setProvider] = useState<"strava" | "garmin">(
    hasStrava ? "strava" : "garmin",
  );

  if (!hasStrava && !hasGarmin) {
    return (
      <div className="flex h-[240px] items-center justify-center md:h-[320px]">
        <span className="font-[monospace] text-[12px] text-muted">
          [ mapa do percurso — configure Strava ou Garmin no ADM ]
        </span>
      </div>
    );
  }

  const show = both ? provider : hasStrava ? "strava" : "garmin";

  return (
    <div className="w-full">
      {both && (
        <div className="flex gap-1 border-b border-line-soft bg-ink-panel p-1.5">
          {(
            [
              ["strava", "Strava"],
              ["garmin", "Garmin"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setProvider(key)}
              aria-pressed={show === key}
              className={`px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors ${
                show === key
                  ? "bg-gold text-gold-ink"
                  : "text-muted hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {show === "strava" ? (
        <StravaRoute routeId={stravaId as string} />
      ) : (
        <GarminRoute url={garminUrl as string} />
      )}
    </div>
  );
}
