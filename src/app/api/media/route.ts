import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";
import { readContent } from "@/lib/content/db";
import { isMediaKey, usedKeysIn } from "@/lib/media";

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

/** Upload timestamp embedded in the key `${Date.now()}-${uuid}.${ext}` (or null). */
function keyTime(key: string): number | null {
  const n = Number(key.split("-")[0]);
  return Number.isFinite(n) && n > 1_000_000_000_000 ? n : null;
}

/**
 * Media library listing (Armazenamento). Returns every uploaded file in KV
 * (filtering out the non-media keys that share the namespace — anti-brute-force
 * counters) plus the set of keys currently referenced anywhere in the content
 * (all editions), so the ADM can flag unused files. Admin-only.
 */
export async function GET() {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured", items: [], usedKeys: [] });
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  // KV list is paginated (1000 keys per page); follow the cursor to get them all.
  type Raw = { key: string; size?: number; contentType?: string; uploadedAt: number | null };
  const raw: Raw[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ cursor, limit: 1000 });
    for (const k of page.keys) {
      if (!isMediaKey(k.name)) continue; // skip rl:/login:fail: counters
      const meta = k.metadata ?? {};
      raw.push({
        key: k.name,
        size: typeof meta.size === "number" ? meta.size : undefined,
        contentType: typeof meta.contentType === "string" ? meta.contentType : undefined,
        uploadedAt: keyTime(k.name),
      });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  // Tamanho EXATO: arquivos enviados antes de guardarmos `size` na metadata não o
  // têm — nesses, lemos o byteLength real (só leitura, não conta cota de escrita)
  // para o total ficar correto. Novos uploads já trazem `size` (sem leitura extra).
  const items = await Promise.all(
    raw.map(async (r) => {
      let size = r.size;
      if (size === undefined) {
        try {
          const { value } = await kv.getWithMetadata(r.key, "arrayBuffer");
          if (value) size = value.byteLength;
        } catch {
          /* best-effort: se falhar, fica sem tamanho */
        }
      }
      return { ...r, url: `/api/media/${r.key}`, size };
    }),
  );

  // Newest first.
  items.sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0));

  // Which of THESE files are actually referenced in the stored content (any
  // edition) — por substring exata da chave, robusto a qualquer forma de URL.
  let usedKeys: string[] = [];
  try {
    const { content } = await readContent();
    usedKeys = [...usedKeysIn(content, items.map((i) => i.key))];
  } catch {
    usedKeys = [];
  }

  return NextResponse.json({ ok: true, items, usedKeys });
}

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
  // Store size + contentType so the library can show them without a HEAD per file.
  await kv.put(key, buf, { metadata: { contentType: type, size: buf.byteLength } });

  return NextResponse.json({ ok: true, key, url: `/api/media/${key}` });
}
