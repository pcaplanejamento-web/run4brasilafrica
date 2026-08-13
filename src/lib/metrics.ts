/**
 * Cliente de **métricas** (sem servidor): registra acessos e downloads via
 * `POST /api/metrics`. Fire-and-forget (`keepalive`) — nunca bloqueia nem quebra
 * a UI. O acesso conta **1× por sessão** (sessionStorage) para não inflar em
 * reloads/navegação. Os dados do atleta enviados no download são os do card
 * (resultado público): nome, número e categoria — nada do usuário que baixa.
 */

export interface AthleteMeta {
  name: string;
  bib?: string;
  category?: string;
}

const VISIT_FLAG = "r4ba:visit";

function send(body: unknown): void {
  if (typeof fetch === "undefined") return;
  try {
    fetch("/api/metrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Registra 1 acesso por sessão do navegador (evita recontar em reload/SPA). */
export function trackVisit(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(VISIT_FLAG)) return;
    sessionStorage.setItem(VISIT_FLAG, "1");
  } catch {
    /* modo privado → segue e conta mesmo assim */
  }
  send({ kind: "visit" });
}

/** Registra o download/compartilhamento de um card, com o atleta do card. */
export function trackDownload(athlete: AthleteMeta, format?: string): void {
  if (!athlete?.name && !athlete?.bib) return;
  send({ kind: "download", athlete, format });
}
