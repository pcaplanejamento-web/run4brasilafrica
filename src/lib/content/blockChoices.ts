import type { CustomBlock, CustomBlockType, SectionKind } from "./types";
import { SECTION_KIND_LABEL, sectionDefaults } from "./sectionKinds";

/**
 * "Criar aba" component picker — single source of truth shared by the Dashboard
 * (create-aba chips) and the aba editor ("Adicionar componente").
 *
 * Every homepage section is a first-class component here: instead of one generic
 * "Seção pronta" entry with a nested kind dropdown, each `SectionKind` is picked
 * directly. Underneath they're still `secao` blocks (`block.section.kind`) — the
 * data model, render (`renderSection` + short-circuit) and migration are
 * unchanged, so the public site is byte-for-byte identical and fully moldable.
 *
 * A pick value is either a generic block type (`"texto"`, `"imagem"`, …) or a
 * ready-made section encoded as `"secao:<kind>"`.
 */
export type BlockChoiceValue = Exclude<CustomBlockType, "secao"> | `secao:${SectionKind}`;

export interface BlockChoice {
  value: BlockChoiceValue;
  label: string;
  /** UI grouping: free-form content blocks vs. ready-made site sections. */
  group: "conteudo" | "secao";
}

/** Generic content blocks (everything except the internal `secao` wrapper). */
const GENERIC: { value: Exclude<CustomBlockType, "secao">; label: string }[] = [
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
  value: `secao:${k}` as BlockChoiceValue,
  label: SECTION_KIND_LABEL[k],
  group: "secao" as const,
}));

export const BLOCK_CHOICES: BlockChoice[] = [...CONTEUDO_CHOICES, ...SECAO_CHOICES];

/** True for a ready-made-section pick value (`"secao:<kind>"`). */
export function isSecaoChoice(value: BlockChoiceValue): value is `secao:${SectionKind}` {
  return value.startsWith("secao:");
}

/** Build a fresh `CustomBlock` from a picker choice. */
export function blockFromChoice(value: BlockChoiceValue, id: string): CustomBlock {
  if (isSecaoChoice(value)) {
    const kind = value.slice("secao:".length) as SectionKind;
    return { id, type: "secao", section: sectionDefaults(kind) };
  }
  return { id, type: value as CustomBlockType };
}

/** Human label for an existing block (headers, picked lists). */
export function blockLabel(block: Pick<CustomBlock, "type" | "section">): string {
  if (block.type === "secao") {
    return block.section
      ? SECTION_KIND_LABEL[block.section.kind]
      : "Seção pronta (escolha o tipo)";
  }
  const c = BLOCK_CHOICES.find((c) => c.value === block.type);
  return c?.label ?? block.type;
}

/** Label for a picker value (used while building a new aba). */
export function choiceLabel(value: BlockChoiceValue): string {
  return BLOCK_CHOICES.find((c) => c.value === value)?.label ?? value;
}
