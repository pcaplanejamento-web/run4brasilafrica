import type { SiteContent } from "@/lib/content/types";

const SITE = "https://run4brasilafrica.com.br";

/**
 * schema.org/SportsEvent structured data so Google shows the race as an event
 * (date, place, registration). Rendered in the page HTML from the content.
 */
export default function EventJsonLd({ c }: { c: SiteContent }) {
  const name = `${c.event?.brandName ?? "Run4BrasilAfrica"} ${c.event?.editionYear ?? ""}`.trim();
  const startDate = c.inscricao?.raceDate || undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    description:
      c.event?.tagline ||
      "Corrida de rua que conecta esporte e causa social entre o Brasil e a África.",
    ...(startDate ? { startDate } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: c.event?.city || "Rio de Janeiro",
      address: {
        "@type": "PostalAddress",
        addressLocality: c.event?.city || "Rio de Janeiro",
        addressCountry: "BR",
      },
    },
    image: [c.branding?.ogImage || `${SITE}/og.png`],
    url: `${SITE}/`,
    organizer: {
      "@type": "Organization",
      name: c.event?.brandName ?? "Run4BrasilAfrica",
      url: `${SITE}/`,
    },
    ...(c.inscricao?.url
      ? {
          offers: {
            "@type": "Offer",
            url: c.inscricao.url,
            availability: "https://schema.org/InStock",
            ...(startDate ? { validFrom: startDate } : {}),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Escape "<" so a value containing "</script>" can't break out of the tag.
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
