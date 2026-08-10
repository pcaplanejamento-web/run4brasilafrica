import { NextResponse } from "next/server";
import { getDB, getEnvVar } from "@/lib/cf";
import { createSession, SESSION_COOKIE, type Role } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Acesso interno de desenvolvimento — NÃO é um backdoor público. Emite uma sessão
 * de admin legítima (mesmo mecanismo do login) apenas em dois casos:
 *
 *  1. **Dev local** (`NODE_ENV === "development"`, i.e. `next dev`): liberado sem
 *     segredo. O worker **publicado** é sempre `production`, então em produção este
 *     caminho está fechado — nunca há acesso sem senha no site no ar.
 *  2. **Opt-in do dono** (qualquer ambiente): se o Worker secret
 *     `ADMIN_BYPASS_TOKEN` estiver definido E a requisição trouxer o cabeçalho
 *     `x-admin-bypass` igual a ele. Ative com `wrangler secret put
 *     ADMIN_BYPASS_TOKEN`; desative com `wrangler secret delete ADMIN_BYPASS_TOKEN`.
 *
 * Fora desses casos → 404 (a rota "não existe"). Nenhum guarda é enfraquecido:
 * `getSessionUser` continua igual; isto só CRIA uma sessão legítima.
 *
 * Uso (navegador, mesma origem): `fetch('/api/auth/dev-session', {method:'POST'})`
 * grava o cookie httpOnly; recarregue e o ADM abre. (Em produção com segredo,
 * adicione o cabeçalho `x-admin-bypass`.)
 */

/** Comparação de tempo constante (evita timing attack no token). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const secret = getEnvVar("ADMIN_BYPASS_TOKEN");
  const provided = req.headers.get("x-admin-bypass") ?? "";
  const secretOk = !!secret && !!provided && safeEqual(provided, secret);

  // Libera só em dev local OU com o segredo correto; senão, a porta não existe.
  if (!isDev && !secretOk) return new NextResponse("not found", { status: 404 });

  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  // Opcional: entrar como um e-mail específico; senão, o primeiro admin (id ASC).
  let email: string | undefined;
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    email = body?.email?.trim().toLowerCase() || undefined;
  } catch {
    /* corpo opcional */
  }

  const user = email
    ? await db
        .prepare("SELECT id, name, role FROM users WHERE email = ?1")
        .bind(email)
        .first<{ id: number; name: string; role: Role }>()
    : await db
        .prepare("SELECT id, name, role FROM users ORDER BY id ASC LIMIT 1")
        .first<{ id: number; name: string; role: Role }>();

  if (!user) {
    return NextResponse.json({ ok: false, error: "nenhum usuário admin" }, { status: 404 });
  }

  const session = await createSession(user.id);
  if (!session) {
    return NextResponse.json({ ok: false, error: "falha ao criar sessão" }, { status: 500 });
  }
  try {
    await db
      .prepare("UPDATE users SET last_access = ?1 WHERE id = ?2")
      .bind(new Date().toISOString(), user.id)
      .run();
  } catch (err) {
    console.error("dev-session last_access update failed (ignorado):", err);
  }

  // `secure` só em HTTPS — assim o cookie também gruda no dev local (http://localhost).
  const secure = (() => {
    try {
      return new URL(req.url).protocol === "https:";
    } catch {
      return true;
    }
  })();

  const res = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
