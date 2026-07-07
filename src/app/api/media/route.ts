import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: Request) {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured" });
  // Uploads require an admin session when auth is configured.
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "arquivo ausente" }, { status: 400 });
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ ok: false, error: "tipo de imagem não suportado" }, { status: 400 });
  }
  const buf = await file.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "imagem acima de 8 MB" }, { status: 400 });
  }

  const key = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXT[type] ?? "bin"}`;
  await kv.put(key, buf, { metadata: { contentType: type } });

  return NextResponse.json({ ok: true, key, url: `/api/media/${key}` });
}
