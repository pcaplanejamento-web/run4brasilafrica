import type { CustomBlock, CustomBlockType, SectionKind } from "./types";
import { isSectionKind, SECTION_KIND_LABEL, sectionDefaults } from "./sectionKinds";

/**
 * "Criar aba" component picker — single source of truth shared by the Dashboard
 * (create-aba chips) and the aba editor ("Adicionar componente").
 *
 * Everything is a component: each block is picked by its `CustomBlockType`,
 * whether a free-content block (`"texto"`, `"imagem"`, …) or a site section
 * (`"faq"`, `"parceiros"`, …). There is no "seção pronta" wrapper — section
 * blocks carry their own data inline on the `CustomBlock`.
 */
export type BlockChoiceValue = CustomBlockType;

export interface BlockChoice {
  value: BlockChoiceValue;
  label: string;
  /** UI grouping: free-form content blocks vs. ready-made site sections. */
  group: "conteudo" | "secao";
}

/** Free-content blocks. */
const GENERIC: { value: CustomBlockType; label: string }[] = [
  { value: "subtitulo", label: "Subtítulo" },
  { value: "texto", label: "Texto" },
  { value: "imagem", label: "Imagem" },
  { value: "video", label: "Vídeo (YouTube)" },
  { value: "botao", label: "Botão" },
  { value: "carrossel", label: "Carrossel de imagens" },
  { value: "formulario", label: "Formulário (captura de e-mail)" },
];

/**
 * Section components, in the order they appear in the picker (mirrors the
 * natural top-to-bottom order of the homepage sections).
 */
export const SECTION_KIND_ORDER: SectionKind[] = [
  "hero",
  "faq",
  "depoimentos",
  "stats",
  "playlist",
  "percurso",
  "location",
  "premiacao",
  "compartilhar",
  "sejaParceiro",
  "parceiros",
  "kit",
  "galeria",
  "raceday",
  "inscricao",
];

export const CONTEUDO_CHOICES: BlockChoice[] = GENERIC.map((g) => ({
  ...g,
  group: "conteudo" as const,
}));

export const SECAO_CHOICES: BlockChoice[] = SECTION_KIND_ORDER.map((k) => ({
  value: k,
  label: SECTION_KIND_LABEL[k],
  group: "secao" as const,
}));

export const BLOCK_CHOICES: BlockChoice[] = [...CONTEUDO_CHOICES, ...SECAO_CHOICES];

/** Build a fresh `CustomBlock` from a picker choice. */
export function blockFromChoice(value: BlockChoiceValue, id: string): CustomBlock {
  if (isSectionKind(value)) {
    return { id, type: value, ...sectionDefaults(value) };
  }
  return { id, type: value };
}

/** Human label for an existing block (headers, picked lists). */
export function blockLabel(block: Pick<CustomBlock, "type">): string {
  if (isSectionKind(block.type)) return SECTION_KIND_LABEL[block.type];
  const c = CONTEUDO_CHOICES.find((c) => c.value === block.type);
  return c?.label ?? block.type;
}

/** Label for a picker value (used while building a new aba). */
export function choiceLabel(value: BlockChoiceValue): string {
  return BLOCK_CHOICES.find((c) => c.value === value)?.label ?? value;
}
