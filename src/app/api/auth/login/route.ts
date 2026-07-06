import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import {
  createSession,
  verifyPassword,
  SESSION_COOKIE,
  type Role,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "informe e-mail e senha" }, { status: 400 });
  }

  const user = await db
    .prepare("SELECT id, name, role, password_hash FROM users WHERE email = ?1")
    .bind(email)
    .first<{ id: number; name: string; role: Role; password_hash: string }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  const session = await createSession(user.id);
  if (!session) {
    return NextResponse.json({ ok: false, error: "falha ao criar sessão" }, { status: 500 });
  }
  await db
    .prepare("UPDATE users SET last_access = ?1 WHERE id = ?2")
    .bind(new Date().toISOString(), user.id)
    .run();

  const res = NextResponse.json({
    ok: true,
    user: { name: user.name, role: user.role, email },
  });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
