import type { LocationSection } from "@/lib/content/types";
import SectionEyebrow from "./SectionEyebrow";

/**
 * "Localização / como chegar" — an embedded map + address + a "Como chegar"
 * button (opens directions in the visitor's maps app). The map is either a
 * custom embed URL (ADM) or built from the address. Self-hides when nothing is
 * configured. Two columns on desktop, stacked on mobile.
 */
export default function Localizacao({ location }: { location?: LocationSection }) {
  const address = location?.address?.trim();
  const venue = location?.venueName?.trim();
  const note = location?.note?.trim();
  // Only embed an explicit, official Google Maps embed URL (reliable). An address
  // alone gives the card + "Como chegar" button, never an empty map.
  const embed = location?.mapEmbedUrl?.trim() || "";

  if (!embed && !address && !venue) return null;

  const directions = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : "";
  const hasText = !!(venue || address);

  return (
    <section id="localizacao" className="bg-ink-deep px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow as="h2">{location?.title?.trim() || "Localização"}</SectionEyebrow>
      {note && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/70 md:text-[16px]">
          {note}
        </p>
      )}

      <div
        className={`mt-8 grid grid-cols-1 gap-8 ${hasText ? "md:grid-cols-2 md:items-center" : ""}`}
      >
        {embed && (
          <div className="overflow-hidden rounded-2xl border border-line-soft">
            <iframe
              src={embed}
              title="Mapa da localização"
              loading="lazy"
              className="h-[300px] w-full md:h-[380px]"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
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
