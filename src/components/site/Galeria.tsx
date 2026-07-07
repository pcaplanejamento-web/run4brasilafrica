import type { GalleryPhoto } from "@/lib/content/types";
import Reveal from "./Reveal";

/**
 * Photo gallery grid. Shows real photos uploaded via ADM > Galeria when present;
 * otherwise falls back to labelled placeholder tiles (Plano §4.1.2).
 */
export default function Galeria({
  tiles,
  photos,
}: {
  tiles: { album: string }[];
  photos: GalleryPhoto[];
}) {
  const hasPhotos = photos.length > 0;
  return (
    <section id="galeria" className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <h2 className="mb-8 font-display text-[30px] font-bold uppercase md:mb-10 md:text-[36px]">
        Galeria
      </h2>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {hasPhotos
          ? photos.map((p, i) => (
              <Reveal
                key={p.url}
                delay={(i % 4) * 70}
                className="relative h-[130px] overflow-hidden md:h-[190px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.album} className="h-full w-full object-cover" />
                <span className="absolute bottom-2.5 left-2.5 rounded bg-black/45 px-1.5 py-0.5 font-[monospace] text-[11px] uppercase text-white/90">
                  {p.album}
                </span>
              </Reveal>
            ))
          : tiles.map((g, i) => (
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
    </section>
  );
}
