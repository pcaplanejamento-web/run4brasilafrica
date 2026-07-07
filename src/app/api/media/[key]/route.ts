import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const kv = getMediaKV();
  if (!kv) return new NextResponse("not configured", { status: 404 });
  const { key } = await params;
  const { value, metadata } = await kv.getWithMetadata(key, "arrayBuffer");
  if (!value) return new NextResponse("não encontrado", { status: 404 });

  const contentType = (metadata?.contentType as string) ?? "application/octet-stream";
  const total = value.byteLength;
  const cache = "public, max-age=31536000, immutable"; // keys are unique per upload

  // Range support (needed for reliable <video> playback/seeking).
  const range = req.headers.get("range");
  const m = range?.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : total - 1;
    if (start >= total || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}`, "Accept-Ranges": "bytes" },
      });
    }
    return new NextResponse(value.slice(start, end + 1), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        "Cache-Control": cache,
      },
    });
  }

  return new NextResponse(value, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Cache-Control": cache,
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
