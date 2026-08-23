"use client";

/**
 * Barra de abas **segmentada** reutilizável — o **mesmo** seletor da barra
 * "STRAVA / GARMIN" do `RouteViewer` ("O Percurso"), agora usado também na
 * "Galeria" e no filtro de faixas etárias da Classificação. Segmentos
 * **conectados** (sem espaço), largura cheia no mobile (`flex-1`, alvo de toque
 * ≥44px) e largura natural no desktop (`sm:flex-none`), borda inferior
 * (`border-b`), ativa em `bg-gold`. Com **muitos** itens (ex.: 8 faixas), as abas
 * **quebram em linhas** (`flex-wrap` + `whitespace-nowrap`) — todos os botões
 * ficam acessíveis pelo scroll vertical da página, sem encolher/cortar no mobile.
 * `role="tablist"` + `aria-current`. Some sozinho quando há **uma só** opção.
 */
export default function SegmentedTabs({
  items,
  active,
  onSelect,
  ariaLabel,
  className = "",
}: {
  /** Rótulos das abas (na ordem em que aparecem). */
  items: string[];
  /** Índice ativo. */
  active: number;
  /** Chamado ao escolher uma aba. */
  onSelect: (index: number) => void;
  ariaLabel: string;
  /** Estilo extra do contêiner (ex.: `mb-*` para espaçar do conteúdo abaixo). */
  className?: string;
}) {
  if (items.length <= 1) return null;
  return (
    <div
      className={`flex min-h-11 flex-wrap items-stretch overflow-hidden border-b border-line-soft ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((label, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-current={i === active ? "true" : undefined}
          onClick={() => onSelect(i)}
          className={`min-h-11 flex-1 whitespace-nowrap px-4 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors sm:flex-none ${
            i === active
              ? "bg-gold text-gold-ink"
              : "bg-ink-panel text-muted-strong hover:text-cream"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
