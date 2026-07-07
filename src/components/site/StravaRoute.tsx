"use client";

import { useEffect } from "react";

/**
 * Public Strava route map via the official embed. Needs only a PUBLIC route ID —
 * no API credentials/OAuth. The `.route-embed` wrapper + global CSS force the
 * injected iframe to fill the section width.
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
      const w = window as unknown as { __STRAVA_EMBED_BOOTSTRAP__?: () => void };
      w.__STRAVA_EMBED_BOOTSTRAP__?.();
    }
  }, [routeId]);

  return (
    <div className="route-embed">
      <div
        className="strava-embed-placeholder"
        data-embed-type="route"
        data-embed-id={routeId}
        data-style="standard"
        data-terrain="3d"
        data-render-full="false"
      />
    </div>
  );
}
