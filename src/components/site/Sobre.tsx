"use client";

import type { AboutSection } from "@/lib/content/types";
import Reveal from "./Reveal";
import YouTubePlayer, { youtubeId, isVerticalYouTube } from "./YouTubePlayer";

/**
 * "A causa" — social mission. Media (image OR YouTube video) in a box with the
 * chosen aspect ratio (media adapts via cover); editable title, body and button.
 */
export default function Sobre({ about }: { about: AboutSection }) {
  const ytId = about.mediaType === "video" ? youtubeId(about.videoUrl) : null;
  const linkHref = about.linkUrl || "#parceiros";
  const external = /^https?:\/\//.test(linkHref);
  const aspect = about.aspectRatio || "4/3";

  return (
    <section
      id="sobre"
      className="grid grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 md:grid-cols-2 md:gap-16 md:px-14 md:pb-[90px] md:pt-[110px]"
    >
      <Reveal>
        <div
          className="relative w-full overflow-hidden bg-ink-panel"
          style={{ aspectRatio: aspect }}
        >
          {about.mediaType === "image" && about.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={about.image}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : ytId ? (
            <YouTubePlayer
              videoId={ytId}
              startMuted={about.videoStartMuted !== false}
              clickToPlay={!!about.clickToPlay}
              vertical={isVerticalYouTube(about.videoUrl)}
              showControls={!!about.videoControls}
              showCaptions={!!about.videoCaptions}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  "repeating-linear-gradient(70deg, oklch(0.45 0.06 145) 0 24px, oklch(0.4 0.06 143) 24px 48px)",
              }}
            >
              <span className="font-[monospace] text-[12px] text-white/70">
                [ foto: comunidade / causa social ]
              </span>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
          {about.eyebrow}
        </div>
        <h2 className="mb-[22px] font-display text-[32px] font-bold uppercase leading-[1.05] md:text-[42px]">
          {about.title}
        </h2>
        <p className="max-w-[460px] text-[16px] leading-[1.7] text-muted-strong">
          {about.body}
        </p>
        <a
          href={linkHref}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="mt-6 inline-block text-[15px] font-bold uppercase text-gold transition-opacity hover:opacity-80"
        >
          → {about.linkLabel}
        </a>
      </Reveal>
    </section>
  );
}
