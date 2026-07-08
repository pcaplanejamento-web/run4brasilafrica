import "server-only";
import { getMediaKV } from "./cf";

/** Best-effort client IP (Cloudflare sets CF-Connecting-IP on every request). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("CF-Connecting-IP") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Fixed-window rate limit backed by KV. Returns `true` when the request is
 * allowed and `false` when the caller has exceeded `limit` within `windowSec`.
 * No-ops (allows) when KV is unavailable (local dev). Keys auto-expire via TTL,
 * so there's nothing to clean up.
 */
export async function allowRequest(
  bucket: string,
  id: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const kv = getMediaKV();
  if (!kv) return true; // no binding (e.g. `next dev` outside the Worker)
  const key = `rl:${bucket}:${id}`;
  try {
    const rec = (await kv.get(key, "json")) as { n: number } | null;
    const n = (rec?.n ?? 0) + 1;
    if (n > limit) return false;
    await kv.put(key, JSON.stringify({ n }), { expirationTtl: windowSec });
    return true;
  } catch {
    return true; // never block a real user because KV hiccuped
  }
}

/**
 * Honeypot check: a hidden form field that real users never see or fill, but
 * naive bots do. When it's non-empty, treat the submission as spam.
 */
export function isHoneypotTripped(body: { website?: unknown }): boolean {
  return typeof body.website === "string" && body.website.trim().length > 0;
}
