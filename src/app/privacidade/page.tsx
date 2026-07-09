import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/content/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Política de Privacidade — Run4BrasilAfrica",
  robots: { index: true, follow: true },
};

/**
 * Standalone privacy page (for direct links / SEO). The same text is shown in a
 * floating modal on the main site (`PrivacyModal`, opened via `#privacidade`).
 * Content is editable in ADM > Configurações (`content.privacy`).
 */
export default async function PrivacidadePage() {
  const content = await getSiteContent();
  const title = content.privacy?.title?.trim() || "Política de Privacidade";
  const body = content.privacy?.body?.trim() || "";

  return (
    <main className="mx-auto max-w-[760px] px-5 py-16 text-cream sm:px-8 md:py-24">
      <Link href="/" className="text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
        ← Voltar ao site
      </Link>
      <h1 className="mt-6 font-display text-[30px] font-bold uppercase md:text-[40px]">{title}</h1>
      <div className="mt-8 whitespace-pre-line text-[15px] leading-[1.7] text-muted-strong">
        {body}
      </div>
    </main>
  );
}
