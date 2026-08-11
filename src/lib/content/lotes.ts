import type { Lote } from "./types";
import { fmtDate, fmtShort, parseBR } from "./datetime";

export type LoteStatus = "upcoming" | "open" | "closed";

/** Época (ms) da string do ADM, em fuso de Brasília (−03:00). */
const ms = (s: string | undefined): number | null => parseBR(s);

/** Number embedded in a lote name ("Lote 2" → 2); missing → Infinity (goes last). */
function loteNum(l: Lote): number {
  const m = (l.name || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
}

/** Chave cronológica de um lote: a **abertura**; sem ela, o **encerramento**. */
function loteTime(l: Lote): number | null {
  return ms(l.openDate) ?? ms(l.date);
}

/**
 * Ordena os lotes por **DATA** — o primeiro a **abrir** vem primeiro (sem
 * abertura, usa o encerramento). Lotes sem nenhuma data vão ao fim, na ordem do
 * número do nome. Determinístico e independente da ordem do array — é a ordem
 * que aparece na tela inicial.
 */
export function sortLotes(lotes: Lote[]): Lote[] {
  return [...(lotes ?? [])].sort((a, b) => {
    const ta = loteTime(a);
    const tb = loteTime(b);
    if (ta !== null && tb !== null) return ta !== tb ? ta - tb : loteNum(a) - loteNum(b);
    if (ta !== null) return -1; // com data vem antes de sem data
    if (tb !== null) return 1;
    return loteNum(a) - loteNum(b); // ambos sem data → nº do nome
  });
}

/** Same order as `sortLotes` but reversed (mais recente primeiro). */
export function sortLotesDesc(lotes: Lote[]): Lote[] {
  return sortLotes(lotes).reverse();
}

/**
 * Status de um lote no instante `now` (ms) — **100% pelas datas** (abre e fecha
 * automaticamente): `upcoming` antes da abertura, `closed` a partir do
 * encerramento, `open` no período entre elas (ou quando só há uma das datas e
 * ainda está no ar). Sem NENHUMA data, cai na flag manual legada `open`.
 */
export function loteStatus(l: Lote, now: number): LoteStatus {
  const openT = ms(l.openDate);
  const closeT = ms(l.date);
  if (openT !== null && now < openT) return "upcoming"; // antes de abrir
  if (closeT !== null && now >= closeT) return "closed"; // já encerrou
  if (openT !== null || closeT !== null) return "open"; // tem data e está no período
  return l.open ? "open" : "upcoming"; // legado: sem datas → flag manual
}

/** The lote to feature: the open one, else the next upcoming, else the last. */
export function activeLote(lotes: Lote[], now: number): Lote | null {
  const sorted = sortLotes(lotes);
  return (
    sorted.find((l) => loteStatus(l, now) === "open") ??
    sorted.find((l) => loteStatus(l, now) === "upcoming") ??
    sorted[sorted.length - 1] ??
    null
  );
}

/** Header CTA text + link, adapting to the active/last-available lote's status. */
export function loteCtaLabel(
  lotes: Lote[],
  now: number,
): { label: string; url: string } {
  const active = activeLote(lotes ?? [], now);
  if (!active) return { label: "Inscreva-se", url: "#inscricao" };
  const st = loteStatus(active, now);
  if (st === "upcoming" && active.openDate) {
    return { label: `Abertura em ${fmtShort(active.openDate)}`, url: "#inscricao" };
  }
  if (st === "open") {
    return {
      label: active.date ? `Inscreva-se até ${fmtShort(active.date)}` : "Inscreva-se",
      url: active.url || "#inscricao",
    };
  }
  return { label: "Inscrições encerradas", url: "#inscricao" };
}

/** Countdown target + label for a lote given its status (null → no countdown). */
export function loteCountdown(
  l: Lote,
  status: LoteStatus,
): { date: string; label: string } | null {
  if (status === "upcoming" && l.openDate)
    return { date: l.openDate, label: "Inscrições abrem em" };
  if (status === "open" && l.date)
    return { date: l.date, label: "Inscrições encerram em" };
  return null;
}

/**
 * Validate lote dates + race day (ADM). Returns human messages (empty = ok):
 * opening ≤ closing; lote periods must not overlap; race day after the last close.
 */
export function validateLotes(lotes: Lote[], raceDate?: string): string[] {
  const errors: string[] = [];

  lotes.forEach((l) => {
    const o = ms(l.openDate);
    const c = ms(l.date);
    if (o !== null && c !== null && o > c) {
      errors.push(`${l.name || "Lote"}: a abertura não pode ser depois do encerramento.`);
    }
  });

  const periods = lotes
    .map((l) => ({ name: l.name || "Lote", o: ms(l.openDate), c: ms(l.date) }))
    .filter((p): p is { name: string; o: number; c: number } => p.o !== null && p.c !== null)
    .sort((a, b) => a.o - b.o);
  for (let i = 1; i < periods.length; i++) {
    if (periods[i].o < periods[i - 1].c) {
      errors.push(
        `${periods[i].name} abre antes de ${periods[i - 1].name} encerrar — os lotes não podem se sobrepor.`,
      );
    }
  }

  const rd = ms(raceDate);
  if (rd !== null) {
    const withClose = lotes
      .map((l) => ({ name: l.name || "Lote", raw: l.date, c: ms(l.date) }))
      .filter((x): x is { name: string; raw: string; c: number } => x.c !== null);
    if (withClose.length) {
      const last = withClose.reduce((a, b) => (b.c > a.c ? b : a));
      if (rd <= last.c) {
        errors.push(
          `O dia da corrida deve ser depois do encerramento do lote que fecha por último — «${last.name}» (${fmtDate(last.raw)}).`,
        );
      }
    }
  }

  return errors;
}
