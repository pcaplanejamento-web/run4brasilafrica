/**
 * Código de autenticação do certificado — **determinístico** e compartilhado
 * pelo cliente (geração/exibição) e pelo servidor (verificação em `/api/verify-cert`),
 * garantindo que o mesmo atleta produza sempre o mesmo código.
 */

import type { CustomSection, RaceResultRow } from "@/lib/content/types";

/** Semente do código: nome | número | colocação | categoria. */
export function certSeed(
  row: Pick<RaceResultRow, "name" | "bib" | "pos">,
  categoryLabel: string,
): string {
  return `${row.name}|${row.bib ?? ""}|${row.pos}|${categoryLabel}`;
}

/** Código curto (`R4B-XXXXXX`) a partir da semente. */
export function certVerifyCode(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `R4B-${h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

/** Normaliza um código digitado (aceita com/sem prefixo, espaços, minúsculas). */
export function normalizeCertCode(input: string): string {
  const s = (input || "").toUpperCase().replace(/[\s]/g, "").replace(/^R4B-?/, "");
  return s ? `R4B-${s.slice(0, 6)}` : "";
}

/** Categorias de classificação (id + rótulo) a partir das seções da edição. */
export function classificacaoCats(sections: CustomSection[] | undefined): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const s of sections ?? []) {
    for (const b of s.blocks ?? []) {
      if (b.type === "classificacao") {
        for (const c of b.classificacao?.categories ?? []) {
          if (c.id) out.push({ id: c.id, label: c.label });
        }
      }
    }
  }
  return out;
}
