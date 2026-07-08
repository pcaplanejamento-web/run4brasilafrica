import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/content/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Política de Privacidade — Run4BrasilAfrica",
  robots: { index: true, follow: true },
};

/**
 * Privacy notice (LGPD). This is a sensible starting template — the organizing
 * team should review it with legal counsel before relying on it.
 */
export default async function PrivacidadePage() {
  const content = await getSiteContent();
  const email = content.contact?.email || "contato@run4brasilafrica.com";
  const brand = content.event?.brandName || "Run4BrasilAfrica";

  return (
    <main className="mx-auto max-w-[760px] px-5 py-16 text-cream sm:px-8 md:py-24">
      <Link href="/" className="text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
        ← Voltar ao site
      </Link>
      <h1 className="mt-6 font-display text-[30px] font-bold uppercase md:text-[40px]">
        Política de Privacidade
      </h1>

      <div className="mt-8 flex flex-col gap-6 text-[15px] leading-[1.7] text-muted-strong">
        <p>
          Esta página explica como o {brand} trata os dados pessoais informados no site, em
          conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>

        <section>
          <h2 className="mb-2 text-[18px] font-bold text-cream">Quais dados coletamos</h2>
          <p>
            Coletamos apenas o que você envia nos formulários do site: no{" "}
            <strong>&ldquo;Seja um Parceiro&rdquo;</strong>, nome, e-mail, telefone, tipo (pessoa
            física/jurídica) e a mensagem sobre como deseja ajudar; nos{" "}
            <strong>avisos por e-mail</strong>, apenas o e-mail.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[18px] font-bold text-cream">Para que usamos</h2>
          <p>
            Usamos esses dados exclusivamente para entrar em contato sobre parcerias e para avisar
            sobre inscrições/novidades do evento. Não vendemos nem compartilhamos seus dados com
            terceiros para fins de marketing.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[18px] font-bold text-cream">Onde ficam guardados</h2>
          <p>
            Os dados ficam armazenados na infraestrutura do próprio site (Cloudflare) e são
            acessíveis apenas à equipe organizadora autenticada. Mantemos os dados pelo tempo
            necessário para as finalidades acima.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-[18px] font-bold text-cream">Seus direitos</h2>
          <p>
            Você pode solicitar, a qualquer momento, o acesso, a correção ou a exclusão dos seus
            dados, bem como revogar o consentimento. Basta escrever para{" "}
            <a href={`mailto:${email}`} className="text-gold underline">
              {email}
            </a>
            .
          </p>
        </section>

        <p className="text-[13px] text-muted">
          Última atualização mantida pela organização. Em caso de dúvidas jurídicas, consulte um
          advogado antes de usar este texto como versão final.
        </p>
      </div>
    </main>
  );
}
