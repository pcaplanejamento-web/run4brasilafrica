"use client";

import { useCallback, useEffect, useState } from "react";
import type { PrivacySection } from "@/lib/content/types";

/**
 * Floating privacy notice. Opens when the URL hash is `#privacidade` (so any
 * link — footer, form consent — just uses `href="#privacidade"` and works from
 * server or client components) without leaving the current page. Closes on the
 * backdrop, the X, or Esc; locks background scroll while open. Text comes from
 * ADM > Configurações (`content.privacy`).
 */
export default function PrivacyModal({ privacy }: { privacy?: PrivacySection }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === "#privacidade");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const close = useCallback(() => {
    // Drop the hash without scrolling or adding a history entry.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  if (!open) return null;

  const title = privacy?.title?.trim() || "Política de Privacidade";
  const body = privacy?.body?.trim() || "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={close}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-line-soft bg-ink-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-4 sm:px-6">
          <h2 className="font-display text-[18px] font-bold uppercase text-cream md:text-[22px]">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto whitespace-pre-line px-5 py-5 text-[15px] leading-[1.7] text-muted-strong sm:px-6">
          {body}
        </div>
      </div>
    </div>
  );
}
