import { NextResponse } from "next/server";
import { readContent, writeContent, resetContent } from "@/lib/content/db";
import { authConfigured, getSessionUser } from "@/lib/auth";
import type { StoredContent } from "@/lib/content/types";

/**
 * Content backend for the ADM, same-origin. Reads/writes Cloudflare D1
 * (see src/lib/content/db.ts). No secrets in the client: the D1 binding lives in
 * the Worker. When there is no binding (local `next dev`), writes report
 * `not_configured` so the ADM persists locally only.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const { content, source } = await readContent();
  return NextResponse.json({ ok: true, content, source });
}

export async function PUT(req: Request) {
  // When a backend exists, writes require a valid admin session. (Local dev has
  // no binding → open, so the ADM stays usable offline.)
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  let body: { content?: StoredContent; action?: string };
  try {
    body = (await req.json()) as { content?: StoredContent; action?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }

  try {
    if (body.action === "reset") {
      const ok = await resetContent();
      return ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ ok: false, code: "not_configured" });
    }

    if (!body.content) {
      return NextResponse.json({ ok: false, error: "sem conteúdo" }, { status: 400 });
    }

    const ok = await writeContent(body.content);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ ok: false, code: "not_configured" });
  } catch (err) {
    console.error("content PUT failed:", err); // logged server-side, not leaked
    return NextResponse.json({ ok: false, error: "erro ao gravar" }, { status: 502 });
  }
}
