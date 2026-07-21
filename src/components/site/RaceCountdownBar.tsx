"use client";

import { useEffect, useState } from "react";
import type { Inscricao } from "@/lib/content/types";
import { countdown, type CountdownParts, fmtDate, parseBR } from "@/lib/content/datetime";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Slim bar right below the header with the race date + time and a live
 * countdown to the start. Hidden until the race date is set (ADM > Links).
 */
export default function RaceCountdownBar({ inscricao }: { inscricao: Inscricao }) {
  const date = inscricao.raceDate;
  const [parts, setParts] = useState<CountdownParts | null>(null);
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!date) return;
    const tick = () => {
      const p = countdown(date, Date.now());
      setParts(p);
      if (!p) setPast((parseBR(date) ?? 0) < Date.now());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) return null;
  const time = date.slice(11, 16);

  return (
    <div
      // Part of the header block: follows the header color; when unset, uses the
      // original panel tone as a LITERAL fallback (not `--color-ink-panel`) so the
      // "inner components" color (`surfaces`) never leaks into the header strip.
      style={{ background: "var(--color-header-bg, oklch(0.22 0.02 40))" }}
      className="overflow-x-auto border-b border-line px-3 py-2 sm:px-8 md:px-14 md:py-2.5"
    >
      <div className="flex items-center justify-center gap-2.5 whitespace-nowrap text-[10.5px] sm:gap-4 sm:text-[13px]">
        <span className="font-bold uppercase tracking-[0.08em] text-gold">
          Dia da corrida
        </span>
        <span className="font-semibold text-cream">
          {fmtDate(date)}
          {time && ` · ${time}`}
        </span>
        {parts ? (
          <span className="tabular-nums text-muted-strong">
            faltam {parts.d}d {pad(parts.h)}h {pad(parts.m)}m {pad(parts.s)}s
          </span>
        ) : past ? (
          <span className="font-semibold uppercase text-muted-strong">Evento realizado</span>
        ) : null}
      </div>
    </div>
  );
}
