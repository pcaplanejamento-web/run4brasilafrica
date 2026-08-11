"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClassificacaoDisplay, RaceResultRow } from "@/lib/content/types";
import { foldText, matchesQuery, primaryTime } from "@/lib/results/format";

/**
 * Modal da **classificação geral**: lista completa da categoria com **busca por
 * nome ou número**. Mesma casca dos modais do site (dark, Esc, trava scroll,
 * `role=dialog`). Clicar num corredor chama `onPick` (abre o detalhe).
 */
export default function ClassificacaoModal({
  open,
  onClose,
  rows,
  categoryLabel,
  display,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  rows: RaceResultRow[];
  categoryLabel: string;
  display?: ClassificacaoDisplay;
  onPick: (row: RaceResultRow) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const folded = foldText(query.trim());
  const filtered = useMemo(
    () => rows.filter((r) => matchesQuery(r, folded)),
    [rows, folded],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Classificação geral — ${categoryLabel}`}
    >
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-line-soft bg-ink-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        {/* Cabeçalho + busca (sticky). */}
        <div className="border-b border-line-soft px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-[18px] font-bold uppercase text-cream md:text-[22px]">
              Classificação geral
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {categoryLabel && <div className="mt-0.5 text-[12px] uppercase tracking-[0.06em] text-gold">{categoryLabel}</div>}
          <div className="relative mt-3">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou número…"
              aria-label="Buscar por nome ou número"
              className="min-h-11 w-full rounded-lg border border-line-soft bg-ink px-10 py-2.5 text-[14px] text-cream outline-none transition-colors placeholder:text-muted focus:border-gold"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-cream"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-2 text-[12px] text-muted">
            {filtered.length} de {rows.length} corredores
          </div>
        </div>

        {/* Lista rolável. */}
        <div className="overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-[14px] text-muted">
              Nenhum corredor encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((row) => {
              const time = primaryTime(row, display);
              return (
                <button
                  type="button"
                  key={row.pos}
                  onClick={() => onPick(row)}
                  className="flex w-full items-center gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/5"
                >
                  <span className="grid h-8 w-9 shrink-0 place-items-center rounded-full bg-ink font-display text-[13px] font-bold text-gold">
                    {row.pos}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold uppercase tracking-[0.02em] text-cream">
                      {row.name}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {row.bib ? `#${row.bib}` : ""}
                      {row.team ? `${row.bib ? " · " : ""}${row.team}` : ""}
                    </span>
                  </span>
                  {time && (
                    <span className="shrink-0 font-display text-[15px] font-bold text-cream">{time}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
