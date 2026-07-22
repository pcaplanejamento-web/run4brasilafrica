import type { Edition, StoredContent } from "./types";

type WithEditions = Pick<StoredContent, "editions">;

/**
 * A edição **ativa** — a de `status: "Ativa"`; sem uma marcada, a de maior ano;
 * lista vazia → `null`. É a que o público vê. Cada edição carrega seu próprio
 * `event`/`layout`/`customSections` (ver `resolveEdition`).
 */
export function activeEdition(c: WithEditions): Edition | null {
  const eds = c.editions ?? [];
  return (
    eds.find((e) => e.status === "Ativa") ??
    [...eds].sort(
      (a, b) => (Number(b.event?.editionYear) || 0) - (Number(a.event?.editionYear) || 0),
    )[0] ??
    null
  );
}

/** Edição por id, com fallback para a ativa. */
export function editionById(c: WithEditions, id?: string): Edition | null {
  const eds = c.editions ?? [];
  return (id ? eds.find((e) => e.id === id) : null) ?? activeEdition(c);
}

/** Rótulo padronizado da edição (ex.: "Run4BrasilAfrica 2026"). */
export function editionLabelFor(e: Edition | null | undefined): string {
  return e ? `${e.event.brandName} ${e.event.editionYear}`.trim() : "";
}

/** Rótulo da edição ativa. */
export function editionLabel(c: WithEditions): string {
  return editionLabelFor(activeEdition(c));
}
