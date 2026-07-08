import { NextResponse } from "next/server";
import { getDB, getMediaKV } from "@/lib/cf";
import { allowRequest, clientIp } from "@/lib/antispam";
import {
  createSession,
  verifyPassword,
  SESSION_COOKIE,
  type Role,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_FAILS = 5; // failures before a temporary lock (per e-mail)
const LOCK_SECONDS = 15 * 60; // 15 min

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  // Per-IP cap: blocks credential-stuffing across many e-mails from one source
  // (the per-e-mail lock below can't). 30 attempts / 15 min is ample for a human.
  if (!(await allowRequest("login-ip", clientIp(req), 30, LOCK_SECONDS))) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas deste dispositivo. Tente mais tarde." },
      { status: 429 },
    );
  }

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

  // Brute-force protection: temporary lock after repeated failures (KV-backed).
  const kv = getMediaKV();
  const failKey = `login:fail:${email}`;
  if (kv) {
    const rec = (await kv.get(failKey, "json")) as { n: number; until?: number } | null;
    if (rec?.until && Date.now() < rec.until) {
      const mins = Math.ceil((rec.until - Date.now()) / 60000);
      return NextResponse.json(
        { ok: false, error: `Muitas tentativas. Tente novamente em ~${mins} min.` },
        { status: 429 },
      );
    }
  }

  const user = await db
    .prepare("SELECT id, name, role, password_hash FROM users WHERE email = ?1")
    .bind(email)
    .first<{ id: number; name: string; role: Role; password_hash: string }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    if (kv) {
      const rec = (await kv.get(failKey, "json")) as { n: number } | null;
      const n = (rec?.n ?? 0) + 1;
      const until = n >= MAX_FAILS ? Date.now() + LOCK_SECONDS * 1000 : undefined;
      await kv.put(failKey, JSON.stringify({ n, until }), { expirationTtl: LOCK_SECONDS });
    }
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }

  if (kv) await kv.delete(failKey); // reset on success

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
