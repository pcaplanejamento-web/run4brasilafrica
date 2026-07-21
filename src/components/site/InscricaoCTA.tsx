"use client";

import { useEffect, useState } from "react";
import type { Inscricao, Lote } from "@/lib/content/types";
import Countdown from "./Countdown";
import NotifyForm from "./NotifyForm";
import SectionEyebrow from "./SectionEyebrow";
import {
  activeLote,
  loteCountdown,
  loteStatus,
  sortLotes,
  sortLotesDesc,
  type LoteStatus,
} from "@/lib/content/lotes";

/** Format an ISO/date-local string to DD/MM/YYYY (SSR-safe, no Date). */
function fmtDate(iso: string | undefined): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 && p[0] ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

const STATUS_LABEL: Record<LoteStatus, string> = {
  upcoming: "Em breve",
  open: "Aberto",
  closed: "Encerrado",
};

function DateRange({ l }: { l: Lote }) {
  const open = fmtDate(l.openDate);
  const close = fmtDate(l.date);
  if (!open && !close) return null;
  return (
    <div className="mt-1 text-[12px] opacity-70">
      {open && <>Abertura {open}</>}
      {open && close && " · "}
      {close && <>Encerramento {close}</>}
    </div>
  );
}

/**
 * Registration section driven by "lotes" (batches). The active lote (open, else
 * the next upcoming) is a prominent band with a countdown that targets the
 * OPENING while it's upcoming and the CLOSING once it's open. All lotes are
 * listed with their status and dates. Falls back to a single CTA when there are
 * no lotes. Client-side because the status/countdown depend on the current time.
 */
export default function InscricaoCTA({
  inscricao,
  lotes,
}: {
  inscricao: Inscricao;
  lotes: Lote[];
}) {
  const [now, setNow] = useState(0);
  const ready = now > 0; // 0 on SSR/first render → no hydration mismatch

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = sortLotes(lotes ?? []);

  if (sorted.length === 0) {
    return (
      <section id="inscricao" className="px-5 py-14 sm:px-8 md:px-14 md:py-20">
        <SectionEyebrow as="h2" className="mb-8">
          Inscrições e Lotes
        </SectionEyebrow>
        <div className="flex flex-col items-start gap-6 bg-gold p-6 text-gold-ink md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <div className="font-display text-[30px] font-bold uppercase md:text-[36px]">
              {inscricao.title}
            </div>
            <p className="mt-1.5 text-[16px]">{inscricao.subtitle}</p>
          </div>
          <a
            href={inscricao.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full whitespace-nowrap bg-gold-ink px-9 py-4 text-center text-[16px] font-bold uppercase text-cream transition-transform hover:-translate-y-0.5 md:w-auto"
          >
            {inscricao.ctaLabel}
          </a>
        </div>
      </section>
    );
  }

  const active = (ready ? activeLote(sorted, now) : sorted[0]) ?? sorted[0];
  // Other lotes below the highlight: descending (Lote N…1), never repeating the
  // highlighted one.
  const others = sortLotesDesc(sorted).filter((l) => l.id !== active.id);
  const activeStatus: LoteStatus = ready ? loteStatus(active, now) : "upcoming";
  const cd = loteCountdown(active, activeStatus);
  // Just the lote name — the status pill above already signals open/upcoming/
  // closed, so no status word is appended next to the title (avoids redundancy).
  const headline = active.name;

  return (
    <section id="inscricao" className="px-5 py-14 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow as="h2" className="mb-8">
        Inscrições e Lotes
      </SectionEyebrow>
      <div
        className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10"
        style={{ background: active.colorBg, color: active.colorText }}
      >
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-black/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]">
            {STATUS_LABEL[activeStatus]}
          </span>
          <div className="mt-2 font-display text-[26px] font-bold uppercase md:text-[36px]">
            {headline}
          </div>
          <p className="mt-1.5 text-[16px]">{active.text}</p>
          <DateRange l={active} />
          {cd && (
            <div className="mt-4">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">
                {cd.label}
              </div>
              <Countdown date={cd.date} />
            </div>
          )}
          {activeStatus === "upcoming" && <NotifyForm />}
        </div>
        {activeStatus === "open" ? (
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full whitespace-nowrap bg-black/85 px-9 py-4 text-center text-[16px] font-bold uppercase text-white transition-transform hover:-translate-y-0.5 md:w-auto"
          >
            {active.ctaLabel}
          </a>
        ) : (
          <span className="w-full cursor-not-allowed whitespace-nowrap bg-black/25 px-9 py-4 text-center text-[16px] font-bold uppercase md:w-auto">
            {activeStatus === "upcoming" ? "Aguarde a abertura" : "Encerrado"}
          </span>
        )}
      </div>

      {others.length > 0 && (
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((l) => {
          const st: LoteStatus = ready
            ? loteStatus(l, now)
            : l.open
              ? "open"
              : "upcoming";
          const isOpen = st === "open";
          return (
            <div
              key={l.id}
              className="border p-5"
              style={{
                borderColor: isOpen ? l.colorBg : "oklch(0.32 0.02 40)",
                opacity: st === "closed" ? 0.55 : 1,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[18px] font-bold uppercase">
                  {l.name}
                </span>
                <span
                  className="text-[11px] uppercase tracking-[0.06em]"
                  style={{ color: isOpen ? "var(--color-gold)" : "var(--color-muted)" }}
                >
                  {STATUS_LABEL[st]}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-strong">{l.text}</p>
              <DateRange l={l} />
              {isOpen ? (
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-cta mt-3 inline-block bg-gold px-4 py-2 text-[13px] font-bold uppercase text-gold-ink"
                >
                  {l.ctaLabel}
                </a>
              ) : (
                <span className="mt-3 inline-block cursor-not-allowed bg-[oklch(0.3_0.01_40)] px-4 py-2 text-[13px] font-bold uppercase text-muted">
                  {st === "upcoming" ? "Em breve" : "Encerrado"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
