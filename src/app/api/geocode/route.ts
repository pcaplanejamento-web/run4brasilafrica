import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";

export const dynamic = "force-dynamic";

interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Geocode an address to lat/lon via OpenStreetMap Nominatim (free, no key).
 * Results are cached in KV per address so Nominatim is hit at most once per
 * address (respecting its usage policy). Used by the Localização map.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ ok: false }, { status: 400 });

  const kv = getMediaKV();
  const key = `geo:${q.toLowerCase()}`;
  if (kv) {
    const cached = (await kv.get(key, "json")) as LatLon | null;
    if (cached) return NextResponse.json({ ok: true, ...cached });
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
    if (!Array.isArray(arr) || arr.length === 0) {
      return NextResponse.json({ ok: false });
    }
    const loc: LatLon = { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
    if (kv) await kv.put(key, JSON.stringify(loc), { expirationTtl: 60 * 60 * 24 * 30 });
    return NextResponse.json({ ok: true, ...loc });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
