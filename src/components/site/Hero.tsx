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

/**
 * Hero carousel. Only created slides appear (0 → nothing). All slides live in a
 * horizontal track that FOLLOWS THE FINGER while swiping (touch/mouse) and
 * settles to the neighbour on release — the professional-carousel feel, shared
 * with the photo gallery via `useDragTrack`. Non-wrapping (clamped at the ends,
 * rubber-band resistance); auto-advance ping-pongs (bounces) instead of jumping
 * across. Each slide brings its own media (image or YouTube video), highlight,
 * title and button; only the ACTIVE slide mounts the video player (others show a
 * poster), keeping a single player at a time. The pager below is the SAME
 * `SlidePager` as the gallery, in its numeric (current / total) mode.
 */
export default function Hero({ hero }: { hero: HeroType }) {
  const slides = hero.slides ?? [];
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  // Auto-advance direction (ping-pong at the ends).
  const dirRef = useRef<1 | -1>(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(
      hero.reduceMotion &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, [hero.reduceMotion]);

  const last = slides.length - 1;
  const clampIndex = (n: number) => Math.max(0, Math.min(last, n));

  // Auto-advance (restarts on index change so a manual pick isn't overridden).
  useEffect(() => {
    if (slides.length <= 1 || reduced) return;
    const ms = Math.max(2, hero.slideDurationSeconds || 6) * 1000;
    const id = setTimeout(() => {
      setIndex((i) => {
        let d = dirRef.current;
        let n = i + d;
        if (n > last) {
          d = -1;
          n = i - 1;
        } else if (n < 0) {
          d = 1;
          n = i + 1;
        }
        dirRef.current = d;
        return Math.max(0, Math.min(last, n));
      });
    }, ms);
    return () => clearTimeout(id);
  }, [index, slides.length, reduced, hero.slideDurationSeconds, last]);

  const go = (dir: number) => {
    dirRef.current = dir < 0 ? -1 : 1;
    setIndex((i) => clampIndex(i + dir));
  };

  const multi = slides.length > 1;
  const drag = useDragTrack({
    enabled: multi,
    onGo: go,
    atStart: index === 0,
    atEnd: index === last,
  });

  if (slides.length === 0) return null;

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
            transform: `translateX(calc(-${index * 100}% + ${drag.dragPct}%))`,
            transition:
              drag.dragging || reduced
                ? "none"
                : "transform 450ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        >
          {slides.map((s, k) => {
            const active = k === index;
            const yt = s.mediaType === "video" ? youtubeId(s.videoUrl) : null;
            const ctaRight = s.ctaAlign === "right";
            const link =
              s.ctaEnabled === false ? (s.slideLink || "").trim() : "";
            const linkExternal = /^https?:\/\//.test(link);
            return (
              <div
                key={s.id}
                aria-hidden={!active}
                className={`relative h-full w-full flex-none ${active ? "" : "pointer-events-none"}`}
              >
                {/* Media: video fills the box (only the ACTIVE slide mounts the
                    player; others show a poster). Images use the desktop (16:9) /
                    mobile (3:4) art via HeroMedia (shown whole, no crop). */}
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

                {/* Clickable-banner link: only when there's no button and a link
                    is set (active slide only — neighbours are pointer-events-none). */}
                {link && (
                  <a
                    href={link}
                    aria-label={title(s) || "Abrir link do banner"}
                    {...(linkExternal
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
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
                        variant={
                          s.ctaVariant === "transparent" ? "transparent" : "solid"
                        }
                      >
                        {ctaLabel(s)}
                      </CtaButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pager BELOW the banner — same SlidePager as the photo gallery, in its
          numeric (current / total) mode. */}
      <SlidePager
        count={slides.length}
        current={index}
        onGo={go}
        onSelect={(i) => setIndex(clampIndex(i))}
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
