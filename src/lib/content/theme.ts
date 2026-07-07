import type { SponsorTier, EditionStatus, ThemeColors } from "./types";

/** Theme keys → the CSS custom properties they override. */
export const THEME_VARS: Record<keyof ThemeColors, string[]> = {
  background: ["--color-ink"],
  accent: ["--color-gold"],
  accentText: ["--color-gold-ink"],
  text: ["--color-cream"],
  sections: ["--color-ink-deep", "--color-ink-deeper"],
  cards: ["--color-ink-panel", "--color-ink-card"],
  heroRed: ["--color-brasil", "--color-brasil-2"],
};

/** Only allow safe CSS color tokens (hex / rgb / hsl / oklch / named). */
function safeColor(v: string): boolean {
  return /^[#a-zA-Z0-9(),.%\s/-]+$/.test(v) && !v.includes("}") && v.length < 64;
}

/**
 * Build a `:root { --color-…: … }` block from the configured theme so the
 * correct colors are present on the FIRST server-rendered paint (no flash).
 * Returns "" when nothing is customized.
 */
export function themeCss(theme: ThemeColors | undefined): string {
  if (!theme) return "";
  const decls: string[] = [];
  (Object.keys(THEME_VARS) as (keyof ThemeColors)[]).forEach((key) => {
    const value = theme[key];
    if (value && safeColor(value)) {
      THEME_VARS[key].forEach((v) => decls.push(`${v}:${value}`));
    }
  });
  return decls.length ? `:root{${decls.join(";")}}` : "";
}

/** Sponsor tier badge colors — ported from ADM Patrocinadores.dc.html */
export const sponsorTierColors: Record<
  SponsorTier,
  { bg: string; color: string }
> = {
  Ouro: { bg: "oklch(0.85 0.12 85)", color: "oklch(0.35 0.1 70)" },
  Prata: { bg: "oklch(0.9 0.005 0)", color: "oklch(0.4 0.01 0)" },
  Bronze: { bg: "oklch(0.82 0.08 45)", color: "oklch(0.35 0.08 40)" },
};

/** Edition status badge colors — ported from ADM Edicoes.dc.html */
export const editionStatusColors: Record<
  EditionStatus,
  { bg: string; color: string }
> = {
  Ativa: { bg: "oklch(0.85 0.14 140)", color: "oklch(0.32 0.1 145)" },
  Encerrada: { bg: "oklch(0.9 0.005 0)", color: "oklch(0.45 0.01 0)" },
};
