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
  { key: "location", label: "Localização", href: "/admin/localizacao" },
  { key: "raceday", label: "Dia da Corrida", href: "/admin/links" },
  { key: "inscricao", label: "Inscrição / Lotes", href: "/admin/links" },
  { key: "galeria", label: "Galeria", href: "/admin/galeria" },
  { key: "premiacao", label: "Premiação", href: "/admin/premiacao" },
  { key: "parceiros", label: "Parceiros", href: "/admin/patrocinadores" },
  { key: "sejaParceiro", label: "Seja um Parceiro", href: "/admin/seja-parceiro" },
  { key: "depoimentos", label: "Quem já correu", href: "/admin/depoimentos" },
  { key: "faq", label: "Perguntas frequentes", href: "/admin/faq" },
  { key: "kit", label: "Kit do atleta", href: "/admin/kit" },
  { key: "compartilhar", label: "Compartilhar", href: "/admin/compartilhar" },
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
 * only) and preserve any manual reordering, then insert sections not present
 * yet **at their natural registry position** (right after the nearest preceding
 * registry-sibling that exists), so a newly-added section shows up where it
 * belongs instead of dumped at the bottom. Guarantees every section appears.
 */
export function resolveLayout(stored: LayoutItem[] | undefined): LayoutItem[] {
  const known = new Set(SECTIONS.map((s) => s.key));
  const result = (stored ?? []).filter((li) => known.has(li.key));
  const present = new Set(result.map((li) => li.key));

  SECTIONS.forEach((s, idx) => {
    if (present.has(s.key)) return;
    // Insert just after the previous registry section already in the layout.
    let insertAt = result.length;
    for (let i = idx - 1; i >= 0; i--) {
      const pos = result.findIndex((li) => li.key === SECTIONS[i].key);
      if (pos >= 0) {
        insertAt = pos + 1;
        break;
      }
    }
    result.splice(insertAt, 0, { key: s.key, enabled: true });
    present.add(s.key);
  });

  return result;
}
