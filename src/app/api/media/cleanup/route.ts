import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";
import { readContent } from "@/lib/content/db";
import { isKvQuotaError, isMediaKey, KV_QUOTA_MESSAGE, usedKeysIn } from "@/lib/media";

export const dynamic = "force-dynamic";

// Quantos deletes no MÁXIMO por requisição. O Worker tem limite de subrequests
// (~50 no plano free): 1 leitura de conteúdo + 1 list + N deletes precisa caber.
// O cliente chama de novo em lote até zerar (ver `cleanupUnusedMedia`).
const DELETE_CAP = 40;

/**
 * Apaga, EM LOTE, arquivos de mídia que NÃO são referenciados em nenhuma edição.
 * Admin-only e conservador: só remove órfãos reais (varre o conteúdo). Devolve
 * `remaining` (órfãos ainda restantes) para o cliente repetir sem estourar o
 * limite de subrequests; e sinaliza `code: "quota"` quando a cota de delete do KV
 * estoura (para a UI explicar, em vez de falhar em silêncio).
 */
export async function POST() {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured", deleted: [] });
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  // Fonte da verdade do "em uso": o blob de conteúdo inteiro (todas as edições).
  let content: unknown;
  try {
    ({ content } = await readContent());
  } catch {
    // Sem conseguir ler o conteúdo, não apaga nada (evita remover arquivo em uso).
    return NextResponse.json({ ok: false, error: "não foi possível ler o conteúdo", deleted: [] });
  }

  // Todas as chaves de mídia no KV (paginado), depois os órfãos = as que NÃO
  // aparecem no conteúdo (substring exata — mesma lógica do selo "em uso").
  const allKeys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ cursor, limit: 1000 });
    for (const k of page.keys) if (isMediaKey(k.name)) allKeys.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const used = usedKeysIn(content, allKeys);
  const orphans = allKeys.filter((k) => !used.has(k));

  // Só um LOTE por requisição (subrequest budget). Deletes em paralelo (allSettled
  // → best-effort). Se a cota de KV estourar, para e avisa.
  const batch = orphans.slice(0, DELETE_CAP);
  const settled = await Promise.allSettled(batch.map((k) => kv.delete(k)));
  const deleted = batch.filter((_, i) => settled[i].status === "fulfilled");
  const failures = settled.filter((s) => s.status === "rejected") as PromiseRejectedResult[];
  const quota = failures.some((f) => isKvQuotaError(f.reason));
  if (failures.length && !quota) {
    console.error("media cleanup: falhas ao excluir:", failures.length, failures[0]?.reason);
  }

  const remaining = orphans.length - deleted.length; // órfãos ainda presentes

  if (quota && deleted.length === 0) {
    return NextResponse.json(
      { ok: false, code: "quota", error: KV_QUOTA_MESSAGE, deleted, remaining },
      { status: 429 },
    );
  }
  return NextResponse.json({ ok: true, deleted, remaining, quota });
}
