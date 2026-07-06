import Reveal from "./Reveal";

/**
 * Photo gallery grid. Tiles are placeholders for images uploaded via
 * ADM > Galeria (Plano §4.1.2); each is tagged with its album name.
 */
export default function Galeria({ tiles }: { tiles: { album: string }[] }) {
  return (
    <section id="galeria" className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <h2 className="mb-8 font-display text-[30px] font-bold uppercase md:mb-10 md:text-[36px]">
        Galeria
      </h2>
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
    </section>
  );
}
