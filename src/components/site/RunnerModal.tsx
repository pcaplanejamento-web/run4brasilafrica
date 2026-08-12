"use client";

import { useEffect, useRef } from "react";
import type {
  ClassificacaoDisplay,
  EventInfo,
  PercursoRoute,
  RaceResultRow,
} from "@/lib/content/types";
import ShareCardStudio from "./ShareCardStudio";

/** Campos mostrados no detalhe (todos os disponíveis, com rótulo pt-BR). */
function detailFields(row: RaceResultRow): { label: string; value: string }[] {
  const f: { label: string; value?: string }[] = [
    { label: "Colocação geral", value: `${row.pos}º` },
    { label: "Número", value: row.bib },
    { label: "Tempo líquido", value: row.timeNet },
    { label: "Tempo bruto", value: row.timeGross },
    { label: "Equipe", value: row.team },
    { label: "Modalidade", value: row.modality },
    { label: "Categoria", value: row.category },
    { label: "Sexo", value: row.sex },
    { label: "Idade", value: row.age ? `${row.age}` : undefined },
    { label: "Faixa etária", value: row.ageGroup },
    { label: "Colocação na faixa", value: row.ageGroupPos ? `${row.ageGroupPos}º` : undefined },
  ];
  return f.filter((x): x is { label: string; value: string } => !!x.value);
}

/**
 * Detalhe de um corredor + **estúdio de cards** (100% no navegador): o usuário
 * monta um card estilo Strava (template, formato feed/stories, tema, campos,
 * foto/mapa enquadráveis, selo, QR, fundo transparente) e baixa/compartilha.
 * Nada é enviado ao servidor. Mesma casca dark dos modais do site.
 */
export default function RunnerModal({
  runner,
  onClose,
  event,
  categoryLabel,
  brandLogo,
  routes,
  display,
}: {
  runner: RaceResultRow | null;
  onClose: () => void;
  event?: EventInfo;
  categoryLabel: string;
  brandLogo?: string;
  routes: PercursoRoute[];
  display?: ClassificacaoDisplay;
}) {
  const open = !!runner;
  // Marcador para saber se empurramos uma entrada de histórico (para o botão
  // "Voltar" do navegador/Android fechar a página em vez de sair do site).
  const pushed = useRef(false);

  useEffect(() => {
    if (!open) return;
    // Empurra UMA entrada de histórico (guardado contra o double-invoke do
    // StrictMode): no mobile o detalhe vira uma PÁGINA — o botão Voltar do
    // aparelho retorna à lista **no estado em que estava** (a home nunca é
    // desmontada; só fechamos a sobreposição). Todo fechar passa pelo `back()`,
    // então a entrada é sempre consumida por uma navegação real (sem lixo).
    if (!pushed.current) {
      try {
        window.history.pushState({ r4baRunner: true }, "");
        pushed.current = true;
      } catch {
        pushed.current = false;
      }
    }
    const onPop = () => { pushed.current = false; onClose(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pushed.current) window.history.back();
      else onClose();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  /** Fecha "voltando" no histórico (aciona o popstate → onClose). */
  const requestClose = () => {
    if (pushed.current) window.history.back();
    else onClose();
  };

  if (!runner) return null;

  const fields = detailFields(runner);

  return (
    <div
      className="fixed inset-0 z-[110] flex sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Resultado de ${runner.name}`}
    >
      {/* Backdrop só no desktop (no mobile é uma página cheia). */}
      <button type="button" aria-label="Fechar" onClick={requestClose} className="absolute inset-0 hidden bg-black/70 sm:block" />
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden border-line-soft bg-ink-panel sm:h-auto sm:max-h-[90vh] sm:max-w-[600px] sm:rounded-2xl sm:border sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-2 border-b border-line-soft px-3 py-3 sm:px-6 sm:py-4">
          {/* Voltar (mobile) */}
          <button
            type="button"
            onClick={requestClose}
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10 sm:hidden"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] uppercase tracking-[0.06em] text-gold">
              {runner.pos}º lugar{categoryLabel ? ` · ${categoryLabel}` : ""}
            </div>
            <h2 className="mt-0.5 truncate font-display text-[19px] font-bold uppercase text-cream md:text-[22px]">
              {runner.name}
            </h2>
          </div>
          {/* Fechar (desktop) */}
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10 sm:grid"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {/* Dados completos. */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-[11px] uppercase tracking-[0.05em] text-muted">{f.label}</dt>
                <dd className="truncate text-[15px] font-bold text-cream">{f.value}</dd>
              </div>
            ))}
          </dl>

          {/* Estúdio de cards. */}
          <div className="mt-6">
            <ShareCardStudio
              runner={runner}
              event={event}
              brandLogo={brandLogo}
              routes={routes}
              categoryLabel={categoryLabel}
              display={display}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
