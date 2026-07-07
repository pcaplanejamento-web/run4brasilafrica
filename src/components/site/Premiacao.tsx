"use client";

import { useEffect, useRef, useState } from "react";
import type { PremiacaoSection } from "@/lib/content/types";

/** Podium styling per rank (0 = 1st). `delay` staggers the reveal (1st last). */
const MEDAL = [
  { color: "var(--color-gold)", text: "var(--color-gold-ink)", height: "h-44 md:h-52", delay: 260 },
  { color: "#c9ccd2", text: "#1a1400", height: "h-32 md:h-40", delay: 0 },
  { color: "#cd7f4d", text: "#1a1400", height: "h-24 md:h-28", delay: 120 },
];
/** Desktop order so 1st is centered (2nd left, 3rd right). Mobile keeps 1→2→3. */
const SM_ORDER = ["sm:order-2", "sm:order-1", "sm:order-3"];

/**
 * Awards section rendered as an **animated podium**: when it scrolls into view
 * the bars grow up from the base (1st rising last for drama) and each prize
 * card fades in, showing the registered award per position. On desktop the 1st
 * place is centered and tallest; on mobile the columns stack 1 → 2 → 3. Extra
 * positions (4th+) list below, plus an optional link to full results.
 *
 * Whether the section appears at all is controlled by the Dashboard (home
 * components on/off), NOT here — this component just renders when it has data.
 * Respects reduced-motion.
 */
export default function Premiacao({ premiacao }: { premiacao?: PremiacaoSection }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  const places = (premiacao?.places ?? []).filter((p) => p.place || p.prize);
  const show = places.length > 0 || !!premiacao?.resultsUrl;

  useEffect(() => {
    if (!show) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      // Same proven config as the site's Reveal component.
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Fallback: if the section is already within the viewport at mount, reveal
    // right away (the observer only covers later scroll-ins).
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setInView(true);
    }
    return () => io.disconnect();
  }, [show]);

  if (!show) return null;

  const title = premiacao?.title || "Pódio";
  const podium = places.slice(0, 3);
  const extra = places.slice(3);
  const cols = podium.map((place, rank) => ({ place, rank }));

  return (
    <section id="premiacao" ref={ref} className="px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
        {premiacao?.eyebrow || "Premiação"}
      </div>
      <h2 className="mb-3 font-display text-[30px] font-bold uppercase md:text-[40px]">{title}</h2>
      {premiacao?.note && (
        <p className="mb-8 max-w-[640px] text-[15px] text-muted-strong">{premiacao.note}</p>
      )}

      {podium.length > 0 && (
        <div className="mt-8 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-end sm:gap-5">
          {cols.map(({ place, rank }) => {
            const medal = MEDAL[rank];
            const cardStyle = {
              transitionDelay: `${medal.delay}ms`,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(14px)",
            };
            return (
              <div
                key={rank}
                className={`flex flex-1 flex-col sm:max-w-[280px] ${SM_ORDER[rank]}`}
              >
                {/* Prize card */}
                <div
                  className="mb-3 rounded-lg border bg-ink-panel p-4 text-center transition-all duration-700 ease-out"
                  style={{ ...cardStyle, borderColor: medal.color }}
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

                {/* Growing podium block */}
                <div className={`relative overflow-hidden rounded-t-lg ${medal.height}`}>
                  <div
                    className="absolute inset-0 origin-bottom ease-out"
                    style={{
                      background: medal.color,
                      transform: inView ? "scaleY(1)" : "scaleY(0)",
                      transition: "transform 900ms cubic-bezier(0.22,1,0.36,1)",
                      transitionDelay: `${medal.delay}ms`,
                    }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center font-display text-[36px] font-bold transition-opacity duration-500 md:text-[44px]"
                    style={{
                      color: medal.text,
                      opacity: inView ? 1 : 0,
                      transitionDelay: `${medal.delay + 450}ms`,
                    }}
                    aria-hidden="true"
                  >
                    {rank + 1}
                  </div>
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

      {premiacao?.resultsUrl && (
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
