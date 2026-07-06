import type { Inscricao } from "@/lib/content/types";

/**
 * Registration call-to-action band. The button links to the partner platform
 * URL configured in ADM > Links (Plano §4.3, Opção A).
 */
export default function InscricaoCTA({ inscricao }: { inscricao: Inscricao }) {
  return (
    <section
      id="inscricao"
      className="flex flex-col items-start gap-6 bg-gold px-5 py-14 text-gold-ink sm:px-8 md:flex-row md:items-center md:justify-between md:px-14 md:py-20"
    >
      <div>
        <h2 className="font-display text-[30px] font-bold uppercase md:text-[36px]">
          {inscricao.title}
        </h2>
        <p className="mt-1.5 text-[16px]">{inscricao.subtitle}</p>
      </div>
      <a
        href={inscricao.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full whitespace-nowrap bg-gold-ink px-9 py-4 text-center text-[16px] font-bold uppercase text-cream transition-transform hover:-translate-y-0.5 md:w-auto md:px-9 md:py-[17px]"
      >
        {inscricao.ctaLabel}
      </a>
    </section>
  );
}
