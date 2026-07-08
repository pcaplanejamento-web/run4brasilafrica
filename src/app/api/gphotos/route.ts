import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Reads a PUBLIC Google Photos shared album page and extracts the photo URLs.
 *
 * Google Photos has no official API/embed for this, so we parse the share page's
 * embedded data (the `lh3.googleusercontent.com/pw/...` entries). It is
 * unofficial and may break if Google changes the page — callers must degrade
 * gracefully (show nothing) when `ok` is false or `images` is empty.
 */
// Only Google Photos share hosts — NOT the generic "goo.gl" shortener, which
// (with redirect:follow) would let a link redirect the server to any host (SSRF).
const ALLOWED_HOSTS = ["photos.app.goo.gl", "photos.google.com"];

function hostAllowed(host: string): boolean {
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) {
    return NextResponse.json({ ok: false, error: "url ausente" }, { status: 400 });
  }

  let host: string;
  try {
    host = new URL(target).host;
  } catch {
    return NextResponse.json({ ok: false, error: "url inválida" }, { status: 400 });
  }
  // Only proxy Google Photos links (avoid becoming an open proxy).
  if (!hostAllowed(host)) {
    return NextResponse.json(
      { ok: false, error: "apenas links do Google Fotos" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    const html = await res.text();

    // Photo entries look like ["https://lh3.googleusercontent.com/pw/<id>",W,H
    const re =
      /\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9\-_]+)",(\d+),(\d+)/g;
    const seen = new Set<string>();
    const images: { thumb: string; full: string; w: number; h: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const base = m[1];
      if (seen.has(base)) continue;
      seen.add(base);
      images.push({
        thumb: `${base}=w800`,
        full: `${base}=w1600`,
        w: Number(m[2]),
        h: Number(m[3]),
      });
    }

    return NextResponse.json(
      { ok: true, count: images.length, images },
      { headers: { "Cache-Control": "public, max-age=600" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "falha ao buscar o álbum" },
      { status: 502 },
    );
  }
}
