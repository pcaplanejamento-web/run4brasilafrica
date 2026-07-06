import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Minimal D1 typings (we don't depend on @cloudflare/workers-types). */
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
export interface D1Like {
  prepare(query: string): D1Statement;
}

/**
 * The D1 binding (CONTENT_DB), or null when unavailable (e.g. `next dev` outside
 * the Worker). Reliable inside route handlers; do NOT rely on it during RSC
 * render (OpenNext limitation).
 */
export function getDB(): D1Like | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as Record<string, unknown>).CONTENT_DB;
    return (db as D1Like) ?? null;
  } catch {
    return null;
  }
}
