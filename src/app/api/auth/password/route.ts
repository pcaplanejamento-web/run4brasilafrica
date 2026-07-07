import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const current = body.currentPassword ?? "";
  const next = body.newPassword ?? "";
  if (next.length < 6) {
    return NextResponse.json({ ok: false, error: "nova senha: mín. 6 caracteres" }, { status: 400 });
  }

  const row = await db
    .prepare("SELECT password_hash FROM users WHERE id = ?1")
    .bind(me.id)
    .first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return NextResponse.json({ ok: false, error: "senha atual incorreta" }, { status: 401 });
  }

  await db
    .prepare("UPDATE users SET password_hash = ?1 WHERE id = ?2")
    .bind(await hashPassword(next), me.id)
    .run();
  return NextResponse.json({ ok: true });
}
