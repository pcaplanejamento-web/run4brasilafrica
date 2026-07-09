import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Receives CSP violation reports (sent by the browser via `report-uri` while the
 * policy runs in Report-Only mode). Logs them so we can see what a strict CSP
 * would block — visible in `wrangler tail` / the Cloudflare dashboard — before
 * switching the policy to enforcing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.warn("[csp-report]", body.slice(0, 2000));
  } catch {
    /* ignore malformed reports */
  }
  return new NextResponse(null, { status: 204 });
}
