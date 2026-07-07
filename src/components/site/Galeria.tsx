"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Album, GalleryConfig, GalleryPhoto } from "@/lib/content/types";
import ProtectedImage from "./ProtectedImage";

interface GalleryItem {
  thumb: string;
  album: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Photo gallery as a **sliding grid**: photos (pulled from each section's public
 * Google Photos album via /api/gphotos, plus any uploaded ones) are paginated
 * into grid pages that auto-advance and can be swiped. The grid size (columns ×
 * rows) is configurable per breakpoint in ADM and adapts to the screen. No
 * lightbox / no zoom, and the section is hidden on print (anti-copy).
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
  const [fetched, setFetched] = useState<
    Record<string, { thumb: string }[]>
  >({});
  const [mobile, setMobile] = useState(false);
  const [page, setPage] = useState(0);
  const startX = useRef<number | null>(null);

  // Track the breakpoint (grid size differs on desktop vs mobile).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Fetch Google Photos albums (client-side). Degrades to empty on failure.
  const sourceKey = albums.map((a) => a.sourceUrl ?? "").join("|");
  useEffect(() => {
    let alive = true;
    albums
      .filter((a) => a.sourceUrl)
      .forEach(async (a) => {
        try {
          const r = await fetch(`/api/gphotos?url=${encodeURIComponent(a.sourceUrl!)}`);
          const d = (await r.json()) as { ok: boolean; images?: { thumb: string }[] };
          if (alive && d.ok && d.images) {
            setFetched((prev) => ({ ...prev, [a.name]: d.images! }));
          }
        } catch {
          /* keep empty */
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const items: GalleryItem[] = useMemo(() => {
    const out: GalleryItem[] = [];
    (albums ?? []).forEach((a) => {
      if (a.sourceUrl) {
        (fetched[a.name] ?? []).forEach((im) => out.push({ thumb: im.thumb, album: a.name }));
      } else {
        photos
          .filter((p) => p.album === a.name)
          .forEach((p) => out.push({ thumb: p.url, album: a.name }));
      }
    });
    // Uploaded photos whose album isn't in `albums` (legacy) still show.
    photos
      .filter((p) => !(albums ?? []).some((a) => a.name === p.album))
      .forEach((p) => out.push({ thumb: p.url, album: p.album }));
    return out;
  }, [albums, fetched, photos]);

  const cols = Math.max(
    1,
    (mobile ? gallery?.slideColsMobile : gallery?.slideCols) ?? (mobile ? 2 : 3),
  );
  const rows = Math.max(
    1,
    (mobile ? gallery?.slideRowsMobile : gallery?.slideRows) ?? (mobile ? 3 : 2),
  );
  const pageSize = cols * rows;
  const pages = useMemo(() => chunk(items, pageSize), [items, pageSize]);
  const pageCount = pages.length;
  // `page` may exceed the current count after a breakpoint change; everything
  // (display, nav, autoplay) uses this clamped/modulo'd value so no reset needed.
  const current = pageCount ? ((page % pageCount) + pageCount) % pageCount : 0;

  // Auto-advance (restarts when the page changes so manual picks aren't overridden).
  useEffect(() => {
    if (pageCount <= 1) return;
    const secs = Math.max(2, gallery?.slideSeconds || 5);
    const id = setTimeout(() => setPage((p) => (p + 1) % pageCount), secs * 1000);
    return () => clearTimeout(id);
  }, [current, pageCount, gallery?.slideSeconds]);

  const go = (dir: number) =>
    setPage((p) => (p + dir + pageCount) % pageCount);

  const buyOn = !!gallery?.buyEnabled && !!gallery?.buyUrl;
  const hasPhotos = items.length > 0;

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
        <div className="relative">
          <div
            className="gallery-slider overflow-hidden select-none"
            onPointerDown={(e) => (startX.current = e.clientX)}
            onPointerUp={(e) => {
              if (startX.current === null) return;
              const dx = e.clientX - startX.current;
              startX.current = null;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            }}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {pages.map((pg, pi) => (
                <div
                  key={pi}
                  className="grid w-full flex-none gap-2.5"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {pg.map((item, i) => (
                    <div
                      key={`${pi}-${i}-${item.thumb}`}
                      className="relative aspect-[4/3] overflow-hidden rounded"
                    >
                      <ProtectedImage src={item.thumb} alt={item.album} className="object-cover" />
                      <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 rounded bg-black/45 px-1.5 py-0.5 font-[monospace] text-[10px] uppercase text-white/90">
                        {item.album}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {pageCount > 1 && (
            <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Fotos anteriores"
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink-panel text-cream transition-colors hover:bg-ink-card"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {pageCount <= 12 ? (
                <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
                  {pages.map((_, k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPage(k)}
                      aria-label={`Página ${k + 1}`}
                      aria-current={k === current ? "true" : undefined}
                      className="flex h-8 items-center px-1"
                    >
                      <span
                        className={`block h-2 rounded-full transition-all ${
                          k === current ? "w-6 bg-gold" : "w-2 bg-white/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[13px] font-semibold text-muted-strong">
                  {current + 1} / {pageCount}
                </span>
              )}

              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Próximas fotos"
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink-panel text-cream transition-colors hover:bg-ink-card"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {tiles.map((g, i) => (
            <div
              key={i}
              className="relative h-[130px] md:h-[190px]"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, oklch(0.5 0.1 40) 0 18px, oklch(0.44 0.1 38) 18px 36px)",
              }}
            >
              <span className="absolute bottom-2.5 left-2.5 font-[monospace] text-[11px] uppercase text-white/85">
                {g.album}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
