import { NextResponse } from "next/server";
import { seedContent } from "@/lib/content/seed";
import type { SiteContent } from "@/lib/content/types";

/**
 * Proxy between the browser ADM and the Apps Script backend.
 *
 * The write token lives ONLY here (server env), never in the client bundle:
 * the ADM calls this same-origin route and we forward to GAS with the token.
 */

export const dynamic = "force-dynamic";

const GAS_URL = process.env.GAS_WEB_APP_URL;
const TOKEN = process.env.GAS_SHARED_TOKEN;

function merge(stored: Partial<SiteContent> | null | undefined): SiteContent {
  return stored ? { ...seedContent, ...stored } : seedContent;
}

export async function GET() {
  if (!GAS_URL) {
    return NextResponse.json({ ok: true, content: seedContent, source: "unset" });
  }
  try {
    const res = await fetch(GAS_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { content?: Partial<SiteContent> | null };
    const hasBackend = Boolean(data?.content);
    return NextResponse.json({
      ok: true,
      content: merge(data?.content),
      source: hasBackend ? "backend" : "seed",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      content: seedContent,
      source: "error",
      error: String(err),
    });
  }
}

async function forward(body: Record<string, unknown>) {
  const res = await fetch(GAS_URL as string, {
    method: "POST",
    // text/plain keeps this a "simple request" so Apps Script needs no
    // CORS preflight (it doesn't answer OPTIONS).
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: TOKEN, ...body }),
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });
  return (await res.json()) as { ok?: boolean; error?: string };
}

export async function PUT(req: Request) {
  if (!GAS_URL || !TOKEN) {
    // Backend not configured — tell the client so it can persist locally only.
    return NextResponse.json({ ok: false, code: "not_configured" });
  }
  try {
    const body = (await req.json()) as { content?: SiteContent; action?: string };
    const data = await forward(
      body.action === "reset" ? { action: "reset" } : { content: body.content },
    );
    if (!data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error ?? "backend recusou a gravação" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
