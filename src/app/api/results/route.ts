import { NextResponse } from "next/server";
import { getMediaKV, getDB } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";
import type { RaceResultRow } from "@/lib/content/types";
import type { D1Like } from "@/lib/cf";

export const dynamic = "force-dynamic";

/**
 * Resultados por categoria. **Armazenamento em D1** (tabela `results`) — o KV
 * gratuito tem cota diária de gravação baixa (1k/dia) que estoura no dia da prova
 * e faz o upload falhar ("falha ao salvar"). D1 não tem essa cota. Mantemos a
 * LEITURA do KV como *fallback* para categorias antigas ainda não regravadas.
 */

/** Escrita só para admin autenticado (offline/dev: sem binding → auth aberta). */
async function requireAdmin() {
  return !(authConfigured() && !(await getSessionUser()));
}

/** Id sanitizado da categoria (bloqueia path traversal / chaves inválidas). */
function catId(cat: string | null): string | null {
  const id = (cat || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return id || null;
}
/** Chave legada no KV (fallback de leitura). */
function kvKey(id: string): string {
  return `results/${id}.json`;
}

/** Limite defensivo (uma planilha grande de corrida). */
const MAX_ROWS = 20000;

const READ_HEADERS = { "cache-control": "public, max-age=60, stale-while-revalidate=300" };

/** Cria a tabela de resultados se ainda não existir (idempotente). */
async function ensureTable(db: D1Like): Promise<void> {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS results (cat TEXT PRIMARY KEY, json TEXT NOT NULL, count INTEGER, updated_at TEXT)",
    )
    .run();
}

/** Público: lê as linhas de uma categoria (`?cat=<id>`). D1 primeiro, KV depois. */
export async function GET(req: Request) {
  const id = catId(new URL(req.url).searchParams.get("cat"));
  if (!id) return NextResponse.json({ ok: false, error: "categoria inválida" }, { status: 400 });

  // 1) D1 (fonte nova). Se a tabela ainda não existe, o SELECT lança → cai para o KV.
  const db = getDB();
  if (db) {
    try {
      const row = await db
        .prepare("SELECT json FROM results WHERE cat = ?1")
        .bind(id)
        .first<{ json: string }>();
      if (row?.json) {
        const rows = JSON.parse(row.json) as unknown;
        if (Array.isArray(rows)) return NextResponse.json({ ok: true, rows }, { headers: READ_HEADERS });
      }
    } catch (err) {
      console.error("[api/results] d1 get failed:", err);
    }
  }

  // 2) Fallback KV (dados antigos ainda não regravados em D1).
  const kv = getMediaKV();
  if (kv) {
    try {
      const rows = (await kv.get(kvKey(id), "json")) as RaceResultRow[] | null;
      if (Array.isArray(rows)) return NextResponse.json({ ok: true, rows }, { headers: READ_HEADERS });
    } catch (err) {
      console.error("[api/results] kv get failed:", err);
    }
  }

  return NextResponse.json({ ok: false, rows: [] }, { status: 404 });
}

/** Admin: grava as linhas de uma categoria em D1. Corpo `{ cat, rows }`. */
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  let body: { cat?: string; rows?: unknown };
  try {
    body = (await req.json()) as { cat?: string; rows?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }

  const id = catId(body.cat ?? null);
  if (!id) return NextResponse.json({ ok: false, error: "categoria inválida" }, { status: 400 });
  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ ok: false, error: "linhas ausentes" }, { status: 400 });
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ ok: false, error: "planilha muito grande" }, { status: 413 });
  }

  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  const count = body.rows.length;
  try {
    await ensureTable(db);
    await db
      .prepare(
        "INSERT INTO results (cat, json, count, updated_at) VALUES (?1, ?2, ?3, ?4) " +
          "ON CONFLICT(cat) DO UPDATE SET json = ?2, count = ?3, updated_at = ?4",
      )
      .bind(id, JSON.stringify(body.rows), count, new Date().toISOString())
      .run();
  } catch (err) {
    console.error("[api/results] d1 put failed:", err);
    return NextResponse.json({ ok: false, error: "falha ao salvar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count });
}

/** Admin: remove as linhas de uma categoria (`?cat=<id>`). D1 + KV (best-effort). */
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }
  const id = catId(new URL(req.url).searchParams.get("cat"));
  if (!id) return NextResponse.json({ ok: true });

  const db = getDB();
  if (db) {
    try {
      await ensureTable(db);
      await db.prepare("DELETE FROM results WHERE cat = ?1").bind(id).run();
    } catch (err) {
      console.error("[api/results] d1 delete failed:", err);
    }
  }
  // Remove também a cópia legada no KV (pode falhar por cota — tudo bem).
  const kv = getMediaKV();
  if (kv) {
    try {
      await kv.delete(kvKey(id));
    } catch {
      /* cota de delete do KV pode estar esgotada — ignorar */
    }
  }
  return NextResponse.json({ ok: true });
}
