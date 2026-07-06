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

async function countAdmins(db: NonNullable<ReturnType<typeof getDB>>): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'Administrador geral'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const id = Number((await params).id);
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    role?: string;
    password?: string;
  };

  const target = await db
    .prepare("SELECT id, role FROM users WHERE id = ?1")
    .bind(id)
    .first<{ id: number; role: Role }>();
  if (!target) return NextResponse.json({ ok: false, error: "usuário não encontrado" }, { status: 404 });

  const nextRole: Role = ROLES.includes(body.role as Role) ? (body.role as Role) : target.role;
  // Don't allow demoting the last admin.
  if (target.role === "Administrador geral" && nextRole !== "Administrador geral") {
    if ((await countAdmins(db)) <= 1) {
      return NextResponse.json({ ok: false, error: "não é possível rebaixar o último administrador" }, { status: 409 });
    }
  }

  if (body.name !== undefined || body.role !== undefined) {
    await db
      .prepare("UPDATE users SET name = COALESCE(?1, name), role = ?2 WHERE id = ?3")
      .bind(body.name?.trim() ?? null, nextRole, id)
      .run();
  }
  if (body.password) {
    if (body.password.length < 6)
      return NextResponse.json({ ok: false, error: "senha mín. 6 caracteres" }, { status: 400 });
    await db
      .prepare("UPDATE users SET password_hash = ?1 WHERE id = ?2")
      .bind(await hashPassword(body.password), id)
      .run();
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const id = Number((await params).id);
  const target = await db
    .prepare("SELECT id, role FROM users WHERE id = ?1")
    .bind(id)
    .first<{ id: number; role: Role }>();
  if (!target) return NextResponse.json({ ok: false, error: "usuário não encontrado" }, { status: 404 });

  if (target.role === "Administrador geral" && (await countAdmins(db)) <= 1) {
    return NextResponse.json({ ok: false, error: "não é possível remover o último administrador" }, { status: 409 });
  }

  await db.prepare("DELETE FROM sessions WHERE user_id = ?1").bind(id).run();
  await db.prepare("DELETE FROM users WHERE id = ?1").bind(id).run();
  return NextResponse.json({ ok: true });
}
