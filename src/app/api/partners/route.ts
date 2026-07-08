import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";
import { allowRequest, clientIp, isHoneypotTripped } from "@/lib/antispam";
import { sendNotification } from "@/lib/email";
import type { PartnerLead, PartnerKind } from "@/lib/content/types";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PartnerBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  kind?: string;
  hasWhatsapp?: boolean;
  /** Honeypot — must stay empty (bots fill it). */
  website?: string;
}

interface PartnerRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  kind: string;
  has_whatsapp: number;
  created_at: string;
}

async function requireAdmin() {
  return !(authConfigured() && !(await getSessionUser()));
}

/** Public: register a "Seja um Parceiro" lead. */
export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });

  let body: PartnerBody;
  try {
    body = (await req.json()) as PartnerBody;
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }

  // Silently accept (but drop) honeypot hits so bots don't learn they failed.
  if (isHoneypotTripped(body)) return NextResponse.json({ ok: true });

  // Per-IP rate limit: at most 5 cadastros / 10 min.
  if (!(await allowRequest("partners", clientIp(req), 5, 600))) {
    return NextResponse.json(
      { ok: false, error: "Muitos envios. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();
  const message = (body.message ?? "").trim();
  const kind: PartnerKind = body.kind === "juridica" ? "juridica" : "fisica";
  const hasWhatsapp = body.hasWhatsapp === true ? 1 : 0;

  if (!name || name.length > 200) {
    return NextResponse.json({ ok: false, error: "nome inválido" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, error: "e-mail inválido" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 8 || phone.length > 40) {
    return NextResponse.json({ ok: false, error: "telefone inválido" }, { status: 400 });
  }
  if (!message || message.length > 2000) {
    return NextResponse.json({ ok: false, error: "mensagem inválida" }, { status: 400 });
  }

  try {
    await db
      .prepare(
        "INSERT INTO partners (name, email, phone, message, kind, has_whatsapp, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      )
      .bind(name, email, phone, message, kind, hasWhatsapp, new Date().toISOString())
      .run();
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao registrar" }, { status: 500 });
  }

  // Notify the organisation (best-effort — never blocks or fails the submission).
  try {
    const row = await db
      .prepare("SELECT json FROM content WHERE id = 1")
      .first<{ json: string }>();
    const to = row
      ? (JSON.parse(row.json) as { sejaParceiro?: { notifyEmail?: string } }).sejaParceiro
          ?.notifyEmail?.trim()
      : undefined;
    if (to) {
      const tipo = kind === "juridica" ? "Pessoa jurídica" : "Pessoa física";
      await sendNotification({
        to,
        subject: `Novo parceiro: ${name}`,
        text:
          `Novo cadastro em "Seja um Parceiro":\n\n` +
          `Nome: ${name}\nTipo: ${tipo}\nE-mail: ${email}\n` +
          `Telefone: ${phone}${hasWhatsapp ? " (tem WhatsApp)" : ""}\n\n` +
          `O que pode ajudar:\n${message}`,
      });
    }
  } catch {
    /* notification is optional */
  }

  return NextResponse.json({ ok: true });
}

/** Admin: list all leads, optionally filtered by kind (?kind=fisica|juridica). */
export async function GET(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  const kindParam = new URL(req.url).searchParams.get("kind");
  const kind = kindParam === "fisica" || kindParam === "juridica" ? kindParam : null;

  const query = kind
    ? "SELECT id, name, email, phone, message, kind, has_whatsapp, created_at FROM partners WHERE kind = ?1 ORDER BY id DESC"
    : "SELECT id, name, email, phone, message, kind, has_whatsapp, created_at FROM partners ORDER BY id DESC";
  const stmt = kind ? db.prepare(query).bind(kind) : db.prepare(query);
  const { results } = await stmt.all<PartnerRow>();

  const partners: PartnerLead[] = results.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    kind: r.kind === "juridica" ? "juridica" : "fisica",
    hasWhatsapp: r.has_whatsapp === 1,
    created_at: r.created_at,
  }));
  return NextResponse.json({ ok: true, partners });
}

/** Admin: remove one lead by id. */
export async function DELETE(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ ok: false, code: "not_configured" });
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (id) await db.prepare("DELETE FROM partners WHERE id = ?1").bind(Number(id)).run();
  return NextResponse.json({ ok: true });
}
