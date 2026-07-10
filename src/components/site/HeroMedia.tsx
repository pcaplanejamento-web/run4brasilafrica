import type { HeroSlide } from "@/lib/content/types";

/** Diagonal-stripe placeholder shown when a slide has no image yet. */
const PLACEHOLDER =
  "repeating-linear-gradient(-25deg, oklch(0.62 0.16 35) 0 30px, oklch(0.55 0.16 32) 30px 60px)";

function clampPct(n: number | undefined): number {
  const v = typeof n === "number" ? n : 50;
  return Math.max(0, Math.min(100, v));
}

/** object-position string from a focal point (defaults to centered). */
export function focusPos(x?: number, y?: number): string {
  return `${clampPct(x)}% ${clampPct(y)}%`;
}

function Layer({
  img,
  position,
  className = "",
}: {
  img?: string;
  position: string;
  className?: string;
}) {
  if (!img) {
    return <div className={`absolute inset-0 ${className}`} style={{ background: PLACEHOLDER }} />;
  }
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url(${img})`,
        backgroundSize: "cover",
        backgroundPosition: position,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

/**
 * Renders a hero slide's IMAGE media (not video), filling its container.
 *
 * The SAME component powers the live banner and the ADM preview so they always
 * match. Variants:
 *  - "responsive": desktop image on ≥md, mobile image (falls back to desktop)
 *    below md — used inside the public hero box (16:9 on desktop, 3:4 on mobile).
 *  - "desktop" / "mobile": a single framing, for the ADM preview boxes.
 * Each variant uses its own focal point (object-position).
 */
export default function HeroMedia({
  slide,
  variant,
}: {
  slide: HeroSlide;
  variant: "desktop" | "mobile" | "responsive";
}) {
  const desktopImg = slide.image;
  const mobileImg = slide.imageMobile || slide.image;
  const desktopPos = focusPos(slide.focusX, slide.focusY);
  const mobilePos = focusPos(slide.focusXm, slide.focusYm);

  if (variant === "desktop") return <Layer img={desktopImg} position={desktopPos} />;
  if (variant === "mobile") return <Layer img={mobileImg} position={mobilePos} />;

  return (
    <>
      <Layer img={desktopImg} position={desktopPos} className="hidden md:block" />
      <Layer img={mobileImg} position={mobilePos} className="md:hidden" />
    </>
  );
}
