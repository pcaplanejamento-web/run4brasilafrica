import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSiteContent } from "@/lib/content/db";
import { getSessionUser } from "@/lib/auth";
import SiteContent from "@/components/site/SiteContent";

/**
 * Pré-visualização de uma edição (ativa ou não), **restrita ao ADM logado**.
 * Rota dinâmica e `noindex` — separada da home pública (que é ISR/estática, para
 * não regredir a otimização anti-Error-1102). O público NUNCA vê edições não
 * ativas: sem sessão, redireciona ao login. `?edicao=<id>` escolhe a edição
 * (ausente ou desconhecida → edição ativa, via `resolveEdition`).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ edicao?: string | string[] }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const sp = await searchParams;
  const edicao = typeof sp?.edicao === "string" ? sp.edicao : undefined;
  const initial = await getSiteContent(edicao);
  return <SiteContent initial={initial} />;
}
