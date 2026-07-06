import { NextResponse } from "next/server";
import { authConfigured, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = authConfigured();
  const user = configured ? await getSessionUser() : null;
  return NextResponse.json({ ok: true, configured, user });
}
