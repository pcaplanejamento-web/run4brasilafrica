import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lists the videos of a PUBLIC YouTube playlist by reading the playlist page
 * (no API key). Parses the modern `lockupViewModel` entries in the initial HTML
 * (up to ~100 videos). Unofficial — degrades gracefully (`ok:false`) if YouTube
 * changes the markup; the caller then falls back to the native playlist player.
 */
function decodeJsonStr(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}

export async function GET(req: Request) {
  const list = new URL(req.url).searchParams.get("list");
  if (!list || !/^[\w-]{6,}$/.test(list)) {
    return NextResponse.json({ ok: false, error: "playlist inválida" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}&hl=pt&gl=BR`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          Cookie: "CONSENT=YES+1; SOCS=CAI",
        },
      },
    );
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "playlist não encontrada" }, { status: 502 });
    }
    const html = await res.text();

    // Each playlist item is a lockupViewModel: title (in metadata) then contentId.
    const re =
      /"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*?)"[\s\S]*?"contentId":"([\w-]{11})","contentType":"LOCKUP_CONTENT_TYPE_VIDEO"/g;
    const seen = new Set<string>();
    const videos: { id: string; title: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const id = m[2];
      if (seen.has(id)) continue;
      seen.add(id);
      videos.push({ id, title: decodeJsonStr(m[1]).trim() });
    }

    // Fallback: ids only (title extraction failed for some reason).
    if (!videos.length) {
      const idRe = /"contentId":"([\w-]{11})","contentType":"LOCKUP_CONTENT_TYPE_VIDEO"/g;
      while ((m = idRe.exec(html)) !== null) {
        if (!seen.has(m[1])) {
          seen.add(m[1]);
          videos.push({ id: m[1], title: "" });
        }
      }
    }

    return NextResponse.json(
      { ok: true, count: videos.length, videos },
      { headers: { "Cache-Control": "public, max-age=600" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao buscar a playlist" }, { status: 502 });
  }
}
