"use client";

const WATERMARK = "RUN4BRASILAFRICA";
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='170'><text x='8' y='95' transform='rotate(-22 160 85)' fill='white' fill-opacity='0.16' font-size='22' font-family='Arial, sans-serif' font-weight='700'>${WATERMARK}</text></svg>`;
export const WATERMARK_BG = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/**
 * Image with copy/save deterrents + a tiled watermark. A transparent top layer
 * intercepts right-click / long-press-save; the image can't be dragged. Combined
 * with ImageProtection + print CSS. (OS screenshots still capture the watermark.)
 */
export default function ProtectedImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div className="protected-media h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className={`pointer-events-none h-full w-full select-none ${className}`}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: WATERMARK_BG, backgroundRepeat: "repeat" }}
      />
      {/* Transparent catch layer (intercepts long-press/right-click save) */}
      <div
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden="true"
      />
    </div>
  );
}
