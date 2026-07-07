"use client";

import { useEffect, useState } from "react";

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
}

function compute(target: string): Parts | null {
  const t = new Date(target).getTime() - Date.now();
  if (Number.isNaN(t) || t <= 0) return null;
  const s = Math.floor(t / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/** Live countdown to a date (client-only to avoid hydration mismatch). */
export default function Countdown({ date }: { date: string }) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParts(compute(date));
    const id = setInterval(() => setParts(compute(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!parts) return null;

  const cell = (n: number, label: string) => (
    <div className="text-center">
      <div className="font-display text-[22px] font-bold leading-none md:text-[30px]">
        {String(n).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.08em] opacity-70">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4">
      {cell(parts.d, "dias")}
      {cell(parts.h, "h")}
      {cell(parts.m, "min")}
      {cell(parts.s, "seg")}
    </div>
  );
}
