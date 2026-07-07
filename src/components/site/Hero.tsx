"use client";

import { useEffect, useState } from "react";
import type { Hero as HeroType, HeroSlide } from "@/lib/content/types";
import YouTubePlayer, { youtubeId, isVerticalYouTube } from "./YouTubePlayer";
import CtaButton from "./CtaButton";
import SlidePager from "./SlidePager";

const title = (s: HeroSlide) => s.title || s.text || "";
const ctaLabel = (s: HeroSlide) => s.ctaLabel || s.cta || "Inscreva-se";
const ctaUrl = (s: HeroSlide) => s.ctaUrl || "#inscricao";

/**
 * Hero carousel. Only created slides appear (0 → nothing). Each slide brings its
 * own media (uploaded image OR YouTube video), highlight, title and button.
 * Renders one slide at a time (single player), auto-advances (respecting
 * reduced-motion) and lets the visitor jump between slides.
 */
export default function Hero({ hero }: { hero: HeroType }) {
  const slides = hero.slides ?? [];
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(
      hero.reduceMotion &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, [hero.reduceMotion]);

  // Auto-advance. Depends on `index` so a manual pick (indicator) restarts the
  // countdown from that slide instead of being overridden mid-interval.
  useEffect(() => {
    if (slides.length <= 1 || reduced) return;
    const ms = Math.max(2, hero.slideDurationSeconds || 6) * 1000;
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), ms);
    return () => clearTimeout(id);
  }, [slides.length, reduced, hero.slideDurationSeconds, index]);

  const go = (dir: number) =>
    setIndex((k) => (k + dir + slides.length) % slides.length);

  if (slides.length === 0) return null;
  const i = Math.min(index, slides.length - 1);
  const slide = slides[i];
  const ytId = slide.mediaType === "video" ? youtubeId(slide.videoUrl) : null;
  const url = ctaUrl(slide);
  const fade = reduced ? "" : "r4ba-fade";

  return (
    <section
      id="top"
      className="clip-hero relative min-h-[540px] overflow-hidden md:h-[680px]"
      style={{ background: "var(--color-ink)" }}
    >
      {/* Media (one at a time) */}
      {slide.mediaType === "image" && slide.image ? (
        <div
          key={`img-${slide.id}`}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : ytId ? (
        <YouTubePlayer
          key={`yt-${slide.id}-${ytId}`}
          videoId={ytId}
          startMuted={slide.videoStartMuted !== false}
          vertical={isVerticalYouTube(slide.videoUrl)}
          showControls={!!slide.videoControls}
          showCaptions={!!slide.videoCaptions}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(-25deg, oklch(0.62 0.16 35) 0 30px, oklch(0.55 0.16 32) 30px 60px)",
          }}
        />
      )}

      {/* Legibility overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(0deg, rgba(10,8,6,.85), transparent 55%)" }}
      />

      <div className="absolute inset-x-5 bottom-12 sm:inset-x-8 md:inset-x-14 md:bottom-[90px]">
        {slide.subtitle && (
          <div
            key={`sub-${i}`}
            className={`mb-5 inline-block bg-gold px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-gold-ink md:mb-[22px] md:text-[13px] ${fade}`}
          >
            {slide.subtitle}
          </div>
        )}

        <h1
          key={`title-${i}`}
          className={`max-w-[960px] font-display text-[44px] font-bold uppercase leading-[0.98] sm:text-[60px] md:text-[88px] ${fade}`}
        >
          {title(slide)}
        </h1>

        <div className="mt-7 md:mt-8">
          <CtaButton key={`cta-${i}`} href={url} size="lg" className={fade}>
            {ctaLabel(slide)}
          </CtaButton>
        </div>

        {/* Mobile: pager isolated, centered, right below the button. */}
        {slides.length > 1 && (
          <div className="mt-7 flex justify-center md:hidden">
            <SlidePager
              count={slides.length}
              current={i}
              onGo={go}
              onSelect={setIndex}
              tone="overlay"
              prevLabel="Slide anterior"
              nextLabel="Próximo slide"
              dotLabel={(k) => `Ir para o slide ${k + 1}`}
            />
          </div>
        )}
      </div>

      {/* Desktop: pager floats at the bottom-right of the banner. */}
      {slides.length > 1 && (
        <div className="absolute bottom-[90px] right-14 z-10 hidden md:flex">
          <SlidePager
            count={slides.length}
            current={i}
            onGo={go}
            onSelect={setIndex}
            tone="overlay"
            prevLabel="Slide anterior"
            nextLabel="Próximo slide"
            dotLabel={(k) => `Ir para o slide ${k + 1}`}
          />
        </div>
      )}
    </section>
  );
}
