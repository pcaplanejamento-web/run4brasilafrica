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

/** Delete one media file by key. */
export async function deleteMedia(key: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/media/${encodeURIComponent(key)}`, { method: "DELETE" });
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return !!data?.ok;
  } catch {
    return false;
  }
}

/** Delete every media file not referenced by any content. Returns deleted keys. */
export async function cleanupUnusedMedia(): Promise<{ ok: boolean; deleted: string[]; error?: string }> {
  try {
    const res = await fetch("/api/media/cleanup", { method: "POST" });
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; deleted?: string[]; error?: string }
      | null;
    if (!data) return { ok: false, deleted: [] };
    return { ok: !!data.ok, deleted: data.deleted ?? [], error: data.error };
  } catch {
    return { ok: false, deleted: [], error: "Falha de conexão." };
  }
}
