"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Renders an interactive OpenStreetMap map with Leaflet, loading tiles directly
 * (no OSM `embed.html`, which renders blank in some browsers). Leaflet is
 * imported dynamically so it never runs during SSR (it touches `window`); a
 * `circleMarker` avoids Leaflet's default-icon image path issue with bundlers.
 */
export default function LeafletMap({ lat, lon }: { lat: number; lon: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    let ro: ResizeObserver | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([lat, lon], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      L.circleMarker([lat, lon], {
        radius: 9,
        color: "#c8ce2e",
        weight: 3,
        fillColor: "#c8ce2e",
        fillOpacity: 0.9,
      }).addTo(map);
      // The container may not have its final size when the map inits — recompute
      // so all tiles load, and keep it correct on resize.
      const fix = () => map?.invalidateSize();
      setTimeout(fix, 200);
      ro = new ResizeObserver(fix);
      ro.observe(ref.current);
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
    };
  }, [lat, lon]);

  return <div ref={ref} className="h-[300px] w-full md:h-[380px]" style={{ background: "#20242a" }} />;
}
