"use client";

import { useEffect, useRef } from "react";

/**
 * Public Strava route map via the official embed. Needs only a PUBLIC route ID —
 * no API credentials/OAuth. The `.route-embed` wrapper + global CSS force the
 * injected iframe to fill the section width; a MutationObserver enforces it too,
 * since embed.js sets a fixed width on the iframe it injects.
 */
export default function StravaRoute({ routeId }: { routeId: string }) {
  const ref = useRef<HTMLDivElement>(null);

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

    const el = ref.current;
    if (!el) return;
    const enforce = () => {
      el.querySelectorAll("iframe").forEach((f) => {
        f.style.width = "100%";
        f.style.maxWidth = "100%";
        f.style.border = "0";
      });
    };
    enforce();
    const observer = new MutationObserver(enforce);
    observer.observe(el, { childList: true, subtree: true });
    const timer = setTimeout(enforce, 2000);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [routeId]);

  return (
    <div ref={ref} className="route-embed">
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
