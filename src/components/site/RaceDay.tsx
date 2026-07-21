"use client";

import { useEffect, useState } from "react";
import type { Inscricao } from "@/lib/content/types";
import Countdown from "./Countdown";
import Reveal from "./Reveal";
import SectionEyebrow from "./SectionEyebrow";
import { fmtDate, parseBR } from "@/lib/content/datetime";

/**
 * "Dia da Corrida" band — the race date + a live countdown to the start line.
 * Shown right before the registration (lotes) section; hidden until the race
 * date is set in ADM > Links & inscrição.
 */
export default function RaceDay({
  inscricao,
  title,
}: {
  inscricao: Inscricao;
  title?: string;
}) {
  const date = inscricao.raceDate;
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPast((parseBR(date) ?? 0) < Date.now());
  }, [date]);

  if (!date) return null;

  return (
    <section id="dia-da-corrida" className="px-5 pt-14 sm:px-8 md:px-14 md:pt-20">
      {title?.trim() && (
        <SectionEyebrow as="h2" className="mb-6">
          {title}
        </SectionEyebrow>
      )}
      <Reveal>
        <div className="flex flex-col gap-6 rounded-lg bg-gold p-6 text-gold-ink md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <div className="font-display text-[34px] font-bold uppercase leading-none md:text-[48px]">
              {fmtDate(date)}
            </div>
            {!past && (
              <a
                href="/api/agenda"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-gold-ink/25 px-4 text-[13px] font-bold uppercase transition-colors hover:bg-gold-ink hover:text-gold"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Adicionar à agenda
              </a>
            )}
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
