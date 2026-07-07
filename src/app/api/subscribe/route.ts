import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public: register an e-mail ("avise-me quando abrir o lote"). */
export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, error: "e-mail inválido" }, { status: 400 });
  }

  try {
    await db
      .prepare("INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?1, ?2)")
      .bind(email, new Date().toISOString())
      .run();
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao registrar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Admin: list all e-mails. */
export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }
  const { results } = await db
    .prepare("SELECT id, email, created_at FROM subscribers ORDER BY id DESC")
    .all<{ id: number; email: string; created_at: string }>();
  return NextResponse.json({ ok: true, subscribers: results });
}

/** Admin: remove one e-mail by id. */
export async function DELETE(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (id) await db.prepare("DELETE FROM subscribers WHERE id = ?1").bind(Number(id)).run();
  return NextResponse.json({ ok: true });
}
