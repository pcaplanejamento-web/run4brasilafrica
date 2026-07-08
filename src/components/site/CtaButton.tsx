"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/track";

/**
 * Standard "inscreva-se" button used everywhere it appears (header, hero, …) so
 * every registration CTA is the exact same component. Gold pill with the clipped
 * corner; two sizes ("sm" = header, "lg" = hero). External links open in a new
 * tab automatically. Every click fires a GA4 `inscricao_click` conversion event
 * (no-op when analytics isn't configured).
 */
export default function CtaButton({
  href,
  children,
  size = "sm",
  onClick,
  className = "",
}: {
  href: string;
  children: ReactNode;
  size?: "sm" | "lg";
  onClick?: () => void;
  className?: string;
}) {
  const external = /^https?:\/\//.test(href);
  const sizeCls =
    size === "lg"
      ? "clip-cta-lg px-7 py-4 text-[15px] md:px-[34px] md:py-[17px] md:text-[16px]"
      : "clip-cta px-6 py-3 text-[14px]";
  return (
    <a
      href={href}
      onClick={() => {
        track("inscricao_click", { href });
        onClick?.();
      }}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-block whitespace-nowrap bg-gold font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 ${sizeCls} ${className}`}
    >
      {children}
    </a>
  );
}
