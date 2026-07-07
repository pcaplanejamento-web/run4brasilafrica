import type { Hero as HeroType } from "@/lib/content/types";

/**
 * Hero / banner. The dark diagonal texture is a stand-in for the edition photo
 * that the organizing team uploads via ADM > Banner (Plano §4.1.1). Overlaid
 * headline, date badge and primary CTA. Scales from a full 88px display on
 * desktop down to a legible mobile layout.
 */
export default function Hero({ hero }: { hero: HeroType }) {
  return (
    <section
      id="top"
      className="clip-hero relative min-h-[540px] md:h-[680px]"
      style={
        hero.image
          ? {
              backgroundImage: `url(${hero.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              background:
                "repeating-linear-gradient(-25deg, oklch(0.62 0.16 35) 0 30px, oklch(0.55 0.16 32) 30px 60px)",
            }
      }
    >
      {/* Bottom-up darkening for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(10,8,6,.85), transparent 55%)",
        }}
      />

      {!hero.image && (
        <div className="absolute left-5 top-5 font-[monospace] text-[11px] text-white/65 sm:left-8 md:left-14 md:text-[12px]">
          [ foto: corredores na largada — alto contraste ]
        </div>
      )}

      <div className="absolute inset-x-5 bottom-12 sm:inset-x-8 md:inset-x-14 md:bottom-[90px]">
        <div className="mb-5 inline-block bg-gold px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-gold-ink md:mb-[22px] md:text-[13px]">
          {hero.badge}
        </div>

        <h1 className="max-w-[960px] font-display text-[44px] font-bold uppercase leading-[0.98] sm:text-[60px] md:text-[88px]">
          {hero.title}
        </h1>

        <div className="mt-7 flex items-center gap-5 md:mt-8">
          <a
            href="#inscricao"
            className="clip-cta-lg bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:px-[34px] md:py-[17px] md:text-[16px]"
          >
            {hero.ctaLabel}
          </a>
          <div className="hidden gap-2 sm:flex" aria-hidden="true">
            <div className="h-1 w-[26px] bg-gold" />
            <div className="h-1 w-2.5 bg-white/35" />
            <div className="h-1 w-2.5 bg-white/35" />
          </div>
        </div>
      </div>
    </section>
  );
}
