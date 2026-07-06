import type { Stat } from "@/lib/content/types";
import Reveal from "./Reveal";
import Counter from "./Counter";

/**
 * Impact numbers overlapping the hero. Values count up on scroll (Counter),
 * cards fade/rise in with a stagger (Reveal).
 */
export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="relative z-10 -mt-10 grid grid-cols-1 gap-4 px-5 sm:grid-cols-3 sm:gap-0 sm:px-8 md:px-14">
      {stats.map((s, i) => (
        <Reveal
          key={s.label}
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
