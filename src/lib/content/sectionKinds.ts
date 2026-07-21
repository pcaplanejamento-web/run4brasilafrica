import type { CustomBlock, CustomBlockType, SectionKind } from "./types";

/** PT label per section kind (used in the aba block picker). */
export const SECTION_KIND_LABEL: Record<SectionKind, string> = {
  stats: "Números em destaque",
  playlist: "Playlist do evento",
  percurso: "O Percurso",
  location: "Localização",
  raceday: "Dia da Corrida",
  inscricao: "Inscrições e Lotes",
  galeria: "Galeria",
  premiacao: "Premiação",
  parceiros: "Parceiros",
  sejaParceiro: "Seja um Parceiro",
  depoimentos: "Quem já correu (depoimentos)",
  faq: "Perguntas frequentes",
  kit: "Kit do atleta",
  compartilhar: "Compartilhar",
};

/** Every section kind, as a Set for O(1) `isSectionKind` checks. */
const SECTION_KIND_SET = new Set<string>(Object.keys(SECTION_KIND_LABEL));

/** True when a block type is one of the site sections (not a free-content block). */
export function isSectionKind(type: CustomBlockType): type is SectionKind {
  return SECTION_KIND_SET.has(type);
}

/**
 * Empty-but-valid section data for a freshly-created section block of `kind`.
 * Flat (merged onto the `CustomBlock`), since sections are first-class block
 * types now. Markers (raceday/inscricao/galeria) carry no data.
 */
export function sectionDefaults(kind: SectionKind): Partial<CustomBlock> {
  switch (kind) {
    case "stats":
      return { stats: [] };
    case "faq":
      return { faq: [] };
    case "depoimentos":
      return { testimonials: [] };
    case "playlist":
      return { playlist: { enabled: true, visible: "both" } };
    case "percurso":
      return {
        percurso: {
          eyebrow: "O PERCURSO",
          title: "",
          routes: [],
          distance: "",
          elevation: "",
          startFinish: "",
          stravaRouteRef: "",
          connected: false,
        },
      };
    case "location":
      return { location: {} };
    case "premiacao":
      return { premiacao: { title: "Premiação", places: [] } };
    case "sejaParceiro":
      return { sejaParceiro: {} };
    case "compartilhar":
      return { share: {} };
    case "kit":
      return { kit: { title: "Kit do atleta", subtitle: "", regulamentoLabel: "Regulamento" } };
    case "parceiros":
      return { sponsors: [] };
    case "galeria":
      return { gallery: {}, albums: [] };
    case "inscricao":
      return {
        inscricao: {
          title: "",
          subtitle: "",
          ctaLabel: "Inscreva-se",
          platform: "",
          url: "",
          raceDate: "",
        },
        lotes: [],
      };
    case "raceday":
      return { raceDate: "" };
  }
}
