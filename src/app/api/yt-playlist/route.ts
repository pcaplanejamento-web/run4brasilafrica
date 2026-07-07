import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lists the videos of a PUBLIC YouTube playlist by reading the playlist page
 * (no API key). YouTube serves two markups depending on the variant:
 *   - new: `lockupViewModel` (contentId + lockupMetadataViewModel title)
 *   - old: `playlistVideoRenderer` (videoId + title runs/simpleText)
 * We support both (up to ~100 videos). Unofficial — degrades gracefully
 * (`ok:false` / empty) if YouTube changes it; the caller then falls back to the
 * native playlist player.
 */
function dec(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw;
  }
}

function extract(html: string): { id: string; title: string }[] {
  const seen = new Set<string>();
  const videos: { id: string; title: string }[] = [];
  const push = (id: string, title: string) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      videos.push({ id, title: (title || "").trim() });
    }
  };

  // New markup: contentIds and lockup titles are both in playlist order → zip.
  const ids = [
    ...html.matchAll(/"contentId":"([\w-]{11})","contentType":"LOCKUP_CONTENT_TYPE_VIDEO"/g),
  ].map((m) => m[1]);
  if (ids.length) {
    const titles = [
      ...html.matchAll(/"lockupMetadataViewModel":\{"title":\{"content":"((?:[^"\\]|\\.)*?)"/g),
    ].map((m) => dec(m[1]));
    ids.forEach((id, i) => push(id, titles[i] ?? ""));
    return videos;
  }

  // Old markup: one playlistVideoRenderer per video; title is the first in the chunk.
  const parts = html.split('"playlistVideoRenderer":');
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i].slice(0, 5000);
    const idm = chunk.match(/^\{"videoId":"([\w-]{11})"/);
    if (!idm) continue;
    const tm =
      chunk.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*?)"/) ||
      chunk.match(/"title":\{"simpleText":"((?:[^"\\]|\\.)*?)"/);
    push(idm[1], tm ? dec(tm[1]) : "");
  }
  return videos;
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
    const videos = extract(await res.text());

    return NextResponse.json(
      { ok: true, count: videos.length, videos },
      { headers: { "Cache-Control": "public, max-age=600" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao buscar a playlist" }, { status: 502 });
  }
}
