import type { CustomSection, Hero, HeroCarousel, SiteContent } from "./types";
import { parseBR } from "./datetime";

/** Id determinístico da aba Banner/Hero (casa com a migração em migrate.ts). */
export const HERO_ABA_ID = "sec-hero";

/**
 * Insere/atualiza o bloco Banner/Hero (aba `sec-hero`) dentro de `customSections`
 * de uma edição — a fonte de verdade do banner é o bloco. Atualiza o primeiro
 * bloco `hero` que encontrar; se nenhum existir, cria a aba no topo. Puro.
 */
export function withHeroCarousels(
  sections: CustomSection[],
  carousels: HeroCarousel[],
): CustomSection[] {
  let found = false;
  const next = sections.map((s) => {
    let touched = false;
    const blocks = (s.blocks ?? []).map((b) => {
      if (b.type === "hero" && !found) {
        found = true;
        touched = true;
        return { ...b, heroCarousels: carousels };
      }
      return b;
    });
    return touched ? { ...s, blocks } : s;
  });
  if (found) return next;
  return [
    {
      id: HERO_ABA_ID,
      title: "Banner / Hero",
      blocks: [{ id: `${HERO_ABA_ID}-b`, type: "hero", heroCarousels: carousels }],
    },
    ...sections,
  ];
}

/** Época (ms) da string do ADM, em fuso de Brasília (−03:00). */
const ms = (s: string | undefined): number | null => parseBR(s);

/**
 * Whether a NON-default carousel is on air at `now`. A scheduled carousel needs
 * a start date to ever show (no `startAt` = not scheduled → never active, so it
 * doesn't shadow the default). Its end is optional (empty = perpetual from start).
 * The default is handled separately (always eligible) and never passes through here.
 */
function inWindow(c: HeroCarousel, now: number): boolean {
  const s = ms(c.startAt);
  if (s === null) return false; // no start date → not scheduled
  if (now < s) return false;
  const e = ms(c.endAt);
  if (e !== null && now >= e) return false;
  return true;
}

/**
 * Normalize a content's carousels into a non-empty list with EXACTLY one default
 * (the perpetual fallback). Back-compat: when `heroCarousels` is missing/empty,
 * the single `content.hero` becomes the sole default carousel — so legacy content
 * keeps working untouched.
 */
/**
 * Normaliza uma lista de carrosséis numa lista não-vazia com EXATAMENTE um
 * default. Lista vazia → um único carrossel padrão (usa `fallbackHero` se dado,
 * ex.: `content.hero` legado, senão slides vazios). Reusado pelo `carouselsOf` e
 * pelo bloco de seção `hero`.
 */
export function normalizeCarousels(
  input: HeroCarousel[] | undefined,
  fallbackHero?: Hero,
): HeroCarousel[] {
  const list = (input ?? []).filter(Boolean);
  const base: HeroCarousel[] =
    list.length > 0
      ? list.map((c, i) => ({
          ...c,
          id: c.id || `carousel-${i + 1}`,
          name: c.name || `Carrossel ${i + 1}`,
          slides: c.slides ?? [],
        }))
      : [
          {
            ...(fallbackHero ?? { slides: [], slideDurationSeconds: 6, reduceMotion: true }),
            id: "default",
            name: "Carrossel padrão",
            isDefault: true,
          },
        ];

  // Guarantee exactly one default: keep the first one flagged; if none, the first
  // carousel becomes the default.
  let seenDefault = false;
  const normalized = base.map((c) => {
    if (c.isDefault && !seenDefault) {
      seenDefault = true;
      return { ...c, isDefault: true };
    }
    return { ...c, isDefault: false };
  });
  if (!seenDefault && normalized.length > 0) normalized[0].isDefault = true;
  return normalized;
}

/**
 * Normalize a content's carousels into a non-empty list with EXACTLY one default
 * (the perpetual fallback). Back-compat: when `heroCarousels` is missing/empty,
 * the single `content.hero` becomes the sole default carousel.
 */
export function carouselsOf(content: SiteContent): HeroCarousel[] {
  return normalizeCarousels(content.heroCarousels, content.hero);
}

/** The one default (perpetual) carousel — always present after `carouselsOf`. */
export function defaultCarousel(list: HeroCarousel[]): HeroCarousel {
  return list.find((c) => c.isDefault) ?? list[0];
}

/**
 * Pick the carousel on air at `now`. Among the candidates in window (the default
 * is always a candidate), the one that most recently went live wins: a started
 * schedule beats an unscheduled non-default beats the default. Never null when
 * the list is non-empty.
 */
const hasSlides = (c: HeroCarousel): boolean => (c.slides?.length ?? 0) > 0;

export function activeCarousel(list: HeroCarousel[], now: number): HeroCarousel | null {
  if (!list.length) return null;
  const score = (c: HeroCarousel): number => {
    if (c.isDefault) return Number.NEGATIVE_INFINITY;
    const s = ms(c.startAt);
    return s ?? -1; // non-default with no start sits just above the default
  };
  let best: HeroCarousel | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const c of list) {
    // A scheduled carousel only takes over when it's in window AND has slides —
    // an empty schedule must never blank out the (populated) default.
    if (!c.isDefault && (!inWindow(c, now) || !hasSlides(c))) continue;
    const sc = score(c);
    if (best === null || sc >= bestScore) {
      best = c;
      bestScore = sc;
    }
  }
  return best ?? defaultCarousel(list);
}

/**
 * The next schedule boundary strictly after `now` (a start or an end), so the
 * public component can re-evaluate the active carousel exactly on time (live swap
 * without a reload). Null when nothing else is scheduled.
 */
export function nextBoundary(list: HeroCarousel[], now: number): number | null {
  let next: number | null = null;
  for (const c of list) {
    for (const t of [ms(c.startAt), ms(c.endAt)]) {
      if (t !== null && t > now && (next === null || t < next)) next = t;
    }
  }
  return next;
}

/** Strip the scheduling metadata down to a plain `Hero` (for preload/back-compat). */
export function heroOf(c: HeroCarousel): Hero {
  return {
    slides: c.slides ?? [],
    slideDurationSeconds: c.slideDurationSeconds,
    reduceMotion: c.reduceMotion,
  };
}
