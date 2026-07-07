"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaylistSection } from "@/lib/content/types";
import { useAudioBus } from "./AudioBus";
import { loadYT } from "./YouTubePlayer";
import Reveal from "./Reveal";

/** Extract a YouTube playlist id (from ?list= or a bare id). */
function ytPlaylistId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?&]list=([\w-]+)/);
  if (m) return m[1];
  return /^(PL|UU|OL|RD|FL|LL|SR)[\w-]+$/.test(url) ? url : null;
}

/** Build a Spotify URI (spotify:type:id) from a playlist/album/track link or URI. */
function spotifyUri(url: string | undefined): string | null {
  if (!url) return null;
  const uri = url.match(/spotify:([a-z]+):([A-Za-z0-9]+)/);
  if (uri) return `spotify:${uri[1]}:${uri[2]}`;
  const web = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?([a-z]+)\/([A-Za-z0-9]+)/);
  if (web) return `spotify:${web[1]}:${web[2]}`;
  return null;
}

const floatWrapBase =
  "fixed bottom-4 right-4 z-[60] overflow-hidden rounded-lg bg-ink shadow-2xl ring-1 ring-white/10";
/** Floating player widths (pequeno / médio / grande), responsivos ao viewport. */
const FLOAT_SIZES = ["w-[min(260px,64vw)]", "w-[min(380px,86vw)]", "w-[min(560px,96vw)]"];

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function FloatBar({
  title,
  onClose,
  size,
  onSize,
}: {
  title: string;
  onClose: () => void;
  size: number;
  onSize: (delta: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-ink-card px-2.5 py-2">
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-cream">
        {title}
      </span>
      <IconBtn label="Diminuir player" onClick={() => onSize(-1)} disabled={size <= 0}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </IconBtn>
      <IconBtn label="Aumentar player" onClick={() => onSize(1)} disabled={size >= FLOAT_SIZES.length - 1}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </IconBtn>
      <IconBtn label="Fechar player" onClick={onClose}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </IconBtn>
    </div>
  );
}

/* ---- YouTube playlist (list + main player, floats when scrolled away) ---- */

interface YTP {
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

/** The IFrame API replaces the host div with the raw iframe (default 640×360),
 *  so we stretch it to fill its 16:9 box. */
function fillIframe(p: YTP) {
  try {
    const f = p.getIframe();
    if (f)
      Object.assign(f.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        border: "0",
      });
  } catch {
    /* ignore */
  }
}
interface YTNS {
  Player: new (el: HTMLElement, opts: unknown) => YTP;
}

function YouTubePlaylist({ listId, outOfView }: { listId: string; outOfView: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTP | null>(null);
  const createdRef = useRef(false);
  const autoMutedRef = useRef(false);
  const [videos, setVideos] = useState<{ id: string; title: string }[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  // "loading" → deciding; "list" → custom list (feed worked); "native" → YouTube's
  // own playlist queue (feed unavailable, but still shows all videos).
  const [mode, setMode] = useState<"loading" | "list" | "native">("loading");
  const [started, setStarted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [size, setSize] = useState(1);
  const onSize = (d: -1 | 1) =>
    setSize((s) => Math.min(FLOAT_SIZES.length - 1, Math.max(0, s + d)));
  const audioBus = useAudioBus();
  const videoSoundOn = audioBus?.videoSoundOn ?? false;

  useEffect(() => {
    let alive = true;
    fetch(`/api/yt-playlist?list=${encodeURIComponent(listId)}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; videos?: { id: string; title: string }[] }) => {
        if (!alive) return;
        if (d.ok && d.videos?.length) {
          setVideos(d.videos);
          setCurrentId(d.videos[0].id);
          setMode("list");
        } else {
          setMode("native");
        }
      })
      .catch(() => {
        if (alive) setMode("native");
      });
    return () => {
      alive = false;
    };
  }, [listId]);

  // Create the player once, after we know the mode (and the first video for "list").
  useEffect(() => {
    if (createdRef.current || mode === "loading") return;
    if (mode === "list" && !currentId) return;
    createdRef.current = true;
    let cancelled = false;
    loadYT().then(() => {
      if (cancelled || !hostRef.current) return;
      const YT = (window as unknown as { YT?: YTNS }).YT;
      if (!YT) return;
      const events = {
        onReady: (e: { target: YTP }) => fillIframe(e.target),
        onStateChange: (e: { data: number }) => {
          if (e.data === 1) setStarted(true); // playing
        },
      };
      const base = { autoplay: 0, controls: 1, modestbranding: 1, rel: 0, playsinline: 1 };
      playerRef.current = new YT.Player(
        hostRef.current,
        mode === "native"
          ? { playerVars: { ...base, listType: "playlist", list: listId }, events }
          : { videoId: currentId, playerVars: base, events },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [mode, currentId, listId]);

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, []);

  // Reset the "closed" state once the section is back in view.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!outOfView) setDismissed(false);
  }, [outOfView]);

  // Mute while a banner/"A Causa" video has its sound on.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (videoSoundOn) {
      if (!p.isMuted()) {
        p.mute();
        autoMutedRef.current = true;
      }
    } else if (autoMutedRef.current) {
      p.unMute();
      autoMutedRef.current = false;
    }
  }, [videoSoundOn, started]);

  function select(id: string) {
    setCurrentId(id);
    const p = playerRef.current;
    if (p) {
      p.loadVideoById(id);
      p.playVideo();
      setStarted(true);
    }
  }

  const floating = outOfView && started && !dismissed;
  const currentTitle = videos.find((v) => v.id === currentId)?.title ?? "";
  const ordered = currentId
    ? [
        ...videos.filter((v) => v.id === currentId),
        ...videos.filter((v) => v.id !== currentId),
      ]
    : videos;

  return (
    <div
      className={
        mode === "list"
          ? "grid gap-4 md:grid-cols-[1.7fr_1fr] md:items-start lg:mx-auto lg:max-w-[1120px] lg:gap-6"
          : "mx-auto max-w-[900px]"
      }
    >
      <div>
        <div className={floating ? `${floatWrapBase} ${FLOAT_SIZES[size]}` : "relative"}>
          {floating && (
            <FloatBar
              title={currentTitle || "Playlist do evento"}
              size={size}
              onSize={onSize}
              onClose={() => {
                playerRef.current?.pauseVideo();
                setDismissed(true);
              }}
            />
          )}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-ink">
            <div ref={hostRef} className="absolute inset-0" />
          </div>
        </div>
      </div>

      {mode === "list" && (
      // p-1 so the active item's ring (box-shadow) isn't clipped by overflow-y.
      <ul className="flex max-h-[336px] flex-col gap-2 overflow-y-auto p-1 md:max-h-[436px]">
        {ordered.map((v) => {
          const active = v.id === currentId;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => select(v.id)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                  active ? "bg-gold/15 ring-1 ring-gold" : "hover:bg-white/5"
                }`}
              >
                <span className="relative block h-[46px] w-[80px] flex-none overflow-hidden rounded bg-ink-panel">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  {active && (
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-gold">
                      Tocando agora
                    </span>
                  )}
                  <span className="line-clamp-2 text-[13px] leading-snug text-cream">
                    {v.title || "Vídeo"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}

/* ---- Spotify playlist (pauses on video audio; floats when scrolled away) ---- */

interface SpotifyController {
  pause(): void;
  resume(): void;
  addListener(
    event: "playback_update",
    cb: (e: { data: { isPaused: boolean } }) => void,
  ): void;
  destroy(): void;
}
interface SpotifyIFrameAPI {
  createController(
    el: HTMLElement,
    opts: { uri?: string; width?: string | number; height?: string | number },
    cb: (c: SpotifyController) => void,
  ): void;
}
type SpotifyWindow = Window & {
  onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  SpotifyIframeApi?: SpotifyIFrameAPI;
};

let spotifyApiPromise: Promise<SpotifyIFrameAPI> | null = null;
function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  if (typeof window === "undefined") return Promise.reject();
  const w = window as SpotifyWindow;
  if (w.SpotifyIframeApi) return Promise.resolve(w.SpotifyIframeApi);
  if (spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise<SpotifyIFrameAPI>((resolve) => {
    w.onSpotifyIframeApiReady = (api) => {
      w.SpotifyIframeApi = api;
      resolve(api);
    };
    if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
      const s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      document.body.appendChild(s);
    }
  });
  return spotifyApiPromise;
}

function SpotifyPlaylist({ uri, outOfView }: { uri: string; outOfView: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const pausedRef = useRef(true);
  const autoPausedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [size, setSize] = useState(1);
  const onSize = (d: -1 | 1) =>
    setSize((s) => Math.min(FLOAT_SIZES.length - 1, Math.max(0, s + d)));
  const audioBus = useAudioBus();
  const videoSoundOn = audioBus?.videoSoundOn ?? false;

  useEffect(() => {
    let cancelled = false;
    loadSpotifyApi().then((api) => {
      if (cancelled || !hostRef.current) return;
      api.createController(hostRef.current, { uri, width: "100%", height: "352" }, (controller) => {
        controllerRef.current = controller;
        controller.addListener("playback_update", (e) => {
          pausedRef.current = e.data.isPaused;
          if (!e.data.isPaused) setStarted(true);
        });
      });
    });
    return () => {
      cancelled = true;
      try {
        controllerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      controllerRef.current = null;
    };
  }, [uri]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!outOfView) setDismissed(false);
  }, [outOfView]);

  // Pause while a video has its sound on; resume after if we paused it.
  useEffect(() => {
    const c = controllerRef.current;
    if (!c) return;
    if (videoSoundOn) {
      if (!pausedRef.current) {
        c.pause();
        autoPausedRef.current = true;
      }
    } else if (autoPausedRef.current) {
      c.resume();
      autoPausedRef.current = false;
    }
  }, [videoSoundOn]);

  const floating = outOfView && started && !dismissed;

  return (
    <div className={floating ? `${floatWrapBase} ${FLOAT_SIZES[size]}` : "max-w-[720px]"}>
      {floating && (
        <FloatBar
          title="Playlist no Spotify"
          size={size}
          onSize={onSize}
          onClose={() => {
            controllerRef.current?.pause();
            setDismissed(true);
          }}
        />
      )}
      <div ref={hostRef} className="w-full" />
    </div>
  );
}

/* ---- Section ---- */

export default function Playlist({ playlist }: { playlist?: PlaylistSection }) {
  const listId = ytPlaylistId(playlist?.youtubeUrl);
  const spotify = spotifyUri(playlist?.spotifyUrl);
  const wanted = playlist?.visible ?? "both";
  const showYouTube = !!listId && wanted !== "spotify";
  const showSpotify = !!spotify && wanted !== "youtube";

  const [tab, setTab] = useState<"youtube" | "spotify">(
    showYouTube ? "youtube" : "spotify",
  );
  const [outOfView, setOutOfView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setOutOfView(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  if (!playlist?.enabled || (!showYouTube && !showSpotify)) return null;
  const both = showYouTube && showSpotify;
  const active = both ? tab : showYouTube ? "youtube" : "spotify";

  return (
    <section
      ref={sectionRef}
      id="playlist"
      className="px-5 py-16 sm:px-8 md:px-14 md:py-20"
      style={{ background: "var(--color-ink-deep)" }}
    >
      <Reveal>
        <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
          {playlist.title || "Playlist do evento"}
        </div>
        {playlist.note && (
          <p className="mb-6 max-w-[560px] text-[15px] leading-[1.6] text-muted-strong">
            {playlist.note}
          </p>
        )}
        {both && (
          <div
            className="mb-6 inline-flex overflow-hidden rounded-full border border-line-soft"
            role="tablist"
            aria-label="Escolha a plataforma da playlist"
          >
            {(["youtube", "spotify"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={active === k}
                onClick={() => setTab(k)}
                className={`min-h-11 px-5 text-[13px] font-bold uppercase tracking-[0.04em] transition-colors ${
                  active === k ? "bg-gold text-gold-ink" : "text-muted-strong hover:text-cream"
                }`}
              >
                {k === "youtube" ? "YouTube" : "Spotify"}
              </button>
            ))}
          </div>
        )}
      </Reveal>

      {active === "youtube" && listId ? (
        <YouTubePlaylist listId={listId} outOfView={outOfView} />
      ) : active === "spotify" && spotify ? (
        <SpotifyPlaylist uri={spotify} outOfView={outOfView} />
      ) : null}
    </section>
  );
}
