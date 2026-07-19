"use client";

import { useEffect, useRef, useState } from "react";
import type { Hero as HeroType, HeroSlide } from "@/lib/content/types";
import YouTubePlayer from "./YouTubePlayer";
import { youtubeId, isVerticalYouTube } from "@/lib/youtube";
import CtaButton from "./CtaButton";
import SlidePager from "./SlidePager";
import HeroMedia from "./HeroMedia";
import { useDragTrack } from "@/lib/useDragTrack";

const title = (s: HeroSlide) => s.title || s.text || "";
const ctaLabel = (s: HeroSlide) => s.ctaLabel || s.cta || "Inscreva-se";
const ctaUrl = (s: HeroSlide) => s.ctaUrl || "#inscricao";

const ANIM_MS = 450;

/**
 * Hero carousel with a real **infinite loop** (last → next → first, first → prev
 * → last), the way professional sites do it: the slides live in a horizontal
 * track that FOLLOWS THE FINGER while swiping and settles on release. To loop
 * seamlessly (no ugly sweep back across every slide), the first and last slides
 * are CLONED at the track edges — the track animates into a clone and then jumps
 * instantly (no transition) to the real slide at the same spot, so the wrap is
 * invisible. Drag mechanics come from the shared `useDragTrack` (same as the
 * gallery). Only the ACTIVE real slide mounts the YouTube player (others show a
 * poster), keeping a single player at a time. The pager below is the SAME
 * `SlidePager` as the gallery, in its numeric (current / total) mode.
 */
export default function Hero({ hero }: { hero: HeroType }) {
  const slides = hero.slides ?? [];
  const n = slides.length;
  const multi = n > 1;

  const [index, setIndex] = useState(0); // logical current slide (0…n-1)
  // Track position, in slide widths. With clones the real slide `i` sits at
  // pos `i + 1` (pos 0 = clone of last, pos n+1 = clone of first).
  const [pos, setPos] = useState(() => (n > 1 ? 1 : 0));
  const [instant, setInstant] = useState(false); // transition off for the seamless jump
  const [busy, setBusy] = useState(false); // a settle animation is in progress
  const [reduced, setReduced] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(
      hero.reduceMotion &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, [hero.reduceMotion]);

  // Keep index/pos valid if the slide count changes (ADM edit).
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, n - 1)));
    setPos(n > 1 ? 1 : 0);
    setInstant(false);
    setBusy(false);
  }, [n]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const go = (dir: number) => {
    if (!multi || busy) return;
    const step = dir < 0 ? -1 : 1;
    const nextIndex = (index + step + n) % n;

    if (reduced) {
      // Reduced motion: no animation, jump straight to the slide.
      setInstant(true);
      setIndex(nextIndex);
      setPos(nextIndex + 1);
      raf.current = requestAnimationFrame(() => setInstant(false));
      return;
    }

    const nextPos = pos + step; // may land on a clone edge (0 or n+1)
    setBusy(true);
    setInstant(false);
    setPos(nextPos);
    setIndex(nextIndex);

    timer.current = setTimeout(() => {
      // If we animated onto a clone, jump instantly to the matching real slide.
      if (nextPos < 1 || nextPos > n) {
        setInstant(true);
        setPos(nextIndex + 1);
        raf.current = requestAnimationFrame(() => setInstant(false));
      }
      setBusy(false);
    }, ANIM_MS + 30);
  };

  // Auto-advance (loops). Restarts on index change so a manual pick isn't
  // overridden; paused while a settle animation is running.
  useEffect(() => {
    if (!multi || reduced || busy) return;
    const ms = Math.max(2, hero.slideDurationSeconds || 6) * 1000;
    const id = setTimeout(() => go(1), ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, multi, reduced, busy, hero.slideDurationSeconds]);

  const drag = useDragTrack({ enabled: multi && !busy, onGo: go });

  if (n === 0) return null;

  // Slots to render: [cloneLast, ...slides, cloneFirst] when there's more than
  // one slide; just the single slide otherwise.
  const slots: { slide: HeroSlide; key: string; realIndex: number | null }[] =
    multi
      ? [
          { slide: slides[n - 1], key: `clone-last-${slides[n - 1].id}`, realIndex: null },
          ...slides.map((s, i) => ({ slide: s, key: s.id, realIndex: i })),
          { slide: slides[0], key: `clone-first-${slides[0].id}`, realIndex: null },
        ]
      : [{ slide: slides[0], key: slides[0].id, realIndex: 0 }];

  const renderSlot = (
    s: HeroSlide,
    active: boolean,
  ) => {
    const yt = s.mediaType === "video" ? youtubeId(s.videoUrl) : null;
    const ctaRight = s.ctaAlign === "right";
    const link = s.ctaEnabled === false ? (s.slideLink || "").trim() : "";
    const linkExternal = /^https?:\/\//.test(link);
    return (
      <>
        {/* Media: video fills the box (only the ACTIVE real slide mounts the
            player; clones/neighbours show a poster). Images use the desktop
            (16:9) / mobile (3:4) art via HeroMedia (shown whole, no crop). */}
        {s.mediaType === "video" && yt && active ? (
          <YouTubePlayer
            key={`yt-${s.id}-${yt}`}
            videoId={yt}
            startMuted={s.videoStartMuted !== false}
            vertical={isVerticalYouTube(s.videoUrl)}
            showControls={!!s.videoControls}
            showCaptions={!!s.videoCaptions}
          />
        ) : (
          <HeroMedia slide={s} variant="responsive" />
        )}

        {/* Clickable-banner link: only when there's no button and a link is set. */}
        {link && (
          <a
            href={link}
            aria-label={title(s) || "Abrir link do banner"}
            {...(linkExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="absolute inset-0 z-20"
          />
        )}

        {/* Only the banner's own content sits on top of the media. */}
        <div className="absolute inset-x-5 bottom-8 sm:inset-x-8 md:inset-x-14 md:bottom-12">
          {s.subtitle && (
            <div className="mb-5 inline-block bg-gold px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-gold-ink md:mb-[22px] md:text-[13px]">
              {s.subtitle}
            </div>
          )}

          <h1 className="max-w-[960px] font-display text-[44px] font-bold uppercase leading-[0.98] sm:text-[60px] md:text-[88px]">
            {title(s)}
          </h1>

          {s.ctaEnabled !== false && (
            <div
              className={`mt-7 flex md:mt-8 ${ctaRight ? "justify-end" : "justify-start"}`}
            >
              <CtaButton
                href={ctaUrl(s)}
                size="lg"
                variant={s.ctaVariant === "transparent" ? "transparent" : "solid"}
              >
                {ctaLabel(s)}
              </CtaButton>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <section
        id="top"
        ref={drag.ref}
        className="relative aspect-[3/4] max-h-[92vh] w-full touch-pan-y select-none overflow-hidden md:aspect-video"
        style={{ background: "var(--color-ink)" }}
        {...drag.handlers}
        onClickCapture={(e) => {
          // If the gesture was a swipe, cancel the click it may generate so it
          // doesn't also trigger the CTA button or the clickable-banner link.
          if (drag.swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            drag.swiped.current = false;
          }
        }}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(-${pos * 100}% + ${drag.dragPct}%))`,
            transition:
              drag.dragging || instant || reduced
                ? "none"
                : `transform ${ANIM_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
          }}
        >
          {slots.map(({ slide, key, realIndex }) => {
            const active = realIndex === index;
            return (
              <div
                key={key}
                aria-hidden={!active}
                className={`relative h-full w-full flex-none ${active ? "" : "pointer-events-none"}`}
              >
                {renderSlot(slide, active)}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pager BELOW the banner — same SlidePager as the photo gallery, in its
          numeric (current / total) mode. */}
      <SlidePager
        count={n}
        current={index}
        onGo={go}
        onSelect={setIndex}
        tone="solid"
        forceCounter
        prevLabel="Slide anterior"
        nextLabel="Próximo slide"
        dotLabel={(k) => `Ir para o slide ${k + 1}`}
        className="mt-5 w-full flex-wrap px-5 sm:px-8 md:px-14"
      />
    </div>
  );
}
