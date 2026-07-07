"use client";

import { useMemo, useState } from "react";
import type { GalleryConfig, GalleryPhoto } from "@/lib/content/types";
import Reveal from "./Reveal";
import ProtectedImage from "./ProtectedImage";
import Lightbox from "./Lightbox";

/**
 * Photo gallery. Groups the ADM photos into sections (by album) with a heading
 * each; every photo opens a protected full-screen lightbox so all photos can be
 * viewed. Falls back to labelled placeholder tiles when there are no photos.
 * An optional "buy photos" button appears next to the title.
 */
export default function Galeria({
  tiles,
  photos,
  gallery,
}: {
  tiles: { album: string }[];
  photos: GalleryPhoto[];
  gallery?: GalleryConfig;
}) {
  const hasPhotos = photos.length > 0;
  const [open, setOpen] = useState<number | null>(null);

  // Group photos into sections by album, preserving first-appearance order.
  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, { photo: GalleryPhoto; index: number }[]>();
    photos.forEach((photo, index) => {
      const key = photo.album || "Fotos";
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push({ photo, index });
    });
    return order.map((name) => ({ name, items: map.get(name)! }));
  }, [photos]);

  const buyOn = !!gallery?.buyEnabled && !!gallery?.buyUrl;

  return (
    <section id="galeria" className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 md:mb-10">
        <h2 className="font-display text-[30px] font-bold uppercase md:text-[36px]">
          Galeria
        </h2>
        {buyOn && (
          <a
            href={gallery?.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="clip-cta-lg inline-block bg-gold px-6 py-3 text-[13px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:text-[14px]"
          >
            {gallery?.buyLabel || "Comprar fotos"}
          </a>
        )}
      </div>

      {hasPhotos ? (
        <div className="flex flex-col gap-10 md:gap-12">
          {sections.map((section) => (
            <div key={section.name}>
              <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
                {section.name}
              </h3>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {section.items.map(({ photo, index }, i) => (
                  <Reveal
                    key={photo.url}
                    delay={(i % 4) * 70}
                    className="relative h-[130px] overflow-hidden md:h-[190px]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(index)}
                      aria-label={`Ampliar foto ${i + 1} de ${section.name}`}
                      className="absolute inset-0 h-full w-full cursor-zoom-in"
                    >
                      <ProtectedImage src={photo.url} alt={photo.album} className="object-cover" />
                    </button>
                    <span className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 rounded bg-black/45 px-1.5 py-0.5 font-[monospace] text-[11px] uppercase text-white/90">
                      {photo.album}
                    </span>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {tiles.map((g, i) => (
            <Reveal
              key={i}
              delay={(i % 4) * 70}
              className="relative h-[130px] md:h-[190px]"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, oklch(0.5 0.1 40) 0 18px, oklch(0.44 0.1 38) 18px 36px)",
              }}
            >
              <span className="absolute bottom-2.5 left-2.5 font-[monospace] text-[11px] uppercase text-white/85">
                {g.album}
              </span>
            </Reveal>
          ))}
        </div>
      )}

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onIndex={setOpen}
        />
      )}
    </section>
  );
}
