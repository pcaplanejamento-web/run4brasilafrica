"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/track";

/**
 * Standard "inscreva-se" button used everywhere it appears (header, hero, …) so
 * every registration CTA is the exact same component. Clipped corner in both
 * variants; two sizes ("sm" = header, "lg" = hero). External links open in a new
 * tab automatically. Every click fires a GA4 `inscricao_click` conversion event
 * (no-op when analytics isn't configured).
 *
 * Variants (same design language, different weight):
 *  - "solid" (default) — filled gold, for CTAs that must dominate.
 *  - "transparent" — translucent gold tint + blur, so a busy photo still reads
 *    through it while the gold text stays legible. No border: `clip-path` would
 *    cut a border/inset-shadow off along the diagonal edges, so the clipped
 *    silhouette itself carries the shape.
 */
export default function CtaButton({
  href,
  children,
  size = "sm",
  variant = "solid",
  onClick,
  className = "",
}: {
  href: string;
  children: ReactNode;
  size?: "sm" | "lg";
  variant?: "solid" | "transparent";
  onClick?: () => void;
  className?: string;
}) {
  const external = /^https?:\/\//.test(href);
  const sizeCls =
    size === "lg"
      ? "clip-cta-lg px-7 py-4 text-[15px] md:px-[34px] md:py-[17px] md:text-[16px]"
      : "clip-cta px-6 py-3 text-[14px]";
  const toneCls =
    variant === "transparent"
      ? "bg-gold/25 text-gold backdrop-blur-md hover:bg-gold/40"
      : "bg-gold text-gold-ink";
  return (
    <a
      href={href}
      onClick={() => {
        track("inscricao_click", { href });
        onClick?.();
      }}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-block whitespace-nowrap font-bold uppercase transition-[transform,background-color] hover:-translate-y-0.5 ${toneCls} ${sizeCls} ${className}`}
    >
      {children}
    </a>
  );
}
