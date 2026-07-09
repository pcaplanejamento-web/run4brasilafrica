import "server-only";
import { getMediaKV } from "./cf";

export interface LatLon {
  lat: number;
  lon: number;
}

const UA = "Run4BrasilAfrica/1.0 (https://run4brasilafrica.com.br)";

async function cacheGet(key: string): Promise<LatLon | null> {
  const kv = getMediaKV();
  if (!kv) return null;
  return (await kv.get(key, "json")) as LatLon | null;
}
async function cachePut(key: string, loc: LatLon): Promise<void> {
  const kv = getMediaKV();
  if (kv) await kv.put(key, JSON.stringify(loc), { expirationTtl: 60 * 60 * 24 * 30 });
}

/**
 * Extract coordinates from a Google Maps link (short `maps.app.goo.gl/…` or a
 * place URL). Follows the redirect and reads the exact pin from the resolved URL
 * (`!3d<lat>!4d<lon>`) — far more reliable than geocoding a free-form address.
 * Cached in KV. Returns null if no coords can be found.
 */
export async function resolveGoogleMapsCoords(url: string): Promise<LatLon | null> {
  const key = `gmap:${url}`;
  const cached = await cacheGet(key);
  if (cached) return cached;

  try {
    const r = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Run4BrasilAfrica/1.0)" },
    });
    const text = `${r.url}\n${await r.text()}`;
    const m =
      text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!m) return null;
    const loc: LatLon = { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
    await cachePut(key, loc);
    return loc;
  } catch {
    return null;
  }
}

async function nominatim(q: string): Promise<LatLon | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": UA, "Accept-Language": "pt-BR" } },
    );
    const arr = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Geocode a free-form address via Nominatim (OpenStreetMap, no key), cached in
 * KV. Nominatim is picky, so we try the full address then progressively simpler
 * variations (drop CEP, drop neighborhood) until one resolves. Returns null if
 * none do.
 */
export async function geocodeAddress(qRaw: string): Promise<LatLon | null> {
  const q = qRaw.trim();
  if (!q) return null;

  const key = `geo:${q.toLowerCase()}`;
  const cached = await cacheGet(key);
  if (cached) return cached;

  // Build fallback queries: full, then without the CEP, then keep the last 2
  // comma-parts (city, state), etc.
  const noCep = q.replace(/,?\s*\d{5}-?\d{3}\s*$/, "").trim();
  const parts = noCep.split(",").map((s) => s.trim()).filter(Boolean);
  const candidates = [
    q,
    noCep,
    parts.length > 2 ? [parts[0], ...parts.slice(-2)].join(", ") : "", // street + city + state
    parts.length >= 2 ? parts.slice(-2).join(", ") : "", // city + state
  ].filter((c, i, a) => c && a.indexOf(c) === i);

  for (const c of candidates) {
    const loc = await nominatim(c);
    if (loc) {
      await cachePut(key, loc);
      return loc;
    }
  }
  return null;
}
