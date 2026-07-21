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
 * allowed and `false` when the caller exceeded `limit` within `windowSec`.
 *
 * A janela é **fixa**: guardamos o fim dela (`exp`) no valor, então o contador
 * só zera quando a janela realmente termina — não "desliza" a cada acesso (o que
 * antes podia bloquear um usuário lento porém legítimo, cujo TTL nunca expirava).
 * Não é atômico (KV é read-modify-write, sem incremento atômico e com leitura
 * eventualmente consistente ~60s) — dois POSTs simultâneos podem ler o mesmo `n`;
 * é um limitador *best-effort* adequado a um site de baixo tráfego. Para garantia
 * forte usaríamos Durable Objects / Rate Limiting API. No-op quando não há KV
 * (dev local). Chaves expiram sozinhas por TTL.
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
    const nowSec = Math.floor(Date.now() / 1000);
    const rec = (await kv.get(key, "json")) as { n: number; exp: number } | null;
    // Dentro da janela atual? (se `exp` já passou, começa uma janela nova.)
    const inWindow = !!rec && typeof rec.exp === "number" && rec.exp > nowSec;
    const exp = inWindow ? rec!.exp : nowSec + windowSec;
    const n = (inWindow ? rec!.n : 0) + 1;
    if (n > limit) return false;
    // TTL mínimo do KV é 60s; o `exp` guardado é a verdade sobre a janela.
    const ttl = Math.max(60, exp - nowSec);
    await kv.put(key, JSON.stringify({ n, exp }), { expirationTtl: ttl });
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
