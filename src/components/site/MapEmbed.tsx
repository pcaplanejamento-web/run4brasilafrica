"use client";

import { useEffect, useState } from "react";

/**
 * Embedded map for an address. Geocodes the address (via `/api/geocode`, cached)
 * and shows an **OpenStreetMap** iframe centered on it — OSM can be embedded
 * (no key, no framing block), unlike Google Maps share/place links. Renders
 * nothing if the address can't be located (the card + "Como chegar" still show).
 */
export default function MapEmbed({ address }: { address: string }) {
  const [pt, setPt] = useState<{ lat: number; lon: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/geocode?q=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; lat?: number; lon?: number }) => {
        if (!alive) return;
        if (d.ok && typeof d.lat === "number") setPt({ lat: d.lat, lon: d.lon! });
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [address]);

  if (failed) return null;

  if (!pt) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-line-soft bg-ink-panel md:h-[380px]">
        <span className="font-[monospace] text-[12px] text-muted">carregando mapa…</span>
      </div>
    );
  }

  const d = 0.008;
  const bbox = `${pt.lon - d},${pt.lat - d},${pt.lon + d},${pt.lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${pt.lat},${pt.lon}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line-soft">
      <iframe
        src={src}
        title="Mapa da localização"
        loading="lazy"
        className="h-[300px] w-full md:h-[380px]"
        style={{ border: 0 }}
      />
    </div>
  );
}
