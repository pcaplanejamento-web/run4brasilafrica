import type { Lote } from "./types";

export type LoteStatus = "upcoming" | "open" | "closed";

function ms(s: string | undefined): number | null {
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? null : t;
}

function fmtDate(iso: string | undefined): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 && p[0] ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

/** Order lotes by when they open (falling back to their close date). */
export function sortLotes(lotes: Lote[]): Lote[] {
  return [...(lotes ?? [])].sort((a, b) =>
    (a.openDate || a.date || "").localeCompare(b.openDate || b.date || ""),
  );
}

/** Status of a lote at time `now` (ms). Date-driven; falls back to `open` flag. */
export function loteStatus(l: Lote, now: number): LoteStatus {
  const openT = ms(l.openDate);
  const closeT = ms(l.date);
  if (openT !== null && now < openT) return "upcoming";
  if (closeT !== null && now >= closeT) return "closed";
  if (openT !== null) return "open"; // openT <= now < closeT (or no close set)
  // Legacy (no openDate): rely on the manual flag.
  return l.open ? "open" : "upcoming";
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
