import type { Stat } from "@/lib/content/types";
import Reveal from "./Reveal";
import Counter from "./Counter";

/**
 * Impact numbers. Sits in normal flow BELOW whatever precedes it (it used to be
 * pulled up over the hero with a negative margin — that covered the banner
 * artwork, so the overlap was removed). Values count up on scroll (Counter),
 * cards fade/rise in with a stagger (Reveal).
 */
export default function StatsBar({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <div id="numeros" className="grid grid-cols-1 gap-4 px-5 pt-12 sm:grid-cols-3 sm:gap-0 sm:px-8 md:px-14 md:pt-14">
      {stats.map((s, i) => (
        <Reveal
          key={`${s.label}-${i}`}
          delay={i * 90}
          className="bg-gold px-6 py-7 text-gold-ink sm:mx-2"
        >
          <div className="font-display text-[32px] font-bold md:text-[38px]">
            <Counter value={s.value} />
          </div>
          <div className="mt-1 text-[13px] uppercase tracking-[0.05em]">
            {s.label}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
