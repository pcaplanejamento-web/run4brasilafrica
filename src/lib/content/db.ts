import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
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

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Like {
  prepare(query: string): D1Statement;
}

function getDB(): D1Like | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as Record<string, unknown>).CONTENT_DB;
    return (db as D1Like) ?? null;
  } catch {
    return null;
  }
}

function merge(stored: Partial<SiteContent> | null): SiteContent {
  return stored ? { ...seedContent, ...stored } : seedContent;
}

export async function readContent(): Promise<{
  content: SiteContent;
  source: ContentSource;
}> {
  const db = getDB();
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
