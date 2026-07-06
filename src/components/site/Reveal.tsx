"use client";

import { useEffect, useRef, useState, type ElementType, type CSSProperties } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stagger delay in ms. */
  delay?: number;
  as?: ElementType;
  id?: string;
}

/**
 * Scroll-reveal wrapper (Plano §4.4 "animações de entrada ao rolar a página").
 * Adds `.is-visible` when the element enters the viewport. Reduced-motion users
 * see content immediately (handled in globals.css).
 */
export default function Reveal({
  children,
  className = "",
  style,
  delay = 0,
  as,
  id,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      // Reveal immediately; matchMedia is unavailable during SSR so this must
      // run post-mount rather than in a render-time initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
