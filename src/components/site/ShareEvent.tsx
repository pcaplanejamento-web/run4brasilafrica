"use client";

import { useEffect, useState } from "react";
import type { EventInfo, ShareSection } from "@/lib/content/types";
import SectionEyebrow from "./SectionEyebrow";

const SITE_URL = "https://run4brasilafrica.com.br";

function WhatsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1112 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.2 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.7 2.6 4.1 3.6 1.5.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.6z" />
    </svg>
  );
}
function FbIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0022 12z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.5" />
    </svg>
  );
}

const btn =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-line-soft px-4 text-[14px] font-bold text-cream transition-colors hover:border-gold hover:text-gold";

export default function ShareEvent({ share, event }: { share?: ShareSection; event: EventInfo }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Gate the native-share button on the client only (avoids hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const message =
    share?.message?.trim() ||
    `${event.brandName} — ${event.tagline}\n${event.dateLabel}\nInscreva-se: ${SITE_URL}`;
  const text = message.replace(/\n/g, " ");

  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  function openPopup(url: string) {
    const win = window.open(url, "share", "width=620,height=680");
    if (!win) window.location.href = url; // popup blocked → navigate instead
  }
  function copy() {
    navigator.clipboard?.writeText(SITE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  function nativeShare() {
    navigator.share?.({ title: event.brandName, text, url: SITE_URL }).catch(() => {});
  }

  return (
    <section id="compartilhar" className="bg-ink px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow as="h2">{share?.title?.trim() || "Compartilhe o evento"}</SectionEyebrow>
      {share?.subtitle?.trim() && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/70 md:text-[16px]">
          {share.subtitle}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {canShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="clip-cta inline-flex min-h-11 items-center gap-2 bg-gold px-5 text-[14px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5"
          >
            <ShareIcon />
            Compartilhar
          </button>
        )}
        <a href={wa} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Compartilhar no WhatsApp">
          <WhatsIcon />
          WhatsApp
        </a>
        <button type="button" onClick={() => openPopup(fb)} className={btn} aria-label="Compartilhar no Facebook">
          <FbIcon />
          Facebook
        </button>
        <a href={x} target="_blank" rel="noopener noreferrer" className={btn} aria-label="Compartilhar no X">
          <XIcon />X
        </a>
        <button type="button" onClick={copy} className={btn} aria-label="Copiar link">
          <LinkIcon />
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>
    </section>
  );
}
