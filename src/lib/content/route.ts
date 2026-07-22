import type { Edition, SiteContent, StoredContent } from "./types";
import { activeEdition } from "./editions";

/** Chaves por-edição roteadas para `editions[selecionada]`. Inclui TODA a config
 *  do site (marca/tema/contato/organizadores/privacidade/integrações) + identidade
 *  + seções. As chaves-espelho de seção (hero/stats/inscricao/…) são DERIVADAS dos
 *  blocos no `resolveEdition` — não se persistem separadamente; um patch com elas
 *  é ignorado aqui. */
export const EDITION_FIELDS: readonly (keyof Edition)[] = [
  "event",
  "branding",
  "theme",
  "cloudinary",
  "analytics",
  "contact",
  "organizers",
  "privacy",
  "layout",
  "customSections",
];

/** Chaves globais roteadas para o topo. Só sobra o `log` (a coleção `editions`
 *  é tratada à parte). Toda a config do site agora é por-edição. */
export const GLOBAL_FIELDS: readonly (keyof StoredContent)[] = ["log"];

/**
 * Aplica um `patch` (forma de `SiteContent`) sobre o conteúdo cru roteando cada
 * chave: `editions` substitui a coleção; globais vão para o topo; por-edição vão
 * para a edição `editionId` (ou a ativa). Chaves-espelho derivadas são ignoradas.
 * Puro — não muta `base` nem toca no `log` (o store carimba o log à parte).
 */
export function routePatch(
  base: StoredContent,
  editionId: string | null,
  patch: Partial<SiteContent>,
): StoredContent {
  const next: StoredContent = { ...base };
  const patchRec = patch as Record<string, unknown>;

  if ("editions" in patch && patch.editions) {
    next.editions = patch.editions as Edition[];
  }

  const nextRec = next as unknown as Record<string, unknown>;
  for (const k of GLOBAL_FIELDS) {
    if (k in patch) nextRec[k] = patchRec[k];
  }

  const editionPatch: Record<string, unknown> = {};
  for (const k of EDITION_FIELDS) {
    if (k in patch) editionPatch[k] = patchRec[k];
  }
  if (Object.keys(editionPatch).length && next.editions.length) {
    const target = editionId ?? activeEdition(next)?.id ?? next.editions[0].id;
    next.editions = next.editions.map((e) => (e.id === target ? { ...e, ...editionPatch } : e));
  }
  return next;
}
