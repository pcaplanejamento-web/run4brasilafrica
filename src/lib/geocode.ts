import "server-only";
import { getMediaKV } from "./cf";

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Geocode an address to lat/lon via OpenStreetMap Nominatim (free, no key),
 * cached in KV per address so Nominatim is hit at most once per address. Used
 * server-side by the Localização section (so the map iframe is in the HTML) and
 * by `/api/geocode`. Returns null on failure.
 */
export async function geocodeAddress(qRaw: string): Promise<LatLon | null> {
  const q = qRaw.trim();
  if (!q) return null;

  const kv = getMediaKV();
  const key = `geo:${q.toLowerCase()}`;
  if (kv) {
    const cached = (await kv.get(key, "json")) as LatLon | null;
    if (cached) return cached;
  }

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "Run4BrasilAfrica/1.0 (https://run4brasilafrica.com.br)",
          "Accept-Language": "pt-BR",
        },
      },
    );
    const arr = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const loc: LatLon = { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
    if (kv) await kv.put(key, JSON.stringify(loc), { expirationTtl: 60 * 60 * 24 * 30 });
    return loc;
  } catch {
    return null;
  }
}
