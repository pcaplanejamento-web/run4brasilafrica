"use client";

import { useState } from "react";
import type { ResultsSection } from "@/lib/content/types";

/**
 * Race results: the ADM chooses to link to an external timing system OR show a
 * searchable table entered on the site. Hidden until enabled.
 */
export default function Resultados({ results }: { results?: ResultsSection }) {
  const [q, setQ] = useState("");
  if (!results?.enabled) return null;
  const title = results.title || "Resultados";

  if (results.mode === "table") {
    const rows = results.rows ?? [];
    if (!rows.length) return null;
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((r) => `${r.name} ${r.category ?? ""}`.toLowerCase().includes(needle))
      : rows;

    return (
      <section id="resultados" className="px-5 py-16 sm:px-8 md:px-14 md:py-20">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-[26px] font-bold uppercase md:text-[32px]">
            {title}
          </h2>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou categoria…"
            aria-label="Buscar resultados"
            className="min-h-11 w-full rounded border border-line bg-ink-panel px-3 text-[14px] text-cream outline-none focus:border-gold sm:w-[280px]"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead className="bg-ink-panel text-[12px] uppercase tracking-[0.04em] text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">#</th>
                <th className="px-4 py-3 font-bold">Nome</th>
                <th className="px-4 py-3 font-bold">Categoria</th>
                <th className="px-4 py-3 font-bold">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-t border-line/70">
                  <td className="px-4 py-2.5 font-display font-bold text-gold">{r.pos}</td>
                  <td className="px-4 py-2.5">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-strong">{r.category}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.time}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  // link mode
  if (!results.url) return null;
  return (
    <section
      id="resultados"
      className="flex flex-col items-start gap-5 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between md:px-14 md:py-20"
    >
      <h2 className="font-display text-[26px] font-bold uppercase md:text-[32px]">{title}</h2>
      <a
        href={results.url}
        target="_blank"
        rel="noopener noreferrer"
        className="clip-cta-lg inline-block bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5"
      >
        {results.linkLabel || "Ver resultados"}
      </a>
    </section>
  );
}
