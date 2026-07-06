import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { seedContent } from "./seed";
import type { SiteContent } from "./types";

/**
 * Backend storage = Cloudflare Workers KV (binding CONTENT_KV in wrangler.jsonc).
 * The whole SiteContent lives under one key. Falls back to the seed whenever the
 * binding is unavailable (e.g. `next dev` outside the Worker), so the app always
 * works.
 */

const KEY = "content";

export type ContentSource = "backend" | "seed" | "unset" | "error";

interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

function getKV(): KVLike | null {
  try {
    const { env } = getCloudflareContext();
    const kv = (env as Record<string, unknown>).CONTENT_KV;
    return (kv as KVLike) ?? null;
  } catch {
    return null;
  }
}

function merge(stored: Partial<SiteContent> | null): SiteContent {
  return stored ? { ...seedContent, ...stored } : seedContent;
}

export async function kvReadContent(): Promise<{
  content: SiteContent;
  source: ContentSource;
}> {
  const kv = getKV();
  if (!kv) return { content: seedContent, source: "unset" };
  try {
    const raw = await kv.get(KEY);
    if (!raw) return { content: seedContent, source: "seed" };
    return { content: merge(JSON.parse(raw) as Partial<SiteContent>), source: "backend" };
  } catch {
    return { content: seedContent, source: "error" };
  }
}

/** Returns true when written to KV, false when no binding (local dev). */
export async function kvWriteContent(content: SiteContent): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  await kv.put(KEY, JSON.stringify(content));
  return true;
}

export async function kvResetContent(): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  await kv.delete(KEY);
  return true;
}
