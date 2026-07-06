"use client";

import { useEffect, useRef, useState } from "react";

interface CounterProps {
  /** Raw label such as "3.200+", "R$ 180 mil" or "4". */
  value: string;
  className?: string;
  durationMs?: number;
}

interface Parsed {
  prefix: string;
  target: number;
  suffix: string;
  grouped: boolean;
}

/** Split "R$ 180 mil" -> { prefix: "R$ ", target: 180, suffix: " mil" }. */
function parseValue(raw: string): Parsed | null {
  const match = raw.match(/([\d.]*\d)/);
  if (!match) return null;
  const numeric = match[1];
  const target = parseInt(numeric.replace(/\./g, ""), 10);
  if (Number.isNaN(target)) return null;
  return {
    prefix: raw.slice(0, match.index),
    target,
    suffix: raw.slice((match.index ?? 0) + numeric.length),
    grouped: numeric.includes("."),
  };
}

const ptBR = new Intl.NumberFormat("pt-BR");

/**
 * Animated impact counter (Plano §4.4). Counts up once when scrolled into view.
 * Falls back to the final value instantly for reduced-motion users or if the
 * label has no number.
 */
export default function Counter({
  value,
  className,
  durationMs = 1400,
}: CounterProps) {
  const parsed = parseValue(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<string>(parsed ? "" : value);

  useEffect(() => {
    if (!parsed) return;
    const node = ref.current;
    if (!node) return;

    const format = (n: number) =>
      `${parsed.prefix}${parsed.grouped ? ptBR.format(n) : n}${parsed.suffix}`;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      // Jump to final value; matchMedia is client-only so this can't be a
      // render-time initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(format(parsed.target));
      return;
    }

    setDisplay(format(0));
    let raf = 0;
    let start = 0;

    const run = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(format(Math.round(parsed.target * eased)));
      if (t < 1) raf = requestAnimationFrame(run);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            raf = requestAnimationFrame(run);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
