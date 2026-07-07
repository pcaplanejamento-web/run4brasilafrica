import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const IMAGE_MAX = 8 * 1024 * 1024; // 8 MB
const VIDEO_MAX = 25 * 1024 * 1024; // 25 MB (KV per-value limit)
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const ALLOWED = Object.keys(EXT);

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
    return NextResponse.json({ ok: false, error: "tipo de arquivo não suportado" }, { status: 400 });
  }
  const isVideo = type.startsWith("video/");
  const buf = await file.arrayBuffer();
  const max = isVideo ? VIDEO_MAX : IMAGE_MAX;
  if (buf.byteLength > max) {
    return NextResponse.json(
      { ok: false, error: isVideo ? "vídeo acima de 25 MB" : "imagem acima de 8 MB" },
      { status: 400 },
    );
  }

  const key = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXT[type] ?? "bin"}`;
  await kv.put(key, buf, { metadata: { contentType: type } });

  return NextResponse.json({ ok: true, key, url: `/api/media/${key}` });
}
