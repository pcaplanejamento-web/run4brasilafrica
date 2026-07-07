import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const kv = getMediaKV();
  if (!kv) return new NextResponse("not configured", { status: 404 });
  const { key } = await params;
  const { value, metadata } = await kv.getWithMetadata(key, "arrayBuffer");
  if (!value) return new NextResponse("não encontrado", { status: 404 });
  const contentType = (metadata?.contentType as string) ?? "application/octet-stream";
  return new NextResponse(value, {
    headers: {
      "Content-Type": contentType,
      // Keys are unique per upload, so cache aggressively.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured" });
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }
  const { key } = await params;
  await kv.delete(key);
  return NextResponse.json({ ok: true });
}
