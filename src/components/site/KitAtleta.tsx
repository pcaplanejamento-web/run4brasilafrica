"use client";

import { useState } from "react";
import type { KitItem, KitSection, Lote } from "@/lib/content/types";
import Reveal from "./Reveal";
import { KitIcon } from "./KitIcons";

function ItemCard({ item }: { item: KitItem }) {
  return (
    <div className="flex h-full flex-col items-center gap-3 rounded-lg border border-line bg-ink-card p-5 text-center">
      <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full bg-ink-panel">
        {item.icon ? (
          <span className="text-gold">
            <KitIcon name={item.icon} size={34} />
          </span>
        ) : item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <span className="text-gold">
            <KitIcon size={30} />
          </span>
        )}
      </div>
      <span className="text-[14px] font-semibold leading-tight">{item.name}</span>
    </div>
  );
}

/**
 * Athlete kit section: the regulation (a link to a file OR inline text) plus the
 * kit contents shown as a card grid. The kit can be a single list or vary per
 * lote (tabs). Responsive + touch-friendly.
 */
export default function KitAtleta({ kit, lotes }: { kit: KitSection; lotes: Lote[] }) {
  const [showReg, setShowReg] = useState(false);
  const [tab, setTab] = useState(0);

  const perLote = kit.kitMode === "perLote";
  const groups = perLote
    ? (kit.perLote ?? []).map((pl) => ({
        id: pl.loteId,
        name: lotes.find((l) => l.id === pl.loteId)?.name ?? "Lote",
        items: pl.items ?? [],
      }))
    : [];
  const items = perLote ? groups[Math.min(tab, groups.length - 1)]?.items ?? [] : kit.items ?? [];

  const regLink = kit.regulamentoMode !== "text";
  const hasReg = regLink ? !!kit.regulamentoUrl : !!kit.regulamentoText;

  return (
    <section
      id="kit"
      className="border-b border-line px-5 py-16 sm:px-8 md:px-14 md:py-20"
    >
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-2 font-display text-[24px] font-bold uppercase md:text-[30px]">
            {kit.title}
          </h2>
          <p className="text-[15px] opacity-75">{kit.subtitle}</p>
        </div>
        {hasReg &&
          (regLink ? (
            <a
              href={kit.regulamentoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap border-2 border-gold px-6 py-3 text-center text-[14px] font-bold uppercase text-gold transition-colors hover:bg-gold hover:text-gold-ink"
            >
              {kit.regulamentoLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setShowReg((s) => !s)}
              aria-expanded={showReg}
              className="whitespace-nowrap border-2 border-gold px-6 py-3 text-center text-[14px] font-bold uppercase text-gold transition-colors hover:bg-gold hover:text-gold-ink"
            >
              {kit.regulamentoLabel}
            </button>
          ))}
      </div>

      {!regLink && showReg && kit.regulamentoText && (
        <div className="r4ba-fade mb-8 max-w-[860px] whitespace-pre-line rounded-lg border border-line bg-ink-deep p-5 text-[14px] leading-[1.7] text-muted-strong">
          {kit.regulamentoText}
        </div>
      )}

      {perLote && groups.length > 1 && (
        <div
          className="mb-6 inline-flex flex-wrap overflow-hidden rounded-full border border-line-soft"
          role="tablist"
          aria-label="Kit por lote"
        >
          {groups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={i === tab}
              onClick={() => setTab(i)}
              className={`min-h-11 px-5 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors ${
                i === tab ? "bg-gold text-gold-ink" : "text-muted-strong hover:text-cream"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
            {kit.kitLabel}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((it, i) => (
              <Reveal key={`${it.name}-${i}`} delay={(i % 6) * 60} className="h-full">
                <ItemCard item={it} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
