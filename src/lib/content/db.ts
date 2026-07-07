import "server-only";
import { getDB, getDBAsync, type D1Like } from "@/lib/cf";
import { seedContent } from "./seed";
import type { SiteContent } from "./types";

/**
 * Backend storage = Cloudflare D1 (binding CONTENT_DB in wrangler.jsonc).
 *
 * D1 is strongly consistent, so a read right after a write reflects it for
 * everyone (unlike KV's ~60s propagation). The whole SiteContent lives as one
 * JSON row (id = 1). Falls back to the seed when the binding is unavailable
 * (e.g. `next dev` outside the Worker).
 */

export type ContentSource = "backend" | "seed" | "unset" | "error";

function merge(stored: Partial<SiteContent> | null): SiteContent {
  return stored ? { ...seedContent, ...stored } : seedContent;
}

async function readFrom(
  db: D1Like | null,
): Promise<{ content: SiteContent; source: ContentSource }> {
  if (!db) return { content: seedContent, source: "unset" };
  try {
    const row = await db
      .prepare("SELECT json FROM content WHERE id = 1")
      .first<string>("json");
    if (!row) return { content: seedContent, source: "seed" };
    return { content: merge(JSON.parse(row) as Partial<SiteContent>), source: "backend" };
  } catch {
    return { content: seedContent, source: "error" };
  }
}

/** Read content using the sync binding (route handlers). */
export async function readContent(): Promise<{
  content: SiteContent;
  source: ContentSource;
}> {
  return readFrom(getDB());
}

/** Read content using the async binding — safe during RSC/SSG render. */
export async function readContentAsync(): Promise<{
  content: SiteContent;
  source: ContentSource;
}> {
  return readFrom(await getDBAsync());
}

/** Returns true when written, false when no binding (local dev). */
export async function writeContent(content: SiteContent): Promise<boolean> {
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
