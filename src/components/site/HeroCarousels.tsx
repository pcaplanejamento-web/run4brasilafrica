"use client";

import { useEffect, useState } from "react";
import type { HeroCarousel } from "@/lib/content/types";
import { activeCarousel, nextBoundary } from "@/lib/content/carousels";
import Hero from "./Hero";

/**
 * Picks which banner carousel is on air right now and renders it. Only one shows
 * at a time (chosen by date/time in `carousels.ts`); the default carousel is the
 * perpetual fallback so it's never empty. Selection runs on the CLIENT so it's
 * always exact and swaps live at the scheduled moment (a timer fires on the next
 * schedule boundary) — no reload, no lag. `initialId` is the server's pick so the
 * first paint matches SSR (no hydration flash); the client reconciles on mount.
 * `<Hero key>` forces a clean remount when the active carousel changes.
 */
export default function HeroCarousels({
  carousels,
  initialId,
}: {
  carousels: HeroCarousel[];
  initialId: string;
}) {
  const [activeId, setActiveId] = useState(initialId);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const pick = () => {
      if (!alive) return;
      const now = Date.now();
      const a = activeCarousel(carousels, now);
      if (a) setActiveId(a.id);
      const nb = nextBoundary(carousels, now);
      if (nb !== null) {
        // Re-evaluate exactly at the next boundary (capped so a far-future date
        // doesn't schedule an unreasonably long timer).
        const delay = Math.min(Math.max(nb - now + 50, 500), 6 * 60 * 60 * 1000);
        timer = setTimeout(pick, delay);
      }
    };

    pick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [carousels]);

  const active = carousels.find((c) => c.id === activeId) ?? carousels[0];
  if (!active) return null;
  return <Hero key={active.id} hero={active} />;
}
