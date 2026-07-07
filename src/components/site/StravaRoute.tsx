"use client";

import { useEffect } from "react";

/**
 * Public Strava route map via the official embed. Needs only a PUBLIC route ID —
 * no API credentials/OAuth. The embed script scans for the placeholder div and
 * replaces it with an interactive map iframe.
 */
export default function StravaRoute({ routeId }: { routeId: string }) {
  useEffect(() => {
    const SRC = "https://strava-embeds.com/embed.js";
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (!existing) {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.body.appendChild(s);
    } else {
      // Script already present: re-run its bootstrap so a newly-mounted
      // placeholder gets processed (e.g. after client content hydration).
      const w = window as unknown as { __STRAVA_EMBED_BOOTSTRAP__?: () => void };
      w.__STRAVA_EMBED_BOOTSTRAP__?.();
    }
  }, [routeId]);

  return (
    <div
      className="strava-embed-placeholder h-[240px] w-full md:h-[320px]"
      data-embed-type="route"
      data-embed-id={routeId}
      data-style="standard"
      data-terrain="3d"
      data-render-full="false"
    />
  );
}
