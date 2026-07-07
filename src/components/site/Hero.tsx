"use client";

import { useEffect, useRef, useState } from "react";
import type { Hero as HeroType } from "@/lib/content/types";

/** Extract a YouTube video ID from watch/youtu.be/embed links. */
function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  if (m) return m[1];
  const bare = url.match(/^[\w-]{11}$/);
  return bare ? bare[0] : null;
}

/**
 * Hero / banner with a working carousel of slides (badge + CTA) and an optional
 * background: YouTube video (link) > uploaded video > image > texture. The big
 * title stays constant; the carousel cycles the highlight text and CTA, respects
 * reduced-motion, and lets the visitor jump between slides.
 */
export default function Hero({ hero }: { hero: HeroType }) {
  const slides = hero.slides ?? [];
  const hasCarousel = slides.length > 1;
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Client-only (matchMedia) → resolve after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(
      hero.reduceMotion &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, [hero.reduceMotion]);

  useEffect(() => {
    if (!hasCarousel || reduced) return;
    const ms = Math.max(2, hero.slideDurationSeconds || 6) * 1000;
    timer.current = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      ms,
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [hasCarousel, reduced, hero.slideDurationSeconds, slides.length]);

  // Current slide drives the highlight badge + CTA; fall back to hero fields.
  const slide = slides[index] ?? { text: hero.badge, cta: hero.ctaLabel };
  const badge = slide.text || hero.badge;
  const ctaLabel = slide.cta || hero.ctaLabel;

  const ytId = youtubeId(hero.youtubeUrl);

  const bgStyle = ytId
    ? { background: "oklch(0.2 0.018 40)" }
    : hero.video
      ? { background: "oklch(0.2 0.018 40)" }
      : hero.image
        ? {
            backgroundImage: `url(${hero.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : {
            background:
              "repeating-linear-gradient(-25deg, oklch(0.62 0.16 35) 0 30px, oklch(0.55 0.16 32) 30px 60px)",
          };

  return (
    <section
      id="top"
      className="clip-hero relative min-h-[540px] overflow-hidden md:h-[680px]"
      style={bgStyle}
    >
      {ytId ? (
        <div className="yt-cover" aria-hidden="true">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3`}
            title="Vídeo de fundo"
            allow="autoplay; encrypted-media"
          />
        </div>
      ) : hero.video ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={hero.video}
          autoPlay
          muted
          loop
          playsInline
          poster={hero.image}
        />
      ) : null}

      {/* Bottom-up darkening for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(0deg, rgba(10,8,6,.85), transparent 55%)",
        }}
      />

      {!hero.image && !hero.video && !ytId && (
        <div className="absolute left-5 top-5 font-[monospace] text-[11px] text-white/65 sm:left-8 md:left-14 md:text-[12px]">
          [ foto: corredores na largada — alto contraste ]
        </div>
      )}

      <div className="absolute inset-x-5 bottom-12 sm:inset-x-8 md:inset-x-14 md:bottom-[90px]">
        <div
          key={`badge-${index}`}
          className={`mb-5 inline-block bg-gold px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-gold-ink md:mb-[22px] md:text-[13px] ${
            reduced ? "" : "r4ba-fade"
          }`}
        >
          {badge}
        </div>

        <h1 className="max-w-[960px] font-display text-[44px] font-bold uppercase leading-[0.98] sm:text-[60px] md:text-[88px]">
          {hero.title}
        </h1>

        <div className="mt-7 flex items-center gap-5 md:mt-8">
          <a
            key={`cta-${index}`}
            href="#inscricao"
            className={`clip-cta-lg bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 md:px-[34px] md:py-[17px] md:text-[16px] ${
              reduced ? "" : "r4ba-fade"
            }`}
          >
            {ctaLabel}
          </a>

          {hasCarousel && (
            <div className="flex gap-2" aria-label="Slides do banner">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para o slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-1 transition-all ${
                    i === index ? "w-[26px] bg-gold" : "w-2.5 bg-white/35"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
