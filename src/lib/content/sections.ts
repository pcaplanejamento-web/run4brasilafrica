import type { LayoutItem } from "./types";

/**
 * Registry of the homepage sections that the ADM can reorder / enable-disable
 * from the dashboard. `key` is stored in `content.layout`; `href` is the ADM
 * page that configures that section. Order here is the default order.
 */
export interface SectionMeta {
  key: string;
  label: string;
  href: string;
}

export const SECTIONS: SectionMeta[] = [
  { key: "hero", label: "Banner / Hero", href: "/admin/banner" },
  { key: "stats", label: "Números em destaque", href: "/admin/numeros" },
  { key: "about", label: "A Causa", href: "/admin/banner" },
  { key: "playlist", label: "Playlist do evento", href: "/admin/playlist" },
  { key: "percurso", label: "O Percurso", href: "/admin/strava" },
  { key: "raceday", label: "Dia da Corrida", href: "/admin/links" },
  { key: "inscricao", label: "Inscrição / Lotes", href: "/admin/links" },
  { key: "galeria", label: "Galeria", href: "/admin/galeria" },
  { key: "premiacao", label: "Premiação", href: "/admin/premiacao" },
  { key: "parceiros", label: "Parceiros", href: "/admin/patrocinadores" },
  { key: "sejaParceiro", label: "Seja um Parceiro", href: "/admin/seja-parceiro" },
  { key: "depoimentos", label: "Quem já correu", href: "/admin/depoimentos" },
  { key: "faq", label: "Perguntas frequentes", href: "/admin/faq" },
  { key: "kit", label: "Kit do atleta", href: "/admin/kit" },
];

export const DEFAULT_LAYOUT: LayoutItem[] = SECTIONS.map((s) => ({
  key: s.key,
  enabled: true,
}));

export function sectionMeta(key: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.key === key);
}

/**
 * Merge a stored layout with the registry: keep the stored order (known keys
 * only), then append any sections not present yet (enabled). Guarantees every
 * section appears even after new ones are added to the code.
 */
export function resolveLayout(stored: LayoutItem[] | undefined): LayoutItem[] {
  const known = new Set(SECTIONS.map((s) => s.key));
  const kept = (stored ?? []).filter((li) => known.has(li.key));
  const seen = new Set(kept.map((li) => li.key));
  const missing = SECTIONS.filter((s) => !seen.has(s.key)).map((s) => ({
    key: s.key,
    enabled: true,
  }));
  return [...kept, ...missing];
}
