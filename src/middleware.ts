import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** The single canonical host — everything else redirects here. */
const CANONICAL = "run4brasilafrica.com.br";

/**
 * Keep the site on ONE domain: any request to `www.<canonical>` or a
 * `*.workers.dev` deploy URL is 308-redirected to the apex, preserving the path
 * and query. The apex itself and localhost pass straight through.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const isAlt = host === `www.${CANONICAL}` || host.endsWith(".workers.dev");
  if (!isAlt) return NextResponse.next();

  const url = new URL(req.url);
  url.protocol = "https:";
  url.host = CANONICAL;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
