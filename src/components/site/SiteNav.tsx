"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#sobre", label: "Sobre" },
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

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink">
      <nav className="flex items-center justify-between px-5 py-4 sm:px-8 md:px-14 md:py-[26px]">
        <a href="#top" className="text-[19px] md:text-[22px]" aria-label="Run4BrasilAfrica — início">
          <Wordmark />
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 text-[14px] uppercase tracking-[0.04em] text-muted lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-cream">
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <a
          href="#inscricao"
          className="clip-cta hidden bg-gold px-6 py-3 text-[14px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 lg:inline-block"
        >
          Inscreva-se
        </a>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
        >
          <span
            className={`block h-[2px] w-6 bg-cream transition-transform duration-300 ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-cream transition-opacity duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-cream transition-transform duration-300 ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile dropdown */}
      <div
        className={`overflow-hidden border-t border-line bg-ink transition-[max-height] duration-300 ease-out lg:hidden ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="flex flex-col px-5 py-2 sm:px-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/60 py-4 text-[15px] uppercase tracking-[0.04em] text-muted"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#inscricao"
            onClick={() => setOpen(false)}
            className="clip-cta my-4 bg-gold px-6 py-4 text-center text-[15px] font-bold uppercase text-gold-ink"
          >
            Inscreva-se
          </a>
        </div>
      </div>
    </header>
  );
}
