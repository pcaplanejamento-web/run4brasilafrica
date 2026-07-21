"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAudioBus } from "./AudioBus";

interface YTPlayer {
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(v: number): void;
  playVideo(): void;
  getPlayerState(): number;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
  /** Caption control (present once the captions module loads). */
  unloadModule?(name: string): void;
  setOption?(module: string, option: string, value: unknown): void;
}

/**
 * Force captions OFF. YouTube has no URL param to disable captions
 * (`cc_load_policy=0` only means "viewer default"), so we unload the caption
 * module and clear the track via the IFrame API. Safe to call repeatedly.
 */
function disableCaptions(p: YTPlayer) {
  for (const mod of ["captions", "cc"]) {
    try {
      p.setOption?.(mod, "track", {});
    } catch {
      /* module not ready yet */
    }
    try {
      p.unloadModule?.(mod);
    } catch {
      /* ignore */
    }
  }
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer;
}
type YTWindow = Window & {
  YT?: YTNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

let ytPromise: Promise<void> | null = null;
/** Load the YouTube IFrame API once (shared across all players/playlists). */
export function loadYT(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as YTWindow;
  if (w.YT?.Player) return Promise.resolve();
  if (ytPromise) return ytPromise;
  ytPromise = new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
  });
  return ytPromise;
}

/**
 * Size the iframe to COVER the container for a video of the given ratio (centered).
 * `interactive` lets clicks through to the YouTube controls when they are shown.
 */
function coverIframe(
  container: HTMLElement,
  iframe: HTMLIFrameElement,
  ar: number,
  interactive: boolean,
) {
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  if (!cw || !ch) return;
  let w = cw;
  let h = cw / ar;
  if (h < ch) {
    h = ch;
    w = ch * ar;
  }
  Object.assign(iframe.style, {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: `${w}px`,
    height: `${h}px`,
    border: "0",
    pointerEvents: interactive ? "auto" : "none",
  });
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path
          d="M16 8.5a4 4 0 010 7M18.5 6a7 7 0 010 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/**
 * YouTube background/media player via the IFrame API. Autoplays MUTED (browser
 * rule); a sound toggle unmutes on user gesture, and `startMuted=false` unmutes
 * on the first page interaction. `clickToPlay` shows a start overlay instead of
 * autoplaying. Fills and covers its parent (which must be positioned).
 */
export default function YouTubePlayer({
  videoId,
  startMuted = true,
  clickToPlay = false,
  showSoundToggle = true,
  vertical = false,
  showControls = false,
  showCaptions = false,
}: {
  videoId: string;
  startMuted?: boolean;
  clickToPlay?: boolean;
  showSoundToggle?: boolean;
  /** Cover using a 9:16 (portrait, e.g. YouTube Shorts) ratio instead of 16:9. */
  vertical?: boolean;
  /** Show the native YouTube control bar (play/pause, fullscreen, share, logo). */
  showControls?: boolean;
  /** Force closed captions on. */
  showCaptions?: boolean;
}) {
  const videoAr = vertical ? 9 / 16 : 16 / 9;
  const playerId = useId();
  const audioBus = useAudioBus();
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(!clickToPlay);
  const [ready, setReady] = useState(false);
  // Autoplay is often blocked on mobile — when it is, show a tap-to-play overlay.
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    loadYT().then(() => {
      if (cancelled || !hostRef.current) return;
      const w = window as YTWindow;
      if (!w.YT) return;
      const player = new w.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: clickToPlay ? 0 : 1,
          mute: 1,
          controls: showControls ? 1 : 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          disablekb: showControls ? 0 : 1,
          fs: showControls ? 1 : 0,
          cc_load_policy: showCaptions ? 1 : 0,
          iv_load_policy: 3,
          // Casa a origem esperada pela IFrame API com a nossa — reduz os avisos
          // "postMessage target origin does not match" do www-widgetapi do YouTube.
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (cancelled) return;
            playerRef.current = e.target;
            setReady(true);
            const iframe = e.target.getIframe();
            const cont = containerRef.current;
            if (cont && iframe) {
              coverIframe(cont, iframe, videoAr, showControls);
              ro = new ResizeObserver(() =>
                coverIframe(cont, iframe, videoAr, showControls),
              );
              ro.observe(cont);
            }
            if (!showCaptions) disableCaptions(e.target);
            if (!clickToPlay) {
              e.target.mute();
              e.target.playVideo();
              setMuted(true);
            }
          },
          // Fires when modules (incl. captions) load — the reliable moment to
          // force captions off, since there's no URL param for it.
          onApiChange: (e: { target: YTPlayer }) => {
            if (cancelled) return;
            if (!showCaptions) disableCaptions(e.target);
          },
        },
      });
      playerRef.current = player;
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, clickToPlay, videoAr, showControls, showCaptions]);

  // Keep the audio bus in sync with the real mute state (covers native
  // controls too) and unregister on unmount.
  useEffect(() => {
    audioBus?.setVideoSound(playerId, !muted);
  }, [audioBus, playerId, muted]);

  useEffect(() => {
    if (!ready) return;
    const poll = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const m = p.isMuted();
      setMuted((prev) => (prev === m ? prev : m));
    }, 800);
    return () => clearInterval(poll);
  }, [ready]);

  // Detect blocked autoplay: if, shortly after ready, the video isn't playing or
  // buffering, surface a tap-to-play overlay (mobile browsers block autoplay).
  useEffect(() => {
    if (!ready || clickToPlay) return;
    let tries = 0;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const st = p.getPlayerState?.();
      if (st === 1 || st === 3) {
        setBlocked(false);
        clearInterval(id);
      } else if (++tries >= 3) {
        setBlocked(true);
        clearInterval(id);
      }
    }, 800);
    return () => clearInterval(id);
  }, [ready, clickToPlay]);

  function resume() {
    const p = playerRef.current;
    if (!p) return;
    p.playVideo();
    if (!startMuted) {
      p.unMute();
      p.setVolume(100);
      setMuted(false);
    }
    setBlocked(false);
  }

  useEffect(() => {
    return () => {
      audioBus?.setVideoSound(playerId, false);
    };
  }, [audioBus, playerId]);

  // Autoplay mode: honor "start with sound" on the first page interaction.
  useEffect(() => {
    if (clickToPlay || startMuted) return;
    const onInteract = () => {
      const p = playerRef.current;
      if (p) {
        p.unMute();
        p.setVolume(100);
        setMuted(false);
      }
    };
    window.addEventListener("pointerdown", onInteract, { once: true });
    return () => window.removeEventListener("pointerdown", onInteract);
  }, [clickToPlay, startMuted]);

  function toggleSound() {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      p.setVolume(100);
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }

  function start() {
    const p = playerRef.current;
    if (!p) return;
    p.playVideo();
    if (!startMuted) {
      p.unMute();
      p.setVolume(100);
      setMuted(false);
    }
    setStarted(true);
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden bg-ink"
    >
      <div ref={hostRef} />

      {((clickToPlay && !started) || blocked) && (
        <button
          type="button"
          onClick={clickToPlay && !started ? start : resume}
          aria-label="Reproduzir vídeo"
          className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-black/45"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[14px] font-bold uppercase text-gold-ink">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            {clickToPlay && !started ? "Clique para começar o vídeo" : "Tocar vídeo"}
          </span>
        </button>
      )}

      {showSoundToggle && !showControls && started && ready && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Ativar som" : "Desativar som"}
          className="pointer-events-auto absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
        >
          <SpeakerIcon muted={muted} />
        </button>
      )}
    </div>
  );
}
