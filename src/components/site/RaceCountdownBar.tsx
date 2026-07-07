"use client";

import { useEffect, useState } from "react";
import type { Inscricao } from "@/lib/content/types";

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
}

function compute(target: string): Parts | null {
  const t = new Date(target).getTime() - Date.now();
  if (Number.isNaN(t) || t <= 0) return null;
  const s = Math.floor(t / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function fmtDate(iso: string): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 && p[0] ? `${p[2]}/${p[1]}/${p[0]}` : "";
}
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Slim bar right below the header with the race date + time and a live
 * countdown to the start. Hidden until the race date is set (ADM > Links).
 */
export default function RaceCountdownBar({ inscricao }: { inscricao: Inscricao }) {
  const date = inscricao.raceDate;
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    if (!date) return;
    const tick = () => setParts(compute(date));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) return null;
  const time = date.slice(11, 16);

  return (
    <div className="overflow-x-auto border-b border-line bg-ink-panel px-3 py-2 sm:px-8 md:px-14 md:py-2.5">
      <div className="flex items-center justify-center gap-2.5 whitespace-nowrap text-[10.5px] sm:gap-4 sm:text-[13px]">
        <span className="font-bold uppercase tracking-[0.08em] text-gold">
          Dia da corrida
        </span>
        <span className="font-semibold text-cream">
          {fmtDate(date)}
          {time && ` · ${time}`}
        </span>
        {parts && (
          <span className="tabular-nums text-muted-strong">
            faltam {parts.d}d {pad(parts.h)}h {pad(parts.m)}m {pad(parts.s)}s
          </span>
        )}
      </div>
    </div>
  );
}
