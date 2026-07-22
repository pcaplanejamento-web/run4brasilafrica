import "server-only";
import { cache } from "react";
import { getDB, getDBAsync, type D1Like } from "@/lib/cf";
import { seedContent } from "./seed";
import { normalizeContent } from "./migrate";
import { resolveEdition } from "./resolve";
import type { SiteContent, StoredContent } from "./types";

/** Seed migrado para o modelo multi-tenant (`StoredContent`: globais + edições). */
const seedStored = normalizeContent(seedContent);

/**
 * Backend storage = Cloudflare D1 (binding CONTENT_DB in wrangler.jsonc).
 *
 * D1 is strongly consistent, so a read right after a write reflects it for
 * everyone (unlike KV's ~60s propagation). O conteúdo **persistido** é um
 * `StoredContent` (globais + `editions[]`) numa única linha JSON (id = 1). A
 * "view" pública/ADM de uma edição vem de `resolveEdition`. Falls back to the
 * seed when the binding is unavailable (e.g. `next dev` outside the Worker).
 */

export type ContentSource = "backend" | "seed" | "unset" | "error";

/** Mescla o conteúdo gravado com o seed: globais faltantes vêm do seed; as
 *  edições vêm do gravado (ou do seed quando não há nenhuma). Normaliza (migra
 *  formato antigo → multi-tenant) de forma idempotente. */
function merge(stored: Partial<SiteContent> | null): StoredContent {
  if (!stored) return seedStored;
  const s = normalizeContent(stored);
  return {
    ...seedStored,
    ...s,
    editions: s.editions?.length ? s.editions : seedStored.editions,
  };
}

async function readFrom(
  db: D1Like | null,
): Promise<{ content: StoredContent; source: ContentSource }> {
  if (!db) return { content: seedStored, source: "unset" };
  try {
    const row = await db
      .prepare("SELECT json FROM content WHERE id = 1")
      .first<string>("json");
    if (!row) return { content: seedStored, source: "seed" };
    return { content: merge(JSON.parse(row) as Partial<SiteContent>), source: "backend" };
  } catch {
    return { content: seedStored, source: "error" };
  }
}

/** Read raw stored content using the sync binding (route handlers). */
export async function readContent(): Promise<{
  content: StoredContent;
  source: ContentSource;
}> {
  return readFrom(getDB());
}

/** Read raw stored content using the async binding — safe during RSC/SSG render. */
export async function readContentAsync(): Promise<{
  content: StoredContent;
  source: ContentSource;
}> {
  return readFrom(await getDBAsync());
}

/**
 * The live content (view resolvida de UMA edição) para o render do servidor,
 * **deduped per request** via React `cache()` — layout (theme + metadata) and the
 * page all share one D1 read. `editionId` ausente → edição **ativa** (o que o
 * público vê). Falls back to the seed on any failure.
 */
export const getSiteContent = cache(async (editionId?: string): Promise<SiteContent> => {
  try {
    const { content } = await readContentAsync();
    return resolveEdition(content, editionId);
  } catch {
    return resolveEdition(seedStored, editionId);
  }
});

/** Returns true when written, false when no binding (local dev). */
export async function writeContent(content: StoredContent): Promise<boolean> {
  const db = getDB();
  if (!db) return false;
  await db
    .prepare(
      "INSERT INTO content (id, json) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET json = ?1",
    )
    .bind(JSON.stringify(content))
    .run();
  return true;
}

export async function resetContent(): Promise<boolean> {
  const db = getDB();
  if (!db) return false;
  await db.prepare("DELETE FROM content WHERE id = 1").run();
  return true;
}
