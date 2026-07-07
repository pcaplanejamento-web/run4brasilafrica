import type { Sponsor } from "@/lib/content/types";
import Reveal from "./Reveal";

/** Sponsors / partners grid (Plano §4.1.6). Logos managed in ADM > Patrocinadores. */
export default function Parceiros({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <section id="parceiros" className="bg-ink-deep px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <h2 className="mb-8 font-display text-[24px] font-bold uppercase md:mb-9 md:text-[30px]">
        Parceiros
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
        {sponsors.map((sp, i) => (
          <Reveal
            key={sp.name}
            delay={(i % 5) * 60}
            className="flex h-[90px] flex-col items-center justify-center gap-1 border border-line-soft bg-ink-panel p-2"
          >
            {sp.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sp.logo}
                alt={sp.name}
                className="max-h-[44px] max-w-[80%] object-contain"
              />
            ) : (
              <span className="font-[monospace] text-[11px] text-muted">[ logo ]</span>
            )}
            <span className="text-[11px] uppercase tracking-[0.06em] text-gold">
              {sp.tier}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
