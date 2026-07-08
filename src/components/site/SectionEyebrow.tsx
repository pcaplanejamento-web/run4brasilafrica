import type { ReactNode } from "react";

/**
 * The shared section title used by every homepage topic — the small uppercase
 * accent label (e.g. "O PERCURSO"). It is rendered in the accent color
 * (`text-gold`, which maps to the theme's `--color-gold` / "cor de destaque"),
 * so changing that color in the ADM updates every section title at once.
 *
 * Sections that only have a name pass `as="h2"` (semantic heading); sections
 * that also have a big slogan headline keep this as a `div` kicker above it.
 */
export default function SectionEyebrow({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "div";
}) {
  return (
    <Tag className={`text-[16px] font-bold uppercase tracking-[0.1em] text-gold md:text-[20px] ${className}`}>
      {children}
    </Tag>
  );
}
