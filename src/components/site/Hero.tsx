"use client";

import { useEffect, useRef, useState } from "react";
import type { Hero as HeroType, HeroSlide } from "@/lib/content/types";
import YouTubePlayer from "./YouTubePlayer";
import { youtubeId, isVerticalYouTube } from "@/lib/youtube";
import CtaButton from "./CtaButton";
import SlidePager from "./SlidePager";
import HeroMedia from "./HeroMedia";

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
  // Swipe (touch/pointer) — same behaviour as the photo gallery. `swiped` guards
  // the clickable-banner link so a swipe doesn't also fire navigation.
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

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

  const ctaRight = slide.ctaAlign === "right";
  // When the slide has no button, the whole banner can be a link (ADM-configured).
  const bannerLink =
    slide.ctaEnabled === false ? (slide.slideLink || "").trim() : "";
  const bannerLinkExternal = /^https?:\/\//.test(bannerLink);
  const multi = slides.length > 1;

  // Swipe handlers (touch + mouse), only when there's more than one slide.
  const swipeHandlers = multi
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          startX.current = e.clientX;
          swiped.current = false;
        },
        onPointerUp: (e: React.PointerEvent) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 40) {
            swiped.current = true;
            go(dx < 0 ? 1 : -1);
          }
        },
        // If the gesture was a swipe, cancel the click it may generate so it
        // doesn't also trigger the CTA button or the clickable-banner link.
        onClickCapture: (e: React.MouseEvent) => {
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        },
      }
    : {};

  return (
    <div>
      <section
        id="top"
        className={`relative aspect-[3/4] max-h-[92vh] w-full overflow-hidden md:aspect-video ${multi ? "select-none" : ""}`}
        style={{ background: "var(--color-ink)" }}
        {...swipeHandlers}
      >
        {/* Media (one at a time). Video fills the box; images use the configured
            desktop (16:9) / mobile (3:4) art + focal point via HeroMedia. */}
        {slide.mediaType === "video" && ytId ? (
          <YouTubePlayer
            key={`yt-${slide.id}-${ytId}`}
            videoId={ytId}
            startMuted={slide.videoStartMuted !== false}
            vertical={isVerticalYouTube(slide.videoUrl)}
            showControls={!!slide.videoControls}
            showCaptions={!!slide.videoCaptions}
          />
        ) : (
          <HeroMedia key={`media-${slide.id}`} slide={slide} variant="responsive" />
        )}

        {/* No shadow overlay — the banner shows clean (user request). */}

        {/* Clickable-banner link: only when there's no button and a link is set. */}
        {bannerLink && (
          <a
            href={bannerLink}
            aria-label={title(slide) || "Abrir link do banner"}
            {...(bannerLinkExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="absolute inset-0 z-20"
          />
        )}

        {/* Only the banner's own content sits on top of the media. */}
        <div className="absolute inset-x-5 bottom-8 sm:inset-x-8 md:inset-x-14 md:bottom-12">
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

          {/* CTA is optional per-slide (ctaEnabled) and its side is per-slide
              (ctaAlign), so it can be hidden or dodge the artwork. */}
          {slide.ctaEnabled !== false && (
            <div className={`mt-7 flex md:mt-8 ${ctaRight ? "justify-end" : "justify-start"}`}>
              <CtaButton
                key={`cta-${i}`}
                href={url}
                size="lg"
                variant={slide.ctaVariant === "transparent" ? "transparent" : "solid"}
                className={fade}
              >
                {ctaLabel(slide)}
              </CtaButton>
            </div>
          )}
        </div>
      </section>

      {/* Pager lives BELOW the banner — same component and same setup as the
          photo gallery — so nothing covers the 16:9 / 3:4 artwork. */}
      <SlidePager
        count={slides.length}
        current={i}
        onGo={go}
        onSelect={setIndex}
        tone="solid"
        prevLabel="Slide anterior"
        nextLabel="Próximo slide"
        dotLabel={(k) => `Ir para o slide ${k + 1}`}
        className="mt-5 w-full flex-wrap px-5 sm:px-8 md:px-14"
      />
    </div>
  );
}
