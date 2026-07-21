"use client";

import { useRef, useState } from "react";

/**
 * Finger-following drag for a horizontal slide track (touch + mouse), the way
 * professional carousels feel: while the finger moves, the track follows it in
 * real time (`dragPct`, a % of the container width); on release past a threshold
 * it commits with `onGo(±1)`, otherwise it springs back. `atStart`/`atEnd` add an
 * iOS-style rubber-band so a non-wrapping track doesn't reveal empty edges.
 *
 * The SAME hook powers the hero banner and the photo gallery so both slide alike.
 * `swiped` lets the consumer cancel the click a drag would otherwise fire (so a
 * swipe doesn't also trigger a button/link).
 */
export function useDragTrack({
  enabled,
  onGo,
  atStart = false,
  atEnd = false,
}: {
  enabled: boolean;
  onGo: (dir: 1 | -1) => void;
  atStart?: boolean;
  atEnd?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const width = useRef(1);
  const [dragPct, setDragPct] = useState(0);
  const [dragging, setDragging] = useState(false);
  const swiped = useRef(false);

  const down = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    width.current = ref.current?.offsetWidth || 1;
    swiped.current = false;
    setDragging(true);
  };

  const move = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 3) swiped.current = true;
    let pct = (dx / width.current) * 100;
    if ((pct > 0 && atStart) || (pct < 0 && atEnd)) pct /= 3; // rubber-band
    setDragPct(pct);
  };

  const up = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    setDragging(false);
    setDragPct(0);
    if (Math.abs(dx) > width.current * 0.15 || Math.abs(dx) > 60) {
      onGo(dx < 0 ? 1 : -1);
    }
  };

  const handlers = enabled
    ? {
        onPointerDown: down,
        onPointerMove: move,
        onPointerUp: up,
        onPointerCancel: up,
        // Safety: if the pointer leaves mid-drag (no capture, so native vertical
        // page scroll keeps working), treat it as a release.
        onPointerLeave: up,
      }
    : {};

  /** Consome o flag de swipe (lê e zera). O consumidor chama isto no clique para
   *  cancelar o clique que um arrasto geraria — a mutação do ref fica DENTRO do
   *  hook (onde é permitida), não no render/handler do consumidor. */
  const wasSwiped = () => {
    const s = swiped.current;
    swiped.current = false;
    return s;
  };

  return { ref, dragPct: dragging ? dragPct : 0, dragging, handlers, wasSwiped };
}
