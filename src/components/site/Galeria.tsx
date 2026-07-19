"use client";

import { useEffect, useMemo, useState } from "react";
import type { Album, GalleryConfig, GalleryPhoto } from "@/lib/content/types";
import ProtectedImage from "./ProtectedImage";
import SlidePager from "./SlidePager";
import SectionEyebrow from "./SectionEyebrow";
import { useDragTrack } from "@/lib/useDragTrack";

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
  const [settled, setSettled] = useState(0);

  // Track the breakpoint (grid size differs on desktop vs mobile).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Fetch Google Photos albums (client-side). Degrades gracefully.
  const sourceKey = albums.map((a) => a.sourceUrl ?? "").join("|");
  const sourceCount = albums.filter((a) => a.sourceUrl).length;
  useEffect(() => {
    const srcs = albums.filter((a) => a.sourceUrl);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettled(0);
    let alive = true;
    srcs.forEach(async (a) => {
      try {
        const r = await fetch(`/api/gphotos?url=${encodeURIComponent(a.sourceUrl!)}`);
        const d = (await r.json()) as { ok: boolean; images?: { thumb: string }[] };
        if (alive && d.ok && d.images) {
          setFetched((prev) => ({ ...prev, [a.name]: d.images! }));
        }
      } catch {
        /* keep empty */
      } finally {
        if (alive) setSettled((n) => n + 1);
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

  // Finger-following swipe (same hook as the hero banner).
  const drag = useDragTrack({
    enabled: pageCount > 1,
    onGo: go,
    atStart: current === 0,
    atEnd: current === pageCount - 1,
  });

  const buyOn = !!gallery?.buyEnabled && !!gallery?.buyUrl;
  const hasPhotos = items.length > 0;
  const loadingPhotos = sourceCount > 0 && settled < sourceCount;
  const sourcesFailed = sourceCount > 0 && settled >= sourceCount && !hasPhotos;

  return (
    <section id="galeria" className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 md:mb-10">
        <SectionEyebrow as="h2">Galeria</SectionEyebrow>
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
            ref={drag.ref}
            className="gallery-slider touch-pan-y select-none overflow-hidden"
            {...drag.handlers}
          >
            <div
              className="flex"
              style={{
                transform: `translateX(calc(-${current * 100}% + ${drag.dragPct}%))`,
                transition: drag.dragging
                  ? "none"
                  : "transform 450ms cubic-bezier(0.22, 0.61, 0.36, 1)",
              }}
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

          <SlidePager
            count={pageCount}
            current={current}
            onGo={go}
            onSelect={setPage}
            tone="solid"
            prevLabel="Fotos anteriores"
            nextLabel="Próximas fotos"
            dotLabel={(i) => `Página ${i + 1}`}
            className="mt-5 w-full flex-wrap"
          />
        </div>
      ) : loadingPhotos ? (
        <div className="flex h-[160px] items-center justify-center text-[14px] text-muted">
          Carregando fotos…
        </div>
      ) : sourcesFailed ? (
        <div className="flex h-[160px] items-center justify-center rounded-lg border border-line bg-ink-panel px-5 text-center text-[14px] text-muted">
          Não foi possível carregar as fotos agora. Tente recarregar a página.
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
