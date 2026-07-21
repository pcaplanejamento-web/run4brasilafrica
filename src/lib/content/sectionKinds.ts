import type { SectionBlock, SectionKind } from "./types";

/** PT label per section kind (used in the aba block picker). */
export const SECTION_KIND_LABEL: Record<SectionKind, string> = {
  stats: "Números em destaque",
  playlist: "Playlist do evento",
  percurso: "O Percurso",
  location: "Localização",
  raceday: "Dia da Corrida",
  inscricao: "Inscrição / Lotes",
  galeria: "Galeria",
  premiacao: "Premiação",
  parceiros: "Parceiros",
  sejaParceiro: "Seja um Parceiro",
  depoimentos: "Quem já correu (depoimentos)",
  faq: "Perguntas frequentes",
  kit: "Kit do atleta",
  compartilhar: "Compartilhar",
};

/** Empty-but-valid `SectionBlock` for a freshly-created section of `kind`. */
export function sectionDefaults(kind: SectionKind): SectionBlock {
  switch (kind) {
    case "stats":
      return { kind: "stats", stats: [] };
    case "faq":
      return { kind: "faq", faq: [] };
    case "depoimentos":
      return { kind: "depoimentos", testimonials: [] };
    case "playlist":
      return { kind: "playlist", playlist: { enabled: true, visible: "both" } };
    case "percurso":
      return {
        kind: "percurso",
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
      return { kind: "location", location: {} };
    case "premiacao":
      return { kind: "premiacao", premiacao: { title: "Premiação", places: [] } };
    case "sejaParceiro":
      return { kind: "sejaParceiro", sejaParceiro: {} };
    case "compartilhar":
      return { kind: "compartilhar", share: {} };
    case "kit":
      return {
        kind: "kit",
        kit: { title: "Kit do atleta", subtitle: "", regulamentoLabel: "Regulamento" },
      };
    case "parceiros":
      return { kind: "parceiros", sponsors: [] };
    case "raceday":
      return { kind: "raceday" };
    case "inscricao":
      return { kind: "inscricao" };
    case "galeria":
      return { kind: "galeria" };
  }
}
