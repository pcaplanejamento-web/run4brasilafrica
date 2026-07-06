import { NextResponse } from "next/server";
import { readContent, writeContent, resetContent } from "@/lib/content/db";
import type { SiteContent } from "@/lib/content/types";

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
  let body: { content?: SiteContent; action?: string };
  try {
    body = (await req.json()) as { content?: SiteContent; action?: string };
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
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
