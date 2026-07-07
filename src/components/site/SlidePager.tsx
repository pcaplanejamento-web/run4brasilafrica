"use client";

/**
 * Official slide pager used across the site (gallery grid, hero carousel, …):
 * a previous/next circular control with a row of dots (the active one is a gold
 * pill). Touch-friendly (44px targets). Two tones: "solid" (on a page section)
 * and "overlay" (translucent, to sit on top of media). When there are more
 * pages than `maxDots`, a compact "current / total" counter replaces the dots.
 */
export default function SlidePager({
  count,
  current,
  onGo,
  onSelect,
  tone = "solid",
  maxDots = 12,
  prevLabel = "Anterior",
  nextLabel = "Próximo",
  dotLabel = (i) => `Ir para ${i + 1}`,
  className = "",
}: {
  count: number;
  current: number;
  onGo: (dir: 1 | -1) => void;
  onSelect: (index: number) => void;
  tone?: "solid" | "overlay";
  maxDots?: number;
  prevLabel?: string;
  nextLabel?: string;
  dotLabel?: (index: number) => string;
  className?: string;
}) {
  if (count <= 1) return null;

  const arrow =
    tone === "overlay"
      ? "bg-black/45 text-white hover:bg-black/70"
      : "bg-ink-panel text-cream hover:bg-ink-card";
  const dotInactive = tone === "overlay" ? "bg-white/40" : "bg-white/30";
  const counter = tone === "overlay" ? "text-white/90" : "text-muted-strong";

  return (
    <div className={`flex items-center justify-center gap-x-3 gap-y-2 ${className}`}>
      <button
        type="button"
        onClick={() => onGo(-1)}
        aria-label={prevLabel}
        className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors ${arrow}`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {count <= maxDots ? (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: count }, (_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              aria-label={dotLabel(k)}
              aria-current={k === current ? "true" : undefined}
              className="flex h-8 items-center px-1"
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  k === current ? "w-6 bg-gold" : `w-2 ${dotInactive}`
                }`}
              />
            </button>
          ))}
        </div>
      ) : (
        <span className={`text-[13px] font-semibold ${counter}`}>
          {current + 1} / {count}
        </span>
      )}

      <button
        type="button"
        onClick={() => onGo(1)}
        aria-label={nextLabel}
        className={`flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors ${arrow}`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
