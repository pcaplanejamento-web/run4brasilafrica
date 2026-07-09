import type { LocationSection } from "@/lib/content/types";
import { geocodeAddress, type LatLon } from "@/lib/geocode";
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

  // Resolve the map (server-side): explicit Google embed URL → iframe; otherwise
  // geocode the address and render an interactive Leaflet map on the client.
  let pt: LatLon | null = null;
  if (!isGoogleEmbed && address) pt = await geocodeAddress(address);
  const hasMap = isGoogleEmbed || !!pt;

  const hasText = !!(venue || address);
  if (!hasMap && !hasText) return null;

  const directions = isMapsLink
    ? link
    : address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
      : "";

  return (
    <section id="localizacao" className="bg-ink-deep px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow as="h2">{location?.title?.trim() || "Localização"}</SectionEyebrow>
      {note && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/70 md:text-[16px]">
          {note}
        </p>
      )}

      <div className={`mt-8 grid grid-cols-1 gap-8 ${hasText ? "md:grid-cols-2 md:items-center" : ""}`}>
        {hasMap && (
          <div className="overflow-hidden rounded-2xl border border-line-soft bg-ink-panel">
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
