"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CertificateConfig,
  ClassificacaoDisplay,
  ClassificacaoSection,
  EventInfo,
  PercursoRoute,
  RaceResultRow,
} from "@/lib/content/types";
import { fetchResults } from "@/lib/results/client";
import { rowInBracket } from "@/lib/results/brackets";
import { primaryTime } from "@/lib/results/format";
import SectionEyebrow from "./SectionEyebrow";
import SegmentedTabs from "./SegmentedTabs";
import ClassificacaoModal from "./ClassificacaoModal";
import RunnerModal from "./RunnerModal";
import CertificateModal from "./CertificateModal";
import { CertIcon } from "./CertIcon";

/** Cor da medalha por colocação (0 = 1º). Mesma paleta do pódio de Premiação. */
const MEDAL = [
  { bar: "var(--color-gold)", ink: "var(--color-gold-ink)", h: "h-28 md:h-36", delay: 260 },
  { bar: "#c9ccd2", ink: "#1a1400", h: "h-20 md:h-28", delay: 0 },
  { bar: "#cd7f4d", ink: "#1a1400", h: "h-16 md:h-20", delay: 120 },
];
/** Desktop: 2º à esquerda, 1º ao centro, 3º à direita. Mobile empilha 1→2→3. */
const SM_ORDER = ["sm:order-2", "sm:order-1", "sm:order-3"];

/**
 * Seção **Classificação** (resultados pós-prova). Cada categoria é uma aba
 * (`SegmentedTabs`, o mesmo seletor do Percurso/Galeria); as linhas são buscadas
 * do servidor (KV) em runtime. Mostra um **pódio animado** dos 3 primeiros, uma
 * **tabela inicial** com os primeiros colocados, e um botão que abre a
 * **classificação geral com busca**. Clicar num corredor abre o detalhe + o
 * gerador de imagem. Some sozinho quando não há categorias.
 */
export default function Classificacao({
  classificacao,
  title,
  event,
  brandLogo,
  routes,
  certificate,
}: {
  classificacao?: ClassificacaoSection;
  title?: string;
  event?: EventInfo;
  brandLogo?: string;
  routes?: PercursoRoute[];
  certificate?: CertificateConfig;
}) {
  const cfg = classificacao;
  const cats = useMemo(() => cfg?.categories ?? [], [cfg]);
  const display = cfg?.display;
  const initialCount = Math.max(3, cfg?.initialCount ?? 10);

  const [active, setActive] = useState(0);
  // Faixa etária selecionada: -1 = "Todas"; senão o índice em `activeCat.ageBrackets`.
  const [faixa, setFaixa] = useState(-1);
  // cache[id]: undefined = ainda buscando; [] = buscado e vazio; [...] = com dados.
  const [cache, setCache] = useState<Record<string, RaceResultRow[]>>({});
  const [openFull, setOpenFull] = useState(false);
  const [runner, setRunner] = useState<RaceResultRow | null>(null);
  const [certRunner, setCertRunner] = useState<RaceResultRow | null>(null);

  // Handlers estáveis (evitam re-registrar listeners/scroll-lock dos modais a cada render).
  const closeFull = useCallback(() => setOpenFull(false), []);
  const closeRunner = useCallback(() => setRunner(null), []);
  const closeCert = useCallback(() => setCertRunner(null), []);
  // Abre o certificado (por cima do que estiver aberto — tem própria entrada de histórico).
  const openCert = useCallback((r: RaceResultRow) => setCertRunner(r), []);
  // NÃO fecha a "classificação geral": o detalhe abre POR CIMA (com sua própria
  // entrada de histórico), então ao Voltar do atleta a lista continua no mesmo
  // lugar (busca/rolagem preservadas).
  const pickFromModal = useCallback((r: RaceResultRow) => setRunner(r), []);

  // Pódio: revela quando entra na viewport (respeita reduced-motion).
  const podiumRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const activeIdx = cats.length ? Math.min(active, cats.length - 1) : 0;
  const activeCat = cats[activeIdx];
  const rows = activeCat ? cache[activeCat.id] : undefined;

  // Busca as linhas da categoria ativa (uma vez por categoria). O único setState
  // acontece no callback assíncrono (não no corpo do efeito).
  useEffect(() => {
    if (!activeCat || cache[activeCat.id] !== undefined) return;
    let alive = true;
    fetchResults(activeCat.id)
      .then((r) => alive && setCache((c) => ({ ...c, [activeCat.id]: r })))
      .catch(() => alive && setCache((c) => ({ ...c, [activeCat.id]: [] })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat?.id]);

  // Ao trocar de categoria, volta o filtro de faixa para "Todas".
  useEffect(() => {
    setFaixa(-1);
  }, [activeCat?.id]);

  useEffect(() => {
    const el = podiumRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setInView(true), io.disconnect())),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) setInView(true);
    return () => io.disconnect();
  }, [activeIdx, rows]);

  // Some sozinho quando não há nada configurado.
  if (!cfg || cats.length === 0) return null;

  // Filtro por faixa etária (dentro da categoria). "Todas" = categoria inteira.
  const allRows = rows ?? [];
  const activeBrackets = activeCat?.ageBrackets ?? [];
  const selBracket = faixa >= 0 && faixa < activeBrackets.length ? activeBrackets[faixa] : null;
  const viewRows = selBracket ? allRows.filter((r) => rowInBracket(r, selBracket)) : allRows;
  // Colocação exibida: dentro da faixa reindexa 1..N; em "Todas" é a geral (`pos`).
  const placeMap = selBracket ? new Map(viewRows.map((r, i) => [r.pos, i + 1])) : null;
  const placeOf = (row: RaceResultRow) => placeMap?.get(row.pos) ?? row.pos;

  const podium = viewRows.slice(0, 3);
  const listRows = viewRows.slice(3, initialCount);
  const loading = !!activeCat && rows === undefined;
  const categoryHasRows = !!rows && rows.length > 0; // a categoria tem corredores
  const hasView = viewRows.length > 0; // o filtro atual tem corredores
  const showBracketFilter = categoryHasRows && activeBrackets.length > 0;

  return (
    <section id="classificacao" className="px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow className="mb-2">{cfg.eyebrow || "Classificação"}</SectionEyebrow>
      <h2 className="mb-3 font-display text-[30px] font-bold uppercase md:text-[40px]">
        {cfg.title || title || "Resultados"}
      </h2>
      {cfg.note && <p className="mb-6 max-w-[640px] text-[15px] text-muted-strong">{cfg.note}</p>}

      {/* Abas de categoria — mesmo componente do Percurso/Galeria. */}
      <SegmentedTabs
        items={cats.map((c) => c.label)}
        active={activeIdx}
        onSelect={(i) => setActive(i)}
        ariaLabel="Categorias de resultados"
        className="mb-8 rounded-lg border border-line-soft"
      />

      {loading ? (
        <div className="flex h-[200px] items-center justify-center text-[14px] text-muted">
          Carregando resultados…
        </div>
      ) : !categoryHasRows ? (
        <div className="flex h-[160px] items-center justify-center rounded-lg border border-line bg-ink-panel px-5 text-center text-[14px] text-muted">
          Os resultados desta categoria ainda não foram publicados.
        </div>
      ) : (
        <>
          {/* Filtro por faixa etária (dentro da categoria) — mesmo seletor das abas. */}
          {showBracketFilter && (
            <SegmentedTabs
              items={["Todas", ...activeBrackets.map((b) => b.label)]}
              active={faixa + 1}
              onSelect={(i) => setFaixa(i - 1)}
              ariaLabel="Filtrar por faixa etária"
              className="mb-8 rounded-lg border border-line-soft"
            />
          )}
          {!hasView ? (
            <div className="flex h-[140px] items-center justify-center rounded-lg border border-line bg-ink-panel px-5 text-center text-[14px] text-muted">
              Nenhum corredor nesta faixa etária.
            </div>
          ) : (
            <>
          {/* Pódio dos 3 primeiros. */}
          <div
            ref={podiumRef}
            className="mb-9 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-end sm:gap-5"
          >
            {podium.map((row, rank) => {
              const medal = MEDAL[rank];
              const time = primaryTime(row, display);
              return (
                <button
                  type="button"
                  key={`${row.pos}-${row.bib}-${rank}`}
                  onClick={() => setRunner(row)}
                  className={`group flex flex-1 flex-col text-left sm:max-w-[300px] ${SM_ORDER[rank]}`}
                  aria-label={`${placeOf(row)}º lugar: ${row.name}`}
                >
                  {/* Cartão do corredor. */}
                  <div
                    className="mb-3 rounded-lg border bg-ink-panel p-4 transition-all duration-700 ease-out group-hover:-translate-y-0.5"
                    style={{
                      borderColor: medal.bar,
                      transitionDelay: `${medal.delay}ms`,
                      opacity: inView ? 1 : 0,
                      transform: inView ? "translateY(0)" : "translateY(14px)",
                    }}
                  >
                    <div
                      className="text-[12px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: medal.bar }}
                    >
                      {placeOf(row)}º lugar
                    </div>
                    <div className="mt-1 font-display text-[17px] font-bold uppercase leading-tight text-cream md:text-[19px]">
                      {row.name}
                    </div>
                    {display?.team && row.team && (
                      <div className="mt-0.5 text-[12px] text-muted">{row.team}</div>
                    )}
                    {time && (
                      <div className="mt-2 font-display text-[22px] font-bold text-gold md:text-[26px]">
                        {time}
                      </div>
                    )}
                    <SubChips row={row} display={display} />
                  </div>

                  {/* Bloco do pódio que cresce. */}
                  <div className={`relative overflow-hidden rounded-t-lg ${medal.h}`}>
                    <div
                      className="absolute inset-0 origin-bottom"
                      style={{
                        background: medal.bar,
                        transform: inView ? "scaleY(1)" : "scaleY(0)",
                        transition: "transform 900ms cubic-bezier(0.22,1,0.36,1)",
                        transitionDelay: `${medal.delay}ms`,
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center font-display text-[34px] font-bold transition-opacity duration-500 md:text-[40px]"
                      style={{
                        color: medal.ink,
                        opacity: inView ? 1 : 0,
                        transitionDelay: `${medal.delay + 450}ms`,
                      }}
                      aria-hidden="true"
                    >
                      {rank + 1}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tabela inicial (colocados 4..N). */}
          {listRows.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-line-soft bg-ink-panel">
              {listRows.map((row, i) => (
                <ResultRow key={`${row.pos}-${row.bib}-${i}`} row={row} place={placeOf(row)} display={display} onClick={() => setRunner(row)} onCertificate={() => openCert(row)} />
              ))}
            </div>
          )}

          {/* Ver classificação geral. */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setOpenFull(true)}
              className="clip-cta-lg inline-block bg-gold px-7 py-4 text-[14px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:text-[15px]"
            >
              Ver classificação geral
            </button>
          </div>
            </>
          )}
        </>
      )}

      {/* Modais. */}
      <ClassificacaoModal
        open={openFull}
        onClose={closeFull}
        rows={viewRows}
        placeOf={selBracket ? placeOf : undefined}
        categoryLabel={`${activeCat?.label ?? ""}${selBracket ? ` · ${selBracket.label}` : ""}`}
        display={display}
        onPick={pickFromModal}
        onCertificate={openCert}
      />
      <RunnerModal
        key={runner ? `${activeCat?.id}-${runner.pos}` : "none"}
        runner={runner}
        onClose={closeRunner}
        event={event}
        categoryLabel={activeCat?.label ?? ""}
        brandLogo={brandLogo}
        routes={routes ?? []}
        display={display}
        onCertificate={runner ? () => openCert(runner) : undefined}
      />
      <CertificateModal
        runner={certRunner}
        onClose={closeCert}
        event={event}
        categoryLabel={activeCat?.label ?? ""}
        categoryDistance={activeCat?.distance}
        brandLogo={brandLogo}
        display={display}
        certificate={certificate}
      />
    </section>
  );
}

/** Chips pequenos (idade, faixa etária, nº na faixa, peito) conforme a config. */
function SubChips({ row, display }: { row: RaceResultRow; display?: ClassificacaoDisplay }) {
  const chips: string[] = [];
  if (display?.bib && row.bib) chips.push(`#${row.bib}`);
  if (display?.age && row.age) chips.push(`${row.age} anos`);
  if (display?.ageGroup && row.ageGroup) chips.push(row.ageGroup);
  if (display?.ageGroupPos && row.ageGroupPos) chips.push(`${row.ageGroupPos}º faixa`);
  if (chips.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <span
          key={i}
          className="rounded-full border border-line bg-ink px-2 py-0.5 text-[11px] text-muted-strong"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

/** Uma linha clicável da tabela compacta (responsiva: some colunas no mobile).
 *  A linha abre o detalhe; o botão à direita **emite o certificado**. */
export function ResultRow({
  row,
  place,
  display,
  onClick,
  onCertificate,
}: {
  row: RaceResultRow;
  /** Colocação exibida (dentro do filtro). Vazio → colocação geral (`row.pos`). */
  place?: number;
  display?: ClassificacaoDisplay;
  onClick: () => void;
  onCertificate?: () => void;
}) {
  const time = primaryTime(row, display);
  const shownPos = place ?? row.pos;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      aria-label={`${shownPos}º ${row.name}`}
      className="flex w-full cursor-pointer items-center gap-3 border-b border-line-soft px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-white/5 sm:px-4"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display text-[13px] font-bold text-gold">
        {shownPos}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold uppercase tracking-[0.02em] text-cream">
          {row.name}
        </span>
        {display?.team && row.team && (
          <span className="block truncate text-[12px] text-muted">{row.team}</span>
        )}
      </span>
      {display?.ageGroup && row.ageGroup && (
        <span className="hidden shrink-0 rounded-full border border-line bg-ink px-2 py-0.5 text-[11px] text-muted-strong sm:inline">
          {row.ageGroup}
        </span>
      )}
      {time && (
        <span className="shrink-0 font-display text-[15px] font-bold text-cream">{time}</span>
      )}
      {onCertificate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCertificate(); }}
          aria-label={`Emitir certificado de ${row.name}`}
          title="Emitir certificado"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted-strong transition-colors hover:border-gold hover:text-gold"
        >
          <CertIcon />
        </button>
      )}
    </div>
  );
}
