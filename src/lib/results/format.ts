import type { ClassificacaoDisplay, RaceResultRow } from "@/lib/content/types";

/** Tempo principal a exibir conforme a config (líquido preferido). */
export function primaryTime(row: RaceResultRow, d?: ClassificacaoDisplay): string | undefined {
  if (d?.netTime !== false && row.timeNet) return row.timeNet;
  if (d?.grossTime && row.timeGross) return row.timeGross;
  if (row.timeNet) return row.timeNet; // fallback quando nada marcado
  return row.timeGross;
}

/** minúsculas, sem acento — para busca tolerante a acentos. Tolera `undefined`. */
export function foldText(s?: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Casa um corredor por nome (sem acento) OU número de peito. */
export function matchesQuery(row: RaceResultRow, foldedQuery: string): boolean {
  if (!foldedQuery) return true;
  return foldText(row.name).includes(foldedQuery) || (row.bib ?? "").includes(foldedQuery);
}
