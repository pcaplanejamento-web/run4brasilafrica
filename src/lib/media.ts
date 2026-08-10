/**
 * Media library helpers, shared by the API routes (pure functions) and the ADM
 * UI (fetch helpers). The store is Cloudflare KV, served at `/api/media/<key>`.
 */

/** File extensions we treat as uploaded media (everything else in the KV
 *  namespace — e.g. `rl:` / `login:fail:` counters — is NOT media). */
export const MEDIA_EXT_RE = /\.(webp|jpe?g|png|gif|svg|mp4|webm|mov)$/i;

/** Video extensions (a subset of media). */
export const VIDEO_EXT_RE = /\.(mp4|webm|mov)$/i;

/** True when a KV key is an uploaded media file (not an anti-spam counter). */
export function isMediaKey(key: string): boolean {
  return MEDIA_EXT_RE.test(key);
}

/** True for uploaded videos. */
export function isVideoKey(key: string): boolean {
  return VIDEO_EXT_RE.test(key);
}

/** True for uploaded images (media that isn't a video). */
export function isImageKey(key: string): boolean {
  return isMediaKey(key) && !isVideoKey(key);
}

/** The media key from a served URL (`/api/media/<key>`), or null. */
export function extractMediaKey(url: string | undefined | null): string | null {
  if (!url) return null;
  const m = url.match(/\/api\/media\/([A-Za-z0-9._-]+)/);
  return m ? m[1] : null;
}

/**
 * Every media key referenced anywhere in a content object. Serializes the whole
 * object and scans for `/api/media/<key>` — so a file counts as "used" no matter
 * which field/edition/section holds it. Robust to model changes (no per-field
 * knowledge needed).
 */
export function usedMediaKeys(content: unknown): Set<string> {
  const used = new Set<string>();
  let json: string;
  try {
    json = JSON.stringify(content);
  } catch {
    return used;
  }
  const re = /\/api\/media\/([A-Za-z0-9._-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json)) !== null) used.add(m[1]);
  return used;
}

/**
 * Dentre `keys` (as chaves reais no armazenamento), quais aparecem no conteúdo —
 * por **substring exata da chave** no JSON serializado. Mais robusto que casar o
 * formato da URL: acha a chave referenciada de QUALQUER forma (com query string,
 * base diferente, dentro de outro campo). As chaves são longas e únicas
 * (`timestamp-hex.ext`), então não há colisão acidental. É a fonte única de
 * verdade do "em uso" no Armazenamento e da limpeza — sempre consistentes.
 */
export function usedKeysIn(content: unknown, keys: string[]): Set<string> {
  let json: string;
  try {
    json = JSON.stringify(content);
  } catch {
    return new Set();
  }
  return new Set(keys.filter((k) => json.includes(k)));
}

/** Mensagem única para a cota diária de operações do KV (plano free) estourada. */
export const KV_QUOTA_MESSAGE =
  "Limite diário de exclusões do Cloudflare (KV) atingido. Tente novamente após a virada do dia (00:00 UTC).";

/** True quando o erro é o limite diário de operações do KV (code 10048 / "usage limit"). */
export function isKvQuotaError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return (
    msg.includes("10048") ||
    msg.includes("usage limit") ||
    msg.includes("free usage limit") ||
    msg.includes("limit for this operation")
  );
}

/** Human file size (e.g. "182 KB"). */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ client */

export interface MediaItem {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
  uploadedAt: number | null;
}

export interface MediaListResult {
  ok: boolean;
  code?: string;
  items: MediaItem[];
  usedKeys: string[];
}

/** Fetch the media library (list + which keys are in use). */
export async function fetchMediaList(): Promise<MediaListResult> {
  try {
    const res = await fetch("/api/media", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as MediaListResult | null;
    if (!data) return { ok: false, items: [], usedKeys: [] };
    return { ...data, items: data.items ?? [], usedKeys: data.usedKeys ?? [] };
  } catch {
    return { ok: false, items: [], usedKeys: [] };
  }
}

/** Delete one media file by key. Devolve `ok` + a mensagem de erro (ex.: cota). */
export async function deleteMedia(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/media/${encodeURIComponent(key)}`, { method: "DELETE" });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (data?.ok) return { ok: true };
    return { ok: false, error: data?.error ?? "Não foi possível excluir." };
  } catch {
    return { ok: false, error: "Falha de conexão." };
  }
}

/**
 * Apaga TODOS os arquivos não referenciados, **em lotes** — o servidor deleta até
 * ~40 por requisição (limite de subrequests do Worker) e devolve `remaining`;
 * repetimos aqui até zerar. Para e reporta se a cota de KV estourar ou travar.
 */
export async function cleanupUnusedMedia(): Promise<{ ok: boolean; deleted: string[]; error?: string }> {
  const all: string[] = [];
  for (let i = 0; i < 200; i++) {
    let data: { ok?: boolean; error?: string; deleted?: string[]; remaining?: number } | null;
    try {
      const res = await fetch("/api/media/cleanup", { method: "POST" });
      data = (await res.json().catch(() => null)) as typeof data;
    } catch {
      return { ok: false, deleted: all, error: "Falha de conexão." };
    }
    if (!data) return { ok: false, deleted: all, error: "Resposta inválida do servidor." };
    all.push(...(data.deleted ?? []));
    if (!data.ok) return { ok: false, deleted: all, error: data.error ?? "Não foi possível limpar." };
    const remaining = data.remaining ?? 0;
    if (remaining === 0) return { ok: true, deleted: all }; // acabou
    if ((data.deleted?.length ?? 0) === 0) {
      // não apagou nada mas ainda há órfãos → travou (evita loop infinito)
      return { ok: false, deleted: all, error: "Não foi possível remover alguns arquivos." };
    }
  }
  return { ok: true, deleted: all };
}
