import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lists the videos of a PUBLIC YouTube playlist via its public Atom feed
 * (no API key). The feed returns up to ~15 videos — enough for an event
 * playlist. Degrades gracefully: callers should handle `ok: false`.
 */
function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function GET(req: Request) {
  const list = new URL(req.url).searchParams.get("list");
  if (!list || !/^[\w-]{6,}$/.test(list)) {
    return NextResponse.json({ ok: false, error: "playlist inválida" }, { status: 400 });
  }

  try {
    const r = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(list)}`,
      { headers: { "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" } },
    );
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "playlist não encontrada" }, { status: 502 });
    }
    const xml = await r.text();

    const videos: { id: string; title: string }[] = [];
    const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
    let m: RegExpExecArray | null;
    while ((m = entryRe.exec(xml)) !== null) {
      const entry = m[1];
      const id = entry.match(/<yt:videoId>([\w-]+)<\/yt:videoId>/)?.[1];
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      if (id) videos.push({ id, title: decodeXml(title).trim() });
    }

    return NextResponse.json(
      { ok: true, count: videos.length, videos },
      { headers: { "Cache-Control": "public, max-age=600" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao buscar a playlist" }, { status: 502 });
  }
}
