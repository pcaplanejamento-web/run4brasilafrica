import type { Inscricao, Lote } from "@/lib/content/types";
import Countdown from "./Countdown";

/** Format an ISO/date-local string to DD/MM/YYYY without touching Date (SSR-safe). */
function fmtDate(iso: string): string {
  const p = (iso || "").slice(0, 10).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

/**
 * Registration section driven by "lotes" (batches): the open lote is a prominent
 * band with its own colors, base text, countdown and CTA; other lotes are listed
 * (closed ones greyed out with the link disabled). Falls back to the single
 * inscrição CTA when no lotes are configured (Plano §4.1.4).
 */
export default function InscricaoCTA({
  inscricao,
  lotes,
}: {
  inscricao: Inscricao;
  lotes: Lote[];
}) {
  const sorted = [...(lotes ?? [])].sort((a, b) =>
    (a.date || "").localeCompare(b.date || ""),
  );
  const open = sorted.find((l) => l.open) ?? null;

  if (sorted.length === 0) {
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
          className="w-full whitespace-nowrap bg-gold-ink px-9 py-4 text-center text-[16px] font-bold uppercase text-cream transition-transform hover:-translate-y-0.5 md:w-auto"
        >
          {inscricao.ctaLabel}
        </a>
      </section>
    );
  }

  return (
    <section id="inscricao" className="px-5 py-14 sm:px-8 md:px-14 md:py-20">
      {open ? (
        <div
          className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10"
          style={{ background: open.colorBg, color: open.colorText }}
        >
          <div className="min-w-0">
            <div className="font-display text-[26px] font-bold uppercase md:text-[36px]">
              {open.name} aberto.
            </div>
            <p className="mt-1.5 text-[16px]">{open.text}</p>
            <div className="mt-4">
              <Countdown date={open.date} />
            </div>
          </div>
          <a
            href={open.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full whitespace-nowrap bg-black/85 px-9 py-4 text-center text-[16px] font-bold uppercase text-white transition-transform hover:-translate-y-0.5 md:w-auto"
          >
            {open.ctaLabel}
          </a>
        </div>
      ) : (
        <div className="bg-ink-panel p-8 text-center">
          <div className="font-display text-[24px] font-bold uppercase md:text-[30px]">
            Inscrições em breve.
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((l) => (
          <div
            key={l.id}
            className="border p-5"
            style={{
              borderColor: l.open ? l.colorBg : "oklch(0.32 0.02 40)",
              opacity: l.open ? 1 : 0.6,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[18px] font-bold uppercase">
                {l.name}
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.06em]"
                style={{ color: l.open ? "var(--color-gold)" : "var(--color-muted)" }}
              >
                {l.open ? "Aberto" : "Fechado"}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-strong">{l.text}</p>
            <div className="mt-1 text-[12px] opacity-60">Até {fmtDate(l.date)}</div>
            {l.open ? (
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="clip-cta mt-3 inline-block bg-gold px-4 py-2 text-[13px] font-bold uppercase text-gold-ink"
              >
                {l.ctaLabel}
              </a>
            ) : (
              <span className="mt-3 inline-block cursor-not-allowed bg-[oklch(0.3_0.01_40)] px-4 py-2 text-[13px] font-bold uppercase text-muted">
                Encerrado
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
