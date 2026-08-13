import { NextResponse } from "next/server";
import { getDB, type D1Like } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";

/**
 * **Métricas** do site (Cloudflare D1). `POST` público registra um **acesso**
 * (`kind:"visit"`) ou um **download** de card (`kind:"download"` + atleta do card).
 * `GET` (admin) devolve o resumo: total de acessos, total de fotos baixadas, a
 * série por dia e os atletas cujas imagens foram baixadas (nome, nº, categoria,
 * quantidade, última vez). As tabelas são criadas **em runtime** (idempotente),
 * então não é preciso rodar migração à mão. Sem privacidade do usuário que baixa —
 * guardamos só os dados do card (resultado público).
 */

export const dynamic = "force-dynamic";

// Cria as tabelas uma vez por isolate (idempotente; barato). Se falhar, tenta de novo.
let schemaReady = false;
async function ensureSchema(db: D1Like): Promise<void> {
  if (schemaReady) return;
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS metric_counters (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0)",
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS metric_daily (day TEXT NOT NULL, kind TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind))",
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS athlete_downloads (akey TEXT PRIMARY KEY, name TEXT NOT NULL, bib TEXT, category TEXT, count INTEGER NOT NULL DEFAULT 0, last_at INTEGER NOT NULL)",
  ).run();
  schemaReady = true;
}

/** Dia atual em UTC (YYYY-MM-DD). */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normaliza texto p/ compor a identidade do atleta (sem acento, minúsculo). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface AthletePayload {
  name?: unknown;
  bib?: unknown;
  category?: unknown;
}

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  let body: { kind?: unknown; athlete?: AthletePayload; format?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }
  const kind = body.kind === "visit" ? "visit" : body.kind === "download" ? "download" : null;
  if (!kind) return NextResponse.json({ ok: false, error: "kind inválido" }, { status: 400 });

  try {
    await ensureSchema(db);
    const day = todayUtc();
    const counterKey = kind === "visit" ? "visits" : "downloads";

    await db
      .prepare("INSERT INTO metric_counters (key, count) VALUES (?1, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1")
      .bind(counterKey)
      .run();
    await db
      .prepare("INSERT INTO metric_daily (day, kind, count) VALUES (?1, ?2, 1) ON CONFLICT(day, kind) DO UPDATE SET count = count + 1")
      .bind(day, kind)
      .run();

    if (kind === "download") {
      const a = body.athlete ?? {};
      const name = String(a.name ?? "").trim().slice(0, 120);
      const bib = String(a.bib ?? "").trim().slice(0, 40);
      const category = String(a.category ?? "").trim().slice(0, 80);
      if (name || bib) {
        // Identidade estável: nº (se houver) ou nome, + categoria.
        const akey = `${bib ? `bib:${norm(bib)}` : `name:${norm(name)}`}|${norm(category)}`;
        await db
          .prepare(
            "INSERT INTO athlete_downloads (akey, name, bib, category, count, last_at) VALUES (?1, ?2, ?3, ?4, 1, ?5) " +
              "ON CONFLICT(akey) DO UPDATE SET count = count + 1, last_at = ?5, name = ?2, bib = ?3, category = ?4",
          )
          .bind(akey, name, bib, category, Date.now())
          .run();
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("metrics POST failed:", err);
    return NextResponse.json({ ok: false, error: "erro ao registrar" }, { status: 502 });
  }
}

export async function GET() {
  const db = getDB();
  if (!db) {
    return NextResponse.json({ ok: false, code: "not_configured", visits: 0, downloads: 0, athletes: [], daily: [] });
  }
  // Basta uma sessão de admin (padrão leve, como subscribe/results).
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  try {
    await ensureSchema(db);
    const counters = await db
      .prepare("SELECT key, count FROM metric_counters")
      .all<{ key: string; count: number }>();
    let visits = 0;
    let downloads = 0;
    for (const r of counters.results ?? []) {
      if (r.key === "visits") visits = r.count;
      else if (r.key === "downloads") downloads = r.count;
    }

    const athletes = await db
      .prepare("SELECT name, bib, category, count, last_at FROM athlete_downloads ORDER BY count DESC, last_at DESC LIMIT 500")
      .all<{ name: string; bib: string; category: string; count: number; last_at: number }>();

    const daily = await db
      .prepare("SELECT day, kind, count FROM metric_daily ORDER BY day DESC LIMIT 60")
      .all<{ day: string; kind: string; count: number }>();

    return NextResponse.json({
      ok: true,
      visits,
      downloads,
      athletes: athletes.results ?? [],
      daily: daily.results ?? [],
    });
  } catch (err) {
    console.error("metrics GET failed:", err);
    return NextResponse.json({ ok: false, error: "erro ao ler" }, { status: 502 });
  }
}
