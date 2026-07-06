import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { getSessionUser, hashPassword, type Role } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLES: Role[] = ["Administrador geral", "Editor de conteúdo"];

async function requireAdmin() {
  const me = await getSessionUser();
  if (!me) return { error: NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 }) };
  if (me.role !== "Administrador geral")
    return { error: NextResponse.json({ ok: false, error: "apenas Administrador geral" }, { status: 403 }) };
  return { me };
}

export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured", users: [] });
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { results } = await db
    .prepare("SELECT id, email, name, role, last_access FROM users ORDER BY id")
    .all();
  return NextResponse.json({ ok: true, users: results });
}

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role: Role = ROLES.includes(body.role as Role)
    ? (body.role as Role)
    : "Editor de conteúdo";

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "nome, e-mail e senha (mín. 6) são obrigatórios" },
      { status: 400 },
    );
  }

  const exists = await db
    .prepare("SELECT id FROM users WHERE email = ?1")
    .bind(email)
    .first();
  if (exists) {
    return NextResponse.json({ ok: false, error: "e-mail já cadastrado" }, { status: 409 });
  }

  const hash = await hashPassword(password);
  await db
    .prepare("INSERT INTO users (email, name, role, password_hash) VALUES (?1, ?2, ?3, ?4)")
    .bind(email, name, role, hash)
    .run();
  return NextResponse.json({ ok: true });
}
