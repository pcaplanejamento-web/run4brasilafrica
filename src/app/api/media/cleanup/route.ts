import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { authConfigured, getSessionUser } from "@/lib/auth";
import { readContent } from "@/lib/content/db";
import { isMediaKey, usedMediaKeys } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * Delete every uploaded media file that is NOT referenced anywhere in the stored
 * content (all editions). Admin-only. Conservative by construction: it lists the
 * real usage from the content and only removes what's genuinely orphaned; each
 * delete is best-effort (a KV quota hiccup skips that file, never 500s).
 */
export async function POST() {
  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured", deleted: [] });
  if (authConfigured() && !(await getSessionUser())) {
    return NextResponse.json({ ok: false, error: "não autenticado" }, { status: 401 });
  }

  // Source of truth for "in use": scan the whole content blob.
  let used: Set<string>;
  try {
    const { content } = await readContent();
    used = usedMediaKeys(content);
  } catch {
    // If we can't read the content, do nothing rather than risk deleting a used file.
    return NextResponse.json({ ok: false, error: "não foi possível ler o conteúdo", deleted: [] });
  }

  // Collect all orphaned media keys across the paginated KV list.
  const orphans: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ cursor, limit: 1000 });
    for (const k of page.keys) {
      if (isMediaKey(k.name) && !used.has(k.name)) orphans.push(k.name);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const deleted: string[] = [];
  for (const key of orphans) {
    try {
      await kv.delete(key);
      deleted.push(key);
    } catch (err) {
      console.error("media cleanup delete failed (ignorado):", key, err);
    }
  }

  return NextResponse.json({ ok: true, deleted, skipped: orphans.length - deleted.length });
}
