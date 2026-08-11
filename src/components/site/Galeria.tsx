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

/** Botão "comprar fotos" resolvido de uma seção (o dela; se ausente, herda o
 *  global legado de `GalleryConfig` — migração suave sem perder o link antigo). */
function albumBuy(a: Album | undefined, g?: GalleryConfig) {
  const enabled = a?.buyEnabled ?? g?.buyEnabled ?? false;
  const url = a?.buyUrl ?? g?.buyUrl ?? "";
  const label = a?.buyLabel ?? g?.buyLabel ?? "";
  return { on: !!enabled && !!url.trim(), url, label };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Galeria em **abas**: cada seção (álbum) vira uma aba; o visitante escolhe qual
 * ver e só as fotos daquela seção aparecem. Cada seção tem o **seu próprio botão
 * "comprar fotos"**. A ordem das seções (definida no ADM) manda — a primeira é a
 * que abre. As fotos vêm do álbum público do Google Fotos (via /api/gphotos) ou
 * dos envios. Dentro da aba, as fotos formam uma **grade deslizante** que avança
 * sozinha e aceita swipe. Sem lightbox/zoom e escondida na impressão (anti-cópia).
 */
export default function Galeria({
  albums,
  photos,
  gallery,
}: {
  albums: Album[];
  /** Legado (placeholder global) — não usado com abas; mantido p/ compatibilidade. */
  tiles?: { album: string }[];
  photos: GalleryPhoto[];
  gallery?: GalleryConfig;
}) {
  const [fetched, setFetched] = useState<Record<string, { thumb: string }[]>>({});
  const [mobile, setMobile] = useState(false);
  const [page, setPage] = useState(0);
  const [settled, setSettled] = useState(0);
  const [active, setActive] = useState(0);

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

  // Seções em ORDEM (a do ADM manda): álbuns configurados + álbuns legados que só
  // existem nas fotos enviadas (aparecem ao final, para nada sumir).
  const sections: { album?: Album; name: string }[] = useMemo(() => {
    const list: { album?: Album; name: string }[] = (albums ?? []).map((a) => ({
      album: a,
      name: a.name,
    }));
    const known = new Set(list.map((s) => s.name));
    photos.forEach((p) => {
      if (!known.has(p.album)) {
        known.add(p.album);
        list.push({ name: p.album });
      }
    });
    return list;
  }, [albums, photos]);

  // Fotos de UMA seção (Google Fotos quando há link; senão, os envios do álbum).
  const itemsOf = (name: string, album?: Album): GalleryItem[] => {
    if (album?.sourceUrl) {
      return (fetched[name] ?? []).map((im) => ({ thumb: im.thumb, album: name }));
    }
    return photos.filter((p) => p.album === name).map((p) => ({ thumb: p.url, album: name }));
  };

  // Índice ativo sempre dentro do intervalo (seções podem mudar de tamanho).
  const activeIdx = sections.length ? Math.min(active, sections.length - 1) : 0;
  const activeSection = sections[activeIdx];
  const items = useMemo(
    () => (activeSection ? itemsOf(activeSection.name, activeSection.album) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSection?.name, fetched, photos],
  );

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
  // `page` may exceed the current count after a breakpoint/tab change; everything
  // (display, nav, autoplay) uses this clamped/modulo'd value so no reset needed.
  const current = pageCount ? ((page % pageCount) + pageCount) % pageCount : 0;

  // Auto-advance (restarts when the page changes so manual picks aren't overridden).
  useEffect(() => {
    if (pageCount <= 1) return;
    const secs = Math.max(2, gallery?.slideSeconds || 5);
    const id = setTimeout(() => setPage((p) => (p + 1) % pageCount), secs * 1000);
    return () => clearTimeout(id);
  }, [current, pageCount, gallery?.slideSeconds]);

  const go = (dir: number) => setPage((p) => (p + dir + pageCount) % pageCount);

  // Trocar de aba: ativa a seção e volta a grade para a 1ª página.
  const selectAlbum = (i: number) => {
    setActive(i);
    setPage(0);
  };

  // Finger-following swipe (same hook as the hero banner).
  const {
    ref: dragRef,
    dragPct,
    dragging,
    handlers: dragHandlers,
  } = useDragTrack({
    enabled: pageCount > 1,
    onGo: go,
    atStart: current === 0,
    atEnd: current === pageCount - 1,
  });

  const buy = albumBuy(activeSection?.album, gallery);
  const hasPhotos = items.length > 0;
  const activeHasSource = !!activeSection?.album?.sourceUrl;
  const activeFetched = activeSection ? fetched[activeSection.name] !== undefined : false;
  const loadingPhotos = activeHasSource && !activeFetched && settled < sourceCount;
  const sourceFailed = activeHasSource && !activeFetched && settled >= sourceCount && !hasPhotos;

  return (
    <section id="galeria" className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <SectionEyebrow as="h2">Galeria</SectionEyebrow>
        {buy.on && (
          <a
            href={buy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="clip-cta-lg inline-block bg-gold px-6 py-3 text-[13px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:text-[14px]"
          >
            {buy.label || "Comprar fotos"}
          </a>
        )}
      </div>

      {/* Abas das seções — o visitante escolhe qual ver. Rola no toque (mobile). */}
      {sections.length > 1 && (
        <div
          role="tablist"
          aria-label="Seções de fotos"
          className="mb-7 flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap"
        >
          {sections.map((s, i) => {
            const on = i === activeIdx;
            return (
              <button
                key={`${s.name}-${i}`}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => selectAlbum(i)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold uppercase tracking-[0.03em] transition-colors ${
                  on
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-line bg-ink-panel text-muted hover:border-terracotta hover:text-fg"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {hasPhotos ? (
        <div className="relative">
          <div
            ref={dragRef}
            className="gallery-slider touch-pan-y select-none overflow-hidden"
            {...dragHandlers}
          >
            <div
              className="flex"
              style={{
                transform: `translateX(calc(-${current * 100}% + ${dragPct}%))`,
                transition: dragging
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
      ) : sourceFailed ? (
        <div className="flex h-[160px] items-center justify-center rounded-lg border border-line bg-ink-panel px-5 text-center text-[14px] text-muted">
          Não foi possível carregar as fotos desta seção agora. Tente recarregar a página.
        </div>
      ) : (
        // Sem fotos nesta seção ainda — placeholder decorativo (uma linha de tiles).
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative h-[130px] md:h-[190px]"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, oklch(0.5 0.1 40) 0 18px, oklch(0.44 0.1 38) 18px 36px)",
              }}
            >
              {i === 0 && (
                <span className="absolute bottom-2.5 left-2.5 font-[monospace] text-[11px] uppercase text-white/85">
                  {activeSection?.name ?? "Em breve"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
