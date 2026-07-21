import type { Sponsor, SponsorTier } from "@/lib/content/types";
import Reveal from "./Reveal";
import SectionEyebrow from "./SectionEyebrow";

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

/** Build a social profile URL from an @handle, a bare handle, or a full URL. */
function social(v?: string) {
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.trim().replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "");
  return handle ? `https://instagram.com/${handle}` : null;
}

/** "@handle" for display, from a username/handle or an Instagram URL (same rule
 *  as the organizers card). Returns "" when nothing usable is set. */
function atHandle(v?: string): string {
  const handle = (v || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "")
    .replace(/^@/, "");
  return handle ? `@${handle}` : "";
}

/**
 * The partner card destination. Uses the single `link` interpreted by
 * `linkKind` (site or social); falls back to the legacy `instagram`/`link`.
 */
function partnerHref(sp: Sponsor) {
  if (sp.linkKind === "social") return social(sp.link);
  if (sp.linkKind === "site") return site(sp.link);
  return social(sp.instagram) ?? site(sp.link);
}

/**
 * Partners grid — a modern card per partner: a square (1:1) logo tile that fills
 * the card width, the name below and an optional tier badge (shown only when the
 * ADM enables it, globally). Clicking a card opens the partner's Instagram (if
 * set) or website. Two columns on mobile, up to five on desktop.
 */
export default function Parceiros({
  sponsors,
  showTier,
  subtitle,
  showCta,
}: {
  sponsors: Sponsor[];
  showTier?: boolean;
  subtitle?: string;
  showCta?: boolean;
}) {
  if (sponsors.length === 0) return null;

  return (
    <section id="parceiros" className="bg-ink px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionEyebrow as="h2">Parceiros</SectionEyebrow>
        {showCta && (
          <a
            href="#seja-parceiro"
            className="clip-cta-lg inline-block bg-gold px-6 py-3 text-[13px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:text-[14px]"
          >
            Seja um parceiro
          </a>
        )}
      </div>
      {subtitle?.trim() && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/70 md:text-[16px]">
          {subtitle}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-10 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
        {sponsors.map((sp, i) => {
          const href = partnerHref(sp);
          const tier = showTier ? TIER_COLOR[sp.tier] : null;
          // The @handle shown under the name: an explicit `username` wins; otherwise
          // it reuses the SAME value chosen for a social link (so the partner doesn't
          // type it twice), falling back to the legacy `instagram`.
          const handle = atHandle(
            sp.username || (sp.linkKind === "social" ? sp.link : "") || sp.instagram,
          );
          const inner = (
            <>
              {/* Logo tile — square (1:1), fills the full width of the card. */}
              <div className="aspect-square w-full overflow-hidden bg-white">
                {sp.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sp.logo}
                    alt={sp.name}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.05]"
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
                {/* Instagram @handle (like the organizers card). Always rendered —
                    a non-breaking space keeps the line's height when empty so every
                    card stays the same size/proportion. */}
                <span className="min-h-[1.15em] text-[12px] leading-none text-gold">
                  {handle || " "}
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
            <Reveal key={`${sp.name}-${i}`} delay={(i % 5) * 60} className={cardClass}>
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
