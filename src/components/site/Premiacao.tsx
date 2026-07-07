import type { PremiacaoSection } from "@/lib/content/types";

/** Podium medal styling per rank (0 = 1st). */
const MEDAL = [
  { color: "var(--color-gold)", text: "var(--color-gold-ink)", height: "h-40 md:h-48" },
  { color: "#c9ccd2", text: "#1a1400", height: "h-32 md:h-36" },
  { color: "#cd7f4d", text: "#1a1400", height: "h-24 md:h-28" },
];
/**
 * Awards section rendered as a podium: each of the top-3 positions shows its
 * award; on desktop the 1st place is centered and tallest (2nd left, 3rd right),
 * on mobile they stack 1 → 2 → 3. Extra positions (4th+) appear as a list. An
 * optional button links to the full results elsewhere. Hidden until enabled.
 */
export default function Premiacao({ premiacao }: { premiacao?: PremiacaoSection }) {
  if (!premiacao?.enabled) return null;
  const places = (premiacao.places ?? []).filter((p) => p.place || p.prize);
  if (places.length === 0 && !premiacao.resultsUrl) return null;

  const title = premiacao.title || "Pódio";
  const podium = places.slice(0, 3);
  const extra = places.slice(3);
  // Natural DOM order (1º, 2º, 3º) → mobile stacks 1→2→3. On desktop `sm:order-*`
  // reorders to 2º | 1º | 3º so the 1st place is centered and tallest.
  const SM_ORDER = ["sm:order-2", "sm:order-1", "sm:order-3"];
  const cols = podium.map((place, rank) => ({ place, rank, order: SM_ORDER[rank] }));

  return (
    <section id="premiacao" className="px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
        {premiacao.eyebrow || "Premiação"}
      </div>
      <h2 className="mb-3 font-display text-[30px] font-bold uppercase md:text-[40px]">
        {title}
      </h2>
      {premiacao.note && (
        <p className="mb-8 max-w-[640px] text-[15px] text-muted-strong">{premiacao.note}</p>
      )}

      {podium.length > 0 && (
        <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-end sm:gap-5">
          {cols.map(({ place, rank, order }) => {
            const medal = MEDAL[rank];
            return (
              <div
                key={rank}
                className={`flex flex-1 flex-col sm:max-w-[280px] ${order}`}
              >
                <div
                  className="mb-3 rounded-lg border bg-ink-panel p-4 text-center"
                  style={{ borderColor: medal.color }}
                >
                  <div
                    className="text-[13px] font-bold uppercase tracking-[0.04em]"
                    style={{ color: medal.color }}
                  >
                    {place.place || `${rank + 1}º lugar`}
                  </div>
                  {place.prize && (
                    <div className="mt-1.5 font-display text-[18px] font-bold leading-tight md:text-[20px]">
                      {place.prize}
                    </div>
                  )}
                </div>
                <div
                  className={`flex items-center justify-center rounded-t-lg font-display text-[36px] font-bold md:text-[44px] ${medal.height}`}
                  style={{ background: medal.color, color: medal.text }}
                  aria-hidden="true"
                >
                  {rank + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {extra.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {extra.map((p, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-ink-panel px-4 py-3"
            >
              <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-gold">
                {p.place || `${i + 4}º lugar`}
              </span>
              <span className="text-right text-[14px] text-muted-strong">{p.prize}</span>
            </div>
          ))}
        </div>
      )}

      {premiacao.resultsUrl && (
        <div className="mt-9 flex justify-center">
          <a
            href={premiacao.resultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="clip-cta-lg inline-block bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5"
          >
            {premiacao.resultsLabel || "Ver resultados completos"}
          </a>
        </div>
      )}
    </section>
  );
}
