"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrganizersSection } from "@/lib/content/types";

/** Instagram profile URL from an @handle, a bare handle, or a full URL. */
function instaHref(v?: string): string | null {
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.trim().replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "");
  return handle ? `https://instagram.com/${handle}` : null;
}

/** "@handle" for display, from a username/handle or an instagram URL. */
function atHandle(username?: string, instagram?: string): string {
  const raw = (username || instagram || "").trim();
  if (!raw) return "";
  const handle = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  return handle ? `@${handle}` : "";
}

/**
 * Floating "Organizadores" card. Opens when the URL hash is `#organizadores` (the
 * footer link uses `href="#organizadores"`), without leaving the page — same
 * pattern as `PrivacyModal`. Shows the dedication (title + text) and a grid of
 * organizers built like the **Parceiros** cards: photo tile, name below, and the
 * Instagram handle below the name; clicking a card opens that profile on Instagram.
 * Content comes from ADM > Configurações (`content.organizers`).
 */
export default function OrganizersModal({
  organizers,
}: {
  organizers?: OrganizersSection;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === "#organizadores");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const close = useCallback(() => {
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

  // Disabled in ADM → never opens (even from an old #organizadores link).
  if (!open || organizers?.enabled === false) return null;

  const title = organizers?.title?.trim() || "Organizadores";
  const body = organizers?.body?.trim() || "";
  const people = organizers?.people ?? [];

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
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-line-soft bg-ink-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
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

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {body && (
            <p className="mb-6 whitespace-pre-line text-[15px] leading-[1.7] text-muted-strong">
              {body}
            </p>
          )}

          {people.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
              {people.map((p, i) => {
                // The Instagram redirect is built from the username (legacy
                // `instagram` link kept only as a fallback for old data).
                const href = instaHref(p.username || p.instagram);
                const handle = atHandle(p.username, p.instagram);
                const inner = (
                  <>
                    {/* Photo tile — square (1:1), fills the card (Parceiros style). */}
                    <div className="aspect-square w-full overflow-hidden bg-ink-card">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-[monospace] text-[12px] text-[#999]">[ foto ]</span>
                        </div>
                      )}
                    </div>
                    {/* Name + Instagram handle. */}
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-center">
                      <span className="text-[13px] font-bold uppercase leading-snug tracking-[0.03em] text-cream md:text-[14px]">
                        {p.name}
                      </span>
                      {handle && (
                        <span className="text-[12px] text-gold">{handle}</span>
                      )}
                    </div>
                  </>
                );

                const cardClass =
                  "group flex flex-col overflow-hidden rounded-2xl border border-line-soft bg-ink-panel transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]";

                return href ? (
                  <a
                    key={`${p.name}-${i}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.name} no Instagram`}
                    className={cardClass}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={`${p.name}-${i}`} className={cardClass}>
                    {inner}
                  </div>
                );
              })}
            </div>
          ) : (
            !body && (
              <p className="text-[14px] text-muted">Em breve.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
