import "server-only";
import { seedContent } from "./seed";
import type { SiteContent } from "./types";

/**
 * Server-side content fetch. Talks to the Apps Script Web App directly (no CORS
 * concerns on the server) and always falls back to the seed so the site renders
 * even when the backend is unset or unreachable.
 *
 * `source` tells callers where the content came from:
 *   - "backend": loaded from Apps Script
 *   - "seed":    backend has no content yet (returned null) — using defaults
 *   - "unset":   GAS_WEB_APP_URL not configured
 *   - "error":   backend configured but the request failed
 */
export type ContentSource = "backend" | "seed" | "unset" | "error";

export interface FetchedContent {
  content: SiteContent;
  source: ContentSource;
  error?: string;
}

/** Shallow-merge stored content over the seed so newly-added keys keep defaults. */
function merge(stored: Partial<SiteContent> | null | undefined): SiteContent {
  return stored ? { ...seedContent, ...stored } : seedContent;
}

export async function getPublishedContent(
  opts: { revalidateSeconds?: number } = {},
): Promise<FetchedContent> {
  const url = process.env.GAS_WEB_APP_URL;
  if (!url) return { content: seedContent, source: "unset" };

  const revalidate = opts.revalidateSeconds ?? 30;

  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { content: seedContent, source: "error", error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { ok?: boolean; content?: Partial<SiteContent> | null };
    if (data?.content) return { content: merge(data.content), source: "backend" };
    return { content: seedContent, source: "seed" };
  } catch (err) {
    return { content: seedContent, source: "error", error: String(err) };
  }
}
