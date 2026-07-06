import type { KitSection } from "@/lib/content/types";

/** Athlete kit / regulation band (Plano §4.1.6, PDF downloads). */
export default function KitAtleta({ kit }: { kit: KitSection }) {
  return (
    <section className="flex flex-col items-start gap-6 border-b border-line px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between md:px-14 md:py-[70px]">
      <div>
        <h2 className="mb-2 font-display text-[22px] font-bold uppercase md:text-[26px]">
          {kit.title}
        </h2>
        <p className="text-[15px] opacity-75">{kit.subtitle}</p>
      </div>
      <div className="flex w-full gap-3.5 md:w-auto">
        <a
          href="#"
          className="flex-1 whitespace-nowrap border-2 border-gold px-6 py-3 text-center text-[14px] font-bold uppercase text-gold transition-colors hover:bg-gold hover:text-gold-ink md:flex-none"
        >
          {kit.regulamentoLabel}
        </a>
        <a
          href="#"
          className="flex-1 whitespace-nowrap bg-gold px-6 py-3 text-center text-[14px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:flex-none"
        >
          {kit.kitLabel}
        </a>
      </div>
    </section>
  );
}
