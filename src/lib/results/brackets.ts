import type { AgeBracket, RaceResultRow } from "@/lib/content/types";

/**
 * Faixas etárias (filtro por idade dentro de uma categoria de resultados).
 * Módulo PURO (sem browser/servidor) — reutilizado pelo ADM (faixas padrão) e
 * pelo site (filtragem). O casamento é por **idade** (`row.age` em `[min, max]`),
 * robusto a variações do código de faixa da cronometragem.
 */

/** Faixas padrão da prova (o print do ADM). `max` vazio = "ou mais". */
export const STANDARD_BRACKETS: Omit<AgeBracket, "id">[] = [
  { label: "14 a 19 anos", min: 14, max: 19 },
  { label: "20 a 29 anos", min: 20, max: 29 },
  { label: "30 a 39 anos", min: 30, max: 39 },
  { label: "40 a 49 anos", min: 40, max: 49 },
  { label: "50 a 59 anos", min: 50, max: 59 },
  { label: "60 a 69 anos", min: 60, max: 69 },
  { label: "70 anos ou mais", min: 70 },
];

/** Verdadeiro se a idade do corredor cai na faixa (min/max inclusivos). */
export function rowInBracket(row: RaceResultRow, b: AgeBracket): boolean {
  if (typeof row.age !== "number" || !Number.isFinite(row.age)) return false;
  if (typeof b.min === "number" && row.age < b.min) return false;
  if (typeof b.max === "number" && row.age > b.max) return false;
  return true;
}
