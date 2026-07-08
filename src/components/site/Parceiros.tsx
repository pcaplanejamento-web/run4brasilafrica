import type { Sponsor, SponsorTier } from "@/lib/content/types";
import Reveal from "./Reveal";

/** Tier badge colors on the dark theme (gold / silver / bronze). */
const TIER_COLOR: Record<SponsorTier, { bg: string; text: string }> = {
  Ouro: { bg: "var(--color-gold)", text: "var(--color-gold-ink)" },
  Prata: { bg: "#c9ccd2", text: "#1a1400" },
  Bronze: { bg: "#cd7f4d", text: "#1a1400" },
};

function href(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `https://${url}`;
}

/**
 * Partners grid — a modern card per partner: big logo on top, name below and an
 * optional tier badge (shown only when the ADM enables it, globally). Two columns
 * on mobile, more on larger screens. Logos managed in ADM > Patrocinadores.
 */
export default function Parceiros({
  sponsors,
  showTier,
}: {
  sponsors: Sponsor[];
  showTier?: boolean;
}) {
  if (sponsors.length === 0) return null;

  return (
    <section id="parceiros" className="bg-ink-deep px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <h2 className="mb-8 font-display text-[26px] font-bold uppercase md:mb-10 md:text-[34px]">
        Parceiros
      </h2>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {sponsors.map((sp, i) => {
          const link = href(sp.link);
          const tier = showTier ? TIER_COLOR[sp.tier] : null;
          const inner = (
            <>
              <div className="flex h-24 w-full items-center justify-center md:h-28">
                {sp.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sp.logo}
                    alt={sp.name}
                    className="max-h-full max-w-[86%] object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <span className="font-[monospace] text-[12px] text-muted">[ logo ]</span>
                )}
              </div>
              <div className="mt-1 flex flex-col items-center gap-1.5 text-center">
                <span className="text-[13px] font-bold uppercase leading-snug tracking-[0.03em] text-cream md:text-[15px]">
                  {sp.name}
                </span>
                {tier && (
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                    style={{ background: tier.bg, color: tier.text }}
                  >
                    {sp.tier}
                  </span>
                )}
              </div>
            </>
          );

          return (
            <Reveal
              key={sp.name}
              delay={(i % 4) * 70}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line-soft bg-ink-panel p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] md:p-6"
            >
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sp.name}
                  className="flex w-full flex-col items-center gap-3"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
