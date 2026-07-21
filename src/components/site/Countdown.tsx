"use client";

import { useEffect, useState } from "react";
import { countdown, type CountdownParts } from "@/lib/content/datetime";

/** Live countdown to a date (client-only to avoid hydration mismatch). */
export default function Countdown({ date }: { date: string }) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParts(countdown(date, Date.now()));
    const id = setInterval(() => setParts(countdown(date, Date.now())), 1000);
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
