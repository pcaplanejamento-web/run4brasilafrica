import type { Edition, SiteContent } from "./types";

/**
 * A edição **ativa** do evento — fonte única para "que edição está no ar". É a
 * de `status: "Ativa"`; sem uma marcada, cai na de maior ano; sem lista, numa
 * sintetizada a partir de `event` (instalações antigas). O ano dela é espelhado
 * em `event.editionYear` a cada leitura (ver `syncActiveEdition` em migrate.ts),
 * então o site público / SEO ficam consistentes.
 */
export function activeEdition(c: SiteContent): Edition {
  const eds = c.editions ?? [];
  const active = eds.find((e) => e.status === "Ativa");
  if (active) return active;
  const newest = [...eds].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))[0];
  if (newest) return newest;
  return {
    year: c.event.editionYear,
    date: c.event.dateLabel,
    participants: "0",
    status: "Ativa",
  };
}

/** Rótulo padronizado da edição ativa (ex.: "Run4BrasilAfrica 2026"). */
export function editionLabel(c: SiteContent): string {
  return `${c.event.brandName} ${activeEdition(c).year}`.trim();
}
