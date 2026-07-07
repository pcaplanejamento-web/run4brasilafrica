"use client";

import { useEffect, useState } from "react";
import type { Inscricao } from "@/lib/content/types";
import Countdown from "./Countdown";
import Reveal from "./Reveal";

/** Format an ISO/date-local string to DD/MM/YYYY (SSR-safe, no Date). */
function fmtDate(iso: string): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 && p[0] ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

/**
 * "Dia da Corrida" band — the race date + a live countdown to the start line.
 * Shown right before the registration (lotes) section; hidden until the race
 * date is set in ADM > Links & inscrição.
 */
export default function RaceDay({ inscricao }: { inscricao: Inscricao }) {
  const date = inscricao.raceDate;
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPast(new Date(date).getTime() < Date.now());
  }, [date]);

  if (!date) return null;

  return (
    <section id="dia-da-corrida" className="px-5 pt-14 sm:px-8 md:px-14 md:pt-20">
      <Reveal>
        <div className="flex flex-col gap-6 rounded-lg bg-gold p-6 text-gold-ink md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] opacity-80">
              Dia da Corrida
            </div>
            <div className="mt-1 font-display text-[34px] font-bold uppercase leading-none md:text-[48px]">
              {fmtDate(date)}
            </div>
          </div>
          <div>
            {past ? (
              <div className="font-display text-[22px] font-bold uppercase md:text-[26px]">
                Evento realizado
              </div>
            ) : (
              <>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">
                  Contagem para a largada
                </div>
                <Countdown date={date} />
              </>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
