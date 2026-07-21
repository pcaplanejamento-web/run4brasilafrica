"use client";

import { useEffect, useState } from "react";
import type { Lote } from "@/lib/content/types";
import { loteCtaLabel } from "@/lib/content/lotes";
import CtaButton from "./CtaButton";

const LINKS = [
  { href: "#aba-a-causa", label: "Sobre" },
  { href: "#percurso", label: "Percurso" },
  { href: "#galeria", label: "Galeria" },
  { href: "#parceiros", label: "Parceiros" },
  { href: "#faq", label: "FAQ" },
];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold uppercase tracking-[0.02em] ${className}`}
    >
      RUN4BRASIL<span className="text-gold">AFRICA</span>
    </span>
  );
}

export default function SiteNav({
  logo,
  lotes,
  showOrganizers = false,
}: {
  logo?: string;
  lotes?: Lote[];
  /** Add the "Organizadores" entry (opens the floating card via #organizadores). */
  showOrganizers?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);

  const links = showOrganizers
    ? [...LINKS, { href: "#organizadores", label: "Organizadores" }]
    : LINKS;

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // The CTA label adapts to the active lote (abertura em / inscreva-se até…).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const cta = loteCtaLabel(lotes ?? [], now);

  return (
    <header
      className="border-b border-line"
      style={{ background: "var(--color-header-bg, var(--color-ink))" }}
    >
      <nav className="relative flex items-center justify-between px-5 py-4 sm:px-8 md:px-14 md:py-[26px]">
        <a href="#top" className="text-[19px] md:text-[22px]" aria-label="Run4BrasilAfrica — início">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Run4BrasilAfrica" className="h-9 w-auto md:h-11" />
          ) : (
            <Wordmark />
          )}
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 text-[14px] uppercase tracking-[0.04em] text-muted lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-cream">
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA (adapts to the active lote). Wrapped so it's reliably
            hidden below lg — putting `hidden` straight on CtaButton loses to its
            own `inline-block` base class in the CSS cascade. */}
        <div className="hidden lg:block">
          <CtaButton href={cta.url} size="sm">
            {cta.label}
          </CtaButton>
        </div>

        {/* Mobile CTA — absolutely centered in the header (below lg), between the
            logo (left) and the menu button (right). Shown only when a logo IMAGE is
            set; the text wordmark is too wide to leave room for a centered button. */}
        {logo && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden">
            <CtaButton href={cta.url} size="xs">
              {cta.label}
            </CtaButton>
          </div>
        )}

        {/* Mobile menu button (right). Thick literal-white bars (not an oklch token)
            so the icon is bold and unmistakable — never faint/invisible/black. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[6px] lg:hidden"
        >
          <span
            className={`block h-[3px] w-7 rounded-full bg-white transition-transform duration-300 ${
              open ? "translate-y-[9px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[3px] w-7 rounded-full bg-white transition-opacity duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[3px] w-7 rounded-full bg-white transition-transform duration-300 ${
              open ? "-translate-y-[9px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile dropdown. `max-h-[80vh] + overflow-y-auto` when open so it fits
          any number of links (and scrolls if it ever exceeds the screen) instead
          of clipping the last item; `max-h-0 overflow-hidden` drives the collapse. */}
      <div
        style={{ background: "var(--color-header-bg, var(--color-ink))" }}
        className={`border-t border-line transition-[max-height] duration-300 ease-out lg:hidden ${
          open ? "max-h-[80vh] overflow-y-auto" : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col px-5 py-2 sm:px-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/60 py-4 text-[15px] uppercase tracking-[0.04em] text-muted last:border-b-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
