import type { SponsorTier, EditionStatus } from "./types";

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
