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
  const web = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?([a-z]+)\/([A-Za-z0-9]+)/,
  );
  if (web) return `spotify:${web[1]}:${web[2]}`;
  return null;
}

/* ---- YouTube playlist player (controllable, mutes on video audio) ---- */

interface YTPlaylistPlayer {
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}
interface YTNS {
  Player: new (el: HTMLElement, opts: unknown) => YTPlaylistPlayer;
}

function YouTubePlaylist({ listId }: { listId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlaylistPlayer | null>(null);
  const autoMutedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const audioBus = useAudioBus();
  const videoSoundOn = audioBus?.videoSoundOn ?? false;

  useEffect(() => {
    let cancelled = false;
    loadYT().then(() => {
      if (cancelled || !hostRef.current) return;
      const YT = (window as unknown as { YT?: YTNS }).YT;
      if (!YT) return;
      playerRef.current = new YT.Player(hostRef.current, {
        playerVars: {
          listType: "playlist",
          list: listId,
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [listId]);

  // Mute the playlist while a banner/"A Causa" video has its sound on.
  useEffect(() => {
    if (!ready) return;
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
  }, [videoSoundOn, ready]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-ink-panel" style={{ aspectRatio: "16/9" }}>
      <div ref={hostRef} className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
    </div>
  );
}

/* ---- Spotify player (pauses on video audio; can't be muted) ---- */

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

function SpotifyPlaylist({ uri }: { uri: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const pausedRef = useRef(true);
  const autoPausedRef = useRef(false);
  const audioBus = useAudioBus();
  const videoSoundOn = audioBus?.videoSoundOn ?? false;

  useEffect(() => {
    let cancelled = false;
    loadSpotifyApi().then((api) => {
      if (cancelled || !hostRef.current) return;
      api.createController(
        hostRef.current,
        { uri, width: "100%", height: "352" },
        (controller) => {
          controllerRef.current = controller;
          controller.addListener("playback_update", (e) => {
            pausedRef.current = e.data.isPaused;
          });
        },
      );
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

  // Pause Spotify while a video has its sound on (can't mute an embed); resume
  // it afterwards only if we were the ones who paused it.
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

  return <div ref={hostRef} className="w-full" />;
}

/* ---- Section ---- */

export default function Playlist({ playlist }: { playlist?: PlaylistSection }) {
  const listId = ytPlaylistId(playlist?.youtubeUrl);
  const spotify = spotifyUri(playlist?.spotifyUrl);
  const wanted = playlist?.visible ?? "both";

  // Only render created/available players, respecting the admin's choice.
  const showYouTube = !!listId && wanted !== "spotify";
  const showSpotify = !!spotify && wanted !== "youtube";

  const [tab, setTab] = useState<"youtube" | "spotify">(
    showYouTube ? "youtube" : "spotify",
  );

  if (!playlist?.enabled || (!showYouTube && !showSpotify)) return null;
  const both = showYouTube && showSpotify;
  const active = both ? tab : showYouTube ? "youtube" : "spotify";

  return (
    <section
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
            className="mb-5 inline-flex overflow-hidden rounded-full border border-line-soft"
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
                  active === k
                    ? "bg-gold text-gold-ink"
                    : "text-muted-strong hover:text-cream"
                }`}
              >
                {k === "youtube" ? "YouTube" : "Spotify"}
              </button>
            ))}
          </div>
        )}

        <div className="max-w-[720px]">
          {active === "youtube" && listId ? (
            <YouTubePlaylist listId={listId} />
          ) : active === "spotify" && spotify ? (
            <SpotifyPlaylist uri={spotify} />
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
