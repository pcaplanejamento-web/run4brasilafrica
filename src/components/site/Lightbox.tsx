"use client";

import { useEffect } from "react";
import type { GalleryPhoto } from "@/lib/content/types";
import { WATERMARK_BG } from "./ProtectedImage";

/**
 * Full-screen protected photo viewer. Shows the selected photo at natural size
 * with the same anti-copy protection as the grid (no drag, no context menu,
 * tiled watermark, hidden on print) and lets the visitor page through all
 * photos with the arrows, keyboard or by tapping.
 */
export default function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const total = photos.length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % total);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, total, onClose, onIndex]);

  const photo = photos[index];
  if (!photo) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de foto"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onIndex((index - 1 + total) % total);
          }}
          aria-label="Foto anterior"
          className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:left-6"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <div
        className="protected-media relative inline-block max-h-[86vh] max-w-[92vw]"
        onClick={stop}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.album}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="max-h-[86vh] max-w-[92vw] select-none object-contain"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: WATERMARK_BG, backgroundRepeat: "repeat" }}
        />
        <div
          className="absolute inset-0"
          onContextMenu={(e) => e.preventDefault()}
          aria-hidden="true"
        />
        {photo.album && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded bg-black/55 px-2 py-0.5 font-[monospace] text-[11px] uppercase text-white/90">
            {photo.album}
          </span>
        )}
      </div>

      {total > 1 && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            onIndex((index + 1) % total);
          }}
          aria-label="Próxima foto"
          className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-6"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
