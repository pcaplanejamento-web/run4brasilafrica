import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";
import type { RaceResultRow } from "@/lib/content/types";

export const dynamic = "force-dynamic";

/** Escrita só para admin autenticado (offline/dev: sem binding → auth aberta). */
async function requireAdmin() {
  return !(authConfigured() && !(await getSessionUser()));
}

/** Chave no KV a partir do id da categoria (bloqueia path traversal / varredura). */
function keyFor(cat: string | null): string | null {
  const id = (cat || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return id ? `results/${id}.json` : null;
}

/** Limites defensivos (uma planilha grande de corrida). */
const MAX_ROWS = 20000;

/** Público: lê as linhas de uma categoria (`?cat=<id>`). */
export async function GET(req: Request) {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured", rows: [] });

  const key = keyFor(new URL(req.url).searchParams.get("cat"));
  if (!key) return NextResponse.json({ ok: false, error: "categoria inválida" }, { status: 400 });

  const rows = (await kv.get(key, "json")) as RaceResultRow[] | null;
  if (!rows) return NextResponse.json({ ok: false, rows: [] }, { status: 404 });
  return NextResponse.json(
    { ok: true, rows },
    { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

/** Admin: grava as linhas de uma categoria. Corpo `{ cat, rows }`. */
export async function POST(req: Request) {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured" });
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  let body: { cat?: string; rows?: unknown };
  try {
    body = (await req.json()) as { cat?: string; rows?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }

  const key = keyFor(body.cat ?? null);
  if (!key) return NextResponse.json({ ok: false, error: "categoria inválida" }, { status: 400 });
  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ ok: false, error: "linhas ausentes" }, { status: 400 });
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ ok: false, error: "planilha muito grande" }, { status: 413 });
  }

  const count = body.rows.length;
  try {
    await kv.put(key, JSON.stringify(body.rows), {
      metadata: { count, updatedAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error("[api/results] put failed:", err);
    return NextResponse.json({ ok: false, error: "falha ao salvar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count });
}

/** Admin: remove as linhas de uma categoria (`?cat=<id>`). */
export async function DELETE(req: Request) {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured" });
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }
  const key = keyFor(new URL(req.url).searchParams.get("cat"));
  if (key) {
    try {
      await kv.delete(key);
    } catch (err) {
      console.error("[api/results] delete failed:", err);
    }
  }
  return NextResponse.json({ ok: true });
}
