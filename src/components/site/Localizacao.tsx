import type { LocationSection } from "@/lib/content/types";
import { geocodeAddress, resolveGoogleMapsCoords, type LatLon } from "@/lib/geocode";
import SectionEyebrow from "./SectionEyebrow";
import LeafletMap from "./LeafletMap";

/**
 * "Localização / como chegar" — a map + address + a "Como chegar" button.
 *
 * The map is rendered **server-side** as an OpenStreetMap iframe (embeddable, no
 * key), from the address geocoded via `geocodeAddress` (cached in KV) — so the
 * map is already in the HTML, with no client fetch. A real Google **embed** URL
 * (`/maps/embed?pb=…`) pasted in the ADM is used as-is; a Google share/place
 * link (`maps.app.goo.gl/…`) can't be embedded, so it becomes the "Como chegar"
 * destination. Self-hides when nothing is configured.
 */
export default async function Localizacao({ location }: { location?: LocationSection }) {
  const address = location?.address?.trim();
  const venue = location?.venueName?.trim();
  const note = location?.note?.trim();
  const link = location?.mapEmbedUrl?.trim() || "";

  const isGoogleEmbed = /\/maps\/embed/.test(link);
  const isMapsLink =
    !isGoogleEmbed && /(google\.[^/]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(link);

  // Resolve the map coordinates (server-side): a Google embed URL → iframe;
  // otherwise use the exact pin from the pasted Google link, falling back to
  // geocoding the address. The Leaflet map renders those coords on the client.
  let pt: LatLon | null = null;
  if (!isGoogleEmbed) {
    if (isMapsLink) pt = await resolveGoogleMapsCoords(link);
    if (!pt && address) pt = await geocodeAddress(address);
  }
  const hasMap = isGoogleEmbed || !!pt;

  const hasText = !!(venue || address);
  if (!hasMap && !hasText) return null;

  // "Como chegar" opens Google Maps directions (route from the visitor's location)
  // to the exact resolved coordinates, falling back to the address.
  const destination = pt ? `${pt.lat},${pt.lon}` : address || "";
  const directions = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : "";

  return (
    <section id="localizacao" className="bg-ink px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow as="h2">{location?.title?.trim() || "Localização"}</SectionEyebrow>
      {note && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/70 md:text-[16px]">
          {note}
        </p>
      )}

      <div className={`mt-8 grid grid-cols-1 gap-8 ${hasText ? "md:grid-cols-2 md:items-center" : ""}`}>
        {hasMap && (
          // `isolate` confines the map's internal z-indexes (Leaflet panes/
          // controls go up to ~1000) so they can't paint over the sticky header.
          <div className="isolate overflow-hidden rounded-2xl border border-line-soft bg-ink-panel">
            {isGoogleEmbed ? (
              <iframe
                src={link}
                title="Mapa da localização"
                loading="lazy"
                className="h-[300px] w-full md:h-[380px]"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              pt && <LeafletMap lat={pt.lat} lon={pt.lon} />
            )}
          </div>
        )}

        {hasText && (
          <div>
            {venue && (
              <div className="font-display text-[22px] font-bold uppercase text-cream md:text-[26px]">
                {venue}
              </div>
            )}
            {address && (
              <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">{address}</p>
            )}
            {directions && (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="clip-cta-lg mt-6 inline-block bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5"
              >
                Como chegar
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
