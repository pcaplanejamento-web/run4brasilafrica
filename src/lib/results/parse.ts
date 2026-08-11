import type { RaceResultRow } from "@/lib/content/types";

/**
 * Parser da planilha de resultados (CSV oficial da cronometragem). Módulo PURO
 * (sem browser/servidor) para ser testável. Recebe o TEXTO já decodificado
 * (a leitura do arquivo + fallback de encoding fica em `client.ts`).
 *
 * Robustez: detecta o separador (`;` padrão, ou `,`), casa as colunas pelo
 * CABEÇALHO (ordem-independente, sem acento/caixa) e, se não houver cabeçalho
 * reconhecível, cai para a ordem canônica. Campos vazios e `-` viram ausentes.
 */

/** Ordem canônica das colunas do CSV oficial (fallback sem cabeçalho). */
const CANONICAL: (keyof RaceResultRow)[] = [
  "pos",
  "bib",
  "name",
  "sex",
  "age",
  "ageGroup",
  "ageGroupPos",
  "team",
  "modality",
  "category",
  "timeGross",
  "timeNet",
];

/** Cabeçalho normalizado → campo. */
const HEADER_MAP: Record<string, keyof RaceResultRow> = {
  "colocacao geral": "pos",
  colocacao: "pos",
  numero: "bib",
  nome: "name",
  sexo: "sex",
  idade: "age",
  "codigo faixa etaria": "ageGroup",
  "faixa etaria": "ageGroup",
  "colocacao faixa etaria": "ageGroupPos",
  equipe: "team",
  "descricao modalidade": "modality",
  modalidade: "modality",
  "descricao categoria": "category",
  categoria: "category",
  "tempo bruto": "timeGross",
  "tempo liquido": "timeNet",
};

/** minúsculas, sem acento, espaços colapsados — para casar cabeçalhos. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Escolhe o separador olhando a primeira linha (`;` vence por padrão). */
function detectDelimiter(firstLine: string): string {
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return comma > semi ? "," : ";";
}

function toInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Campo de texto: trim; vazio, `-` ou `.` viram undefined. */
function txt(v: string | undefined): string | undefined {
  const t = (v ?? "").trim();
  if (!t || t === "-" || t === ".") return undefined;
  return t;
}

/**
 * Converte o texto do CSV numa lista de colocados, ordenada pela colocação.
 * Linhas sem colocação válida ou sem nome são descartadas.
 */
export function parseResultsCsv(text: string): RaceResultRow[] {
  if (!text) return [];
  // Remove BOM e normaliza quebras de linha.
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const delim = detectDelimiter(lines[0]);
  const splitRow = (line: string) => line.split(delim).map((c) => c.trim());

  // Cabeçalho? (alguma célula da 1ª linha casa com um nome conhecido)
  const firstCells = splitRow(lines[0]).map(norm);
  const hasHeader = firstCells.some((c) => c in HEADER_MAP);

  // Mapa índice→campo.
  const colField: (keyof RaceResultRow | undefined)[] = hasHeader
    ? firstCells.map((c) => HEADER_MAP[c])
    : CANONICAL.slice();

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const out: RaceResultRow[] = [];

  for (const line of dataLines) {
    const cells = splitRow(line);
    const rec: Partial<Record<keyof RaceResultRow, string>> = {};
    colField.forEach((field, i) => {
      if (field) rec[field] = cells[i];
    });

    const pos = toInt(rec.pos);
    const name = txt(rec.name);
    if (pos === undefined || !name) continue; // linha inválida → ignora

    out.push({
      pos,
      bib: txt(rec.bib) ?? "",
      name,
      sex: txt(rec.sex),
      age: toInt(rec.age),
      ageGroup: txt(rec.ageGroup),
      ageGroupPos: txt(rec.ageGroupPos),
      team: txt(rec.team),
      modality: txt(rec.modality),
      category: txt(rec.category),
      timeGross: txt(rec.timeGross),
      timeNet: txt(rec.timeNet),
    });
  }

  // Defensivo: ordena pela colocação (a planilha já vem ordenada).
  out.sort((a, b) => a.pos - b.pos);
  return out;
}
