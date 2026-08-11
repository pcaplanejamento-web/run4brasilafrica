"use client";

/**
 * Abas segmentadas (pílulas) reutilizáveis — o **mesmo** seletor usado em "O
 * Percurso" e na "Galeria": o visitante troca entre opções (percursos, seções de
 * fotos…) e o conteúdo abaixo acompanha a escolha. Pílulas `rounded-full` com
 * `min-h-11` (alvo de toque ≥44px), ativa em `bg-gold`, `role="tablist"` +
 * `aria-current`, quebra em várias linhas no mobile (`flex-wrap`). Some sozinho
 * quando há **uma só** opção (nada a escolher).
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
  /** Estilo extra do contêiner (a margem padrão é `mb-6`). */
  className?: string;
}) {
  if (items.length <= 1) return null;
  return (
    <div className={`mb-6 flex flex-wrap gap-2 ${className}`} role="tablist" aria-label={ariaLabel}>
      {items.map((label, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-current={i === active ? "true" : undefined}
          onClick={() => onSelect(i)}
          className={`min-h-11 rounded-full px-5 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors ${
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
