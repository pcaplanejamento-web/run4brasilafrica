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
      // A proper teardrop pin (SVG divIcon — no default-icon image path issue),
      // in the brand gold, anchored at its tip on the exact location.
      const pin = L.divIcon({
        className: "",
        iconSize: [34, 46],
        iconAnchor: [17, 46],
        html: `<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))"><path d="M17 1C8.2 1 1 8.1 1 17c0 11.6 16 28 16 28s16-16.4 16-28C33 8.1 25.8 1 17 1z" fill="#c8ce2e" stroke="#1a1400" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#1a1400"/></svg>`,
      });
      L.marker([lat, lon], { icon: pin, keyboard: false }).addTo(map);
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
