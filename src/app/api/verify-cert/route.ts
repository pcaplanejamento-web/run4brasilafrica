import { NextResponse } from "next/server";
import { getMediaKV } from "@/lib/cf";
import { getSiteContent } from "@/lib/content/db";
import type { RaceResultRow } from "@/lib/content/types";
import { certSeed, certVerifyCode, classificacaoCats, normalizeCertCode } from "@/lib/results/verify";

export const dynamic = "force-dynamic";

function keyFor(id: string): string {
  return `results/${id.toLowerCase().replace(/[^a-z0-9-]/g, "")}.json`;
}

/**
 * Verificação pública de autenticidade do certificado: `?code=R4B-XXXXXX`.
 * Percorre as categorias de classificação da edição ativa (KV) e recomputa o
 * código de cada atleta; devolve os dados quando encontra. Sem PII sensível.
 */
export async function GET(req: Request) {
  const code = normalizeCertCode(new URL(req.url).searchParams.get("code") || "");
  if (!code) return NextResponse.json({ ok: false, error: "código inválido" }, { status: 400 });

  const kv = getMediaKV();
  if (!kv) return NextResponse.json({ ok: false, code: "not_configured" });

  const content = await getSiteContent();
  const cats = classificacaoCats(content.customSections);

  for (const cat of cats) {
    let rows: RaceResultRow[] | null = null;
    try {
      rows = (await kv.get(keyFor(cat.id), "json")) as RaceResultRow[] | null;
    } catch {
      /* segue para a próxima categoria */
    }
    for (const row of rows ?? []) {
      if (certVerifyCode(certSeed(row, cat.label)) === code) {
        return NextResponse.json({
          ok: true,
          found: true,
          code,
          athlete: {
            name: row.name,
            pos: row.pos,
            bib: row.bib,
            category: cat.label,
            timeNet: row.timeNet,
            timeGross: row.timeGross,
            team: row.team,
            ageGroup: row.ageGroup,
          },
        });
      }
    }
  }
  return NextResponse.json({ ok: true, found: false, code });
}
