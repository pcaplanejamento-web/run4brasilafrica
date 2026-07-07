import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Resolves a Strava **short link** (e.g. `https://strava.app.link/XXXX`) — or any
 * strava.com link — to the numeric route/activity id used by the public embed.
 *
 * Short links are Branch deep links with no id in them; they redirect to the real
 * route page. We follow the redirect and scan the final URL + page body for a
 * `strava.com/routes/<id>` (or `/activities/<id>`). Unofficial and best-effort —
 * callers must degrade gracefully (offer the raw link) when `ok` is false.
 */
const ALLOWED_HOSTS = ["strava.app.link", "strava.com", "www.strava.com"];

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
  // Only follow Strava links (avoid becoming an open proxy).
  if (!hostAllowed(host)) {
    return NextResponse.json(
      { ok: false, error: "apenas links do Strava" },
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
    const body = await res.text();
    const hay = `${res.url || ""}\n${body}`;

    const route = hay.match(/strava\.com\/routes\/(\d+)/i);
    if (route) {
      return NextResponse.json(
        { ok: true, id: route[1], type: "route" },
        { headers: { "Cache-Control": "public, max-age=86400" } },
      );
    }
    const activity = hay.match(/strava\.com\/activities\/(\d+)/i);
    if (activity) {
      return NextResponse.json(
        { ok: true, id: activity[1], type: "activity" },
        { headers: { "Cache-Control": "public, max-age=86400" } },
      );
    }
    return NextResponse.json({ ok: false, error: "rota não encontrada" });
  } catch {
    return NextResponse.json(
      { ok: false, error: "falha ao resolver o link" },
      { status: 502 },
    );
  }
}
