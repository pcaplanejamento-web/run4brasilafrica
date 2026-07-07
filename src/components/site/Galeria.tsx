"use client";

import { useEffect, useMemo, useState } from "react";
import type { Album, GalleryConfig, GalleryPhoto } from "@/lib/content/types";
import Reveal from "./Reveal";
import ProtectedImage from "./ProtectedImage";
import Lightbox from "./Lightbox";

interface GalleryItem {
  thumb: string;
  full: string;
  album: string;
}

/**
 * Photo gallery. Each section (album) either pulls its photos from a public
 * Google Photos album link (`album.sourceUrl`, fetched via /api/gphotos) or uses
 * photos uploaded on the site. Every photo opens a protected full-screen lightbox
 * so all can be viewed. Falls back to placeholder tiles when there are none. An
 * optional "buy photos" button appears next to the title.
 */
export default function Galeria({
  albums,
  tiles,
  photos,
  gallery,
}: {
  albums: Album[];
  tiles: { album: string }[];
  photos: GalleryPhoto[];
  gallery?: GalleryConfig;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [fetched, setFetched] = useState<
    Record<string, { thumb: string; full: string }[]>
  >({});

  // Fetch Google Photos albums (client-side). Degrades to empty on any failure.
  const sourceKey = albums.map((a) => a.sourceUrl ?? "").join("|");
  useEffect(() => {
    let alive = true;
    albums
      .filter((a) => a.sourceUrl)
      .forEach(async (a) => {
        try {
          const r = await fetch(`/api/gphotos?url=${encodeURIComponent(a.sourceUrl!)}`);
          const d = (await r.json()) as {
            ok: boolean;
            images?: { thumb: string; full: string }[];
          };
          if (alive && d.ok && d.images) {
            setFetched((prev) => ({ ...prev, [a.name]: d.images! }));
          }
        } catch {
          /* keep section empty */
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const sections = useMemo(() => {
    return (albums ?? [])
      .map((a) => {
        const items: GalleryItem[] = a.sourceUrl
          ? (fetched[a.name] ?? []).map((im) => ({ ...im, album: a.name }))
          : photos
              .filter((p) => p.album === a.name)
              .map((p) => ({ thumb: p.url, full: p.url, album: a.name }));
        return { name: a.name, items };
      })
      .filter((s) => s.items.length > 0);
  }, [albums, fetched, photos]);

  // Flat list (for the lightbox) + per-section start offset (for grid indices).
  const withStart = sections.map((s, si) => ({
    ...s,
    start: sections.slice(0, si).reduce((n, x) => n + x.items.length, 0),
  }));
  const flat = sections.flatMap((s) => s.items);
  const lightboxPhotos: GalleryPhoto[] = flat.map((it) => ({
    url: it.full,
    album: it.album,
  }));

  const hasPhotos = flat.length > 0;
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
          {withStart.map((section) => (
            <div key={section.name}>
              <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
                {section.name}
              </h3>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {section.items.map((item, i) => (
                  <Reveal
                    key={item.thumb}
                    delay={(i % 4) * 70}
                    className="relative h-[130px] overflow-hidden md:h-[190px]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(section.start + i)}
                      aria-label={`Ampliar foto ${i + 1} de ${section.name}`}
                      className="absolute inset-0 h-full w-full cursor-zoom-in"
                    >
                      <ProtectedImage src={item.thumb} alt={section.name} className="object-cover" />
                    </button>
                    <span className="pointer-events-none absolute bottom-2.5 left-2.5 z-10 rounded bg-black/45 px-1.5 py-0.5 font-[monospace] text-[11px] uppercase text-white/90">
                      {section.name}
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
          photos={lightboxPhotos}
          index={open}
          onClose={() => setOpen(null)}
          onIndex={setOpen}
        />
      )}
    </section>
  );
}
