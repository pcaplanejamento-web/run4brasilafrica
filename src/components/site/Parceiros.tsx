import type { Sponsor, SponsorTier } from "@/lib/content/types";
import Reveal from "./Reveal";

/** Tier badge colors on the dark theme (gold / silver / bronze). */
const TIER_COLOR: Record<SponsorTier, { bg: string; text: string }> = {
  Ouro: { bg: "var(--color-gold)", text: "var(--color-gold-ink)" },
  Prata: { bg: "#c9ccd2", text: "#1a1400" },
  Bronze: { bg: "#cd7f4d", text: "#1a1400" },
};

function site(url?: string) {
  if (!url) return null;
  return url.startsWith("http") ? url : `https://${url}`;
}

/** Build an Instagram profile URL from an @handle, a handle, or a full URL. */
function instagram(v?: string) {
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.trim().replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "");
  return handle ? `https://instagram.com/${handle}` : null;
}

/** The partner card destination: Instagram when set, else the website. */
function partnerHref(sp: Sponsor) {
  return instagram(sp.instagram) ?? site(sp.link);
}

/**
 * Partners grid — a modern card per partner: a wide (rectangular) logo tile that
 * fills the card, the name below and an optional tier badge (shown only when the
 * ADM enables it, globally). Clicking a card opens the partner's Instagram (if
 * set) or website. Two columns on mobile, up to five on desktop.
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
        {sponsors.map((sp, i) => {
          const href = partnerHref(sp);
          const tier = showTier ? TIER_COLOR[sp.tier] : null;
          const inner = (
            <>
              {/* Logo tile — fills the card width, rectangular (not square). */}
              <div className="aspect-[16/10] w-full overflow-hidden bg-white">
                {sp.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sp.logo}
                    alt={sp.name}
                    className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.05]"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-[monospace] text-[12px] text-[#999]">[ logo ]</span>
                  </div>
                )}
              </div>
              {/* Name + optional tier. */}
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center">
                <span className="text-[13px] font-bold uppercase leading-snug tracking-[0.03em] text-cream md:text-[14px]">
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

          const cardClass =
            "group flex flex-col overflow-hidden rounded-2xl border border-line-soft bg-ink-panel transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]";

          return (
            <Reveal key={sp.name} delay={(i % 5) * 60} className={cardClass}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sp.name}
                  className="flex flex-1 flex-col"
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
