/**
 * Datas do evento em fuso fixo de Brasília (UTC−03:00).
 *
 * Os campos `datetime-local` do ADM gravam strings SEM fuso ("YYYY-MM-DDTHH:MM").
 * `new Date(str)` interpreta isso no fuso do runtime — **UTC** no Cloudflare
 * Worker (SSR/ISR) e no fuso do visitante no cliente. Isso fazia servidor,
 * cliente e o arquivo .ics (que fixava −03:00) discordarem em ~3h nas viradas de
 * lote/contagem/carrossel. Aqui tudo é ancorado em −03:00 (o Brasil não tem mais
 * horário de verão desde 2019), então todos concordam.
 */
const BR_OFFSET_H = 3;

/** Época (ms) de uma string do ADM, ancorada em −03:00. `null` se vazia/inválida. */
export function parseBR(s: string | undefined | null): number | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) {
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const [, y, mo, d, h, min] = m;
  return Date.UTC(+y, +mo - 1, +d, +(h ?? 0) + BR_OFFSET_H, +(min ?? 0));
}

/** DD/MM/YYYY a partir do início da string (SSR-safe, sem Date). */
export function fmtDate(iso: string | undefined | null): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 && p[0] ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

/** DD/MM (rótulos compactos). */
export function fmtShort(iso: string | undefined | null): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 && p[0] ? `${p[2]}/${p[1]}` : "";
}

export interface CountdownParts {
  d: number;
  h: number;
  m: number;
  s: number;
}

/** Partes da contagem regressiva de `target` (string do ADM) até `nowMs`.
 *  `null` quando já passou ou a data é inválida. */
export function countdown(
  target: string | undefined | null,
  nowMs: number,
): CountdownParts | null {
  const t = parseBR(target);
  if (t === null) return null;
  const diff = t - nowMs;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}
