"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Mode = "slide" | "fade";

interface Props {
  images: string[];
  mode?: Mode;
  /** Seconds per photo (fade mode + slide autoplay). */
  interval?: number;
  /** Show a "Baixar vídeo" button (fade mode only). */
  download?: boolean;
  /** e.g. "16/9" or "9/16" — used for the box and for the exported video. */
  aspectRatio?: string;
  /** Default background behind the photos (hex). Default black. */
  fullscreenBg?: string;
  /** Per-slide background (aligned to `images` by index); empty = use fullscreenBg. */
  imageBgs?: string[];
}

/** Parse "16/9" → [w, h] with sane fallback. */
function parseAr(ar?: string): [number, number] {
  const [w, h] = (ar || "16/9").split("/").map((s) => parseFloat(s));
  return w > 0 && h > 0 ? [w, h] : [16, 9];
}

/** Load an image CORS-clean so the export canvas isn't tainted. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`falha ao carregar ${src}`));
    img.src = src;
  });
}

/** Pick the best supported recording MIME (MP4 on Safari, WebM elsewhere). */
function pickMime(): { mime: string; ext: string } | null {
  const R = typeof MediaRecorder !== "undefined" ? MediaRecorder : null;
  if (!R) return null;
  const candidates = [
    { mime: "video/mp4;codecs=avc1", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) if (R.isTypeSupported(c.mime)) return c;
  return null;
}

/** Draw an image "cover" into WxH, optionally zoomed (Ken Burns) and faded. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  zoom: number,
  alpha: number,
) {
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * s;
  const h = img.height * s;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

/** Fullscreen toggle button + icon. */
function FsButton({
  isFs,
  onClick,
  className = "",
  style,
}: {
  isFs: boolean;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isFs ? "Sair da tela cheia" : "Tela cheia"}
      style={style}
      className={`absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white transition-all hover:bg-black/70 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isFs ? (
          <path d="M9 3H5a2 2 0 0 0-2 2v4m18 0V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4" />
        ) : (
          <path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8-18h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3" />
        )}
      </svg>
    </button>
  );
}

/**
 * Image slideshow for custom-section "carrossel" blocks. Light + fast:
 * - Solid per-slide backdrop paints the configured color from the first frame
 *   (no color flash), behind `object-contain` photos (never cropped).
 * - Only a window (current ± 1, plus the first) of images is loaded, growing as
 *   it plays — so it stays light on any device/aspect. First photo is eager +
 *   high priority; the rest are lazy.
 * - `slide` (setas/pontos) and `fade` (crossfade em loop) modes; fullscreen with
 *   a CSS fallback for iOS; controls auto-hide when idle. Optional MP4/WebM export.
 * Respects prefers-reduced-motion (no autoplay).
 */
export default function CustomCarousel({
  images,
  mode = "slide",
  interval = 3.5,
  download = false,
  aspectRatio = "16/9",
  fullscreenBg = "#000000",
  imageBgs,
}: Props) {
  const pics = images.filter(Boolean);
  const n = pics.length;
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true); // slide-mode transition on/off (seamless wrap)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const [showControls, setShowControls] = useState(true);
  // Which slide indices have been brought into the load window (grows over time).
  // Seed the first few so the opening slides never show an empty (color-only) box.
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1, 2]));
  const containerRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepMs = Math.max(1200, interval * 1000);
  const isFs = nativeFs || cssFs;

  const go = (d: number) => {
    if (mode === "slide") {
      setI((v) => (d > 0 ? Math.min(v + 1, n) : v <= 0 ? n - 1 : v - 1));
    } else {
      setI((v) => (v + d + n) % n);
    }
  };

  // Autoplay: slide advances forward (clone at n), fade wraps modulo.
  useEffect(() => {
    if (n <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(
      () => setI((v) => (mode === "slide" ? Math.min(v + 1, n) : (v + 1) % n)),
      stepMs,
    );
    return () => clearInterval(t);
  }, [n, stepMs, mode]);

  // Grow the load window around the current slide (current ± 1), keeping the
  // first always ready (loop restart). Only mounts the images actually needed.
  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      for (const k of [i - 1, i, i + 1]) next.add(((k % n) + n) % n);
      return next.size === prev.size ? prev : next;
    });
  }, [i, n]);

  // Slide clone → snap back to the real first (no animation), re-enable next frame.
  useEffect(() => {
    if (mode !== "slide" || anim) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    return () => cancelAnimationFrame(r);
  }, [anim, mode]);

  // Fallback: if the transition to the clone never fires `transitionend` (e.g.
  // the tab was hidden), force the reset so the loop can't get stuck.
  useEffect(() => {
    if (mode !== "slide" || i < n) return;
    const t = setTimeout(() => {
      setAnim(false);
      setI(0);
    }, 650);
    return () => clearTimeout(t);
  }, [i, n, mode]);

  // Track native fullscreen state.
  useEffect(() => {
    const onChange = () => {
      const d = document as Document & { webkitFullscreenElement?: Element };
      setNativeFs(!!(document.fullscreenElement || d.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // CSS-fallback fullscreen (iOS): lock body scroll, exit on Escape, and extend
  // the layout viewport under the notch / home indicator (`viewport-fit=cover`)
  // so the overlay covers the whole screen — restored on exit.
  useEffect(() => {
    if (!cssFs) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const vp = document.querySelector('meta[name="viewport"]');
    const prevVp = vp?.getAttribute("content") ?? null;
    if (vp && prevVp && !/viewport-fit/.test(prevVp)) {
      vp.setAttribute("content", `${prevVp}, viewport-fit=cover`);
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCssFs(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      if (vp && prevVp !== null) vp.setAttribute("content", prevVp);
      window.removeEventListener("keydown", onKey);
    };
  }, [cssFs]);

  // Auto-hide the overlay controls when the pointer sits still (like a player).
  const nudgeControls = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };
  useEffect(() => {
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  function toggleFs() {
    const el = containerRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => void;
    }) | null;
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    nudgeControls();
    if (nativeFs) {
      (document.exitFullscreen || doc.webkitExitFullscreen)?.call(document);
      return;
    }
    if (cssFs) {
      setCssFs(false);
      return;
    }
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => setCssFs(true));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else setCssFs(true);
  }

  if (n === 0) return null;

  // Per-slide background (solid backdrop). `i % n` maps the slide clone → first.
  const activeBg = imageBgs?.[i % n]?.trim() || fullscreenBg || "#000000";
  const boxStyle: CSSProperties = isFs
    ? {
        aspectRatio: "auto",
        background: activeBg,
        borderRadius: 0,
        // CSS fallback (iOS Safari): fill via inset:0 — tracks the visible area
        // exactly, unlike 100vh which leaves a gap under Safari's toolbar.
        // Native fullscreen (Android/desktop): 100vw/100vh = the screen.
        ...(cssFs
          ? { position: "fixed", inset: 0, zIndex: 100 }
          : { width: "100vw", height: "100vh" }),
      }
    : { aspectRatio, background: activeBg };
  const ctrlCls = `transition-all duration-300 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`;
  const cursorCls = showControls ? "" : "cursor-none";
  const boxCls = `relative w-full overflow-hidden rounded-xl ${cursorCls}`;
  // In fullscreen, keep controls clear of the notch / home indicator.
  const fsBtnStyle: CSSProperties | undefined = isFs
    ? { top: "max(0.5rem, env(safe-area-inset-top))", right: "max(0.5rem, env(safe-area-inset-right))" }
    : undefined;
  const fsDotsStyle: CSSProperties | undefined = isFs
    ? { bottom: "max(0.75rem, env(safe-area-inset-bottom))" }
    : undefined;
  const srcFor = (idx: number) => (loaded.has(idx % n) ? pics[idx % n] : undefined);
  const imgProps = (idx: number) =>
    ({
      loading: idx <= 1 ? ("eager" as const) : ("lazy" as const),
      fetchPriority: idx === 0 ? ("high" as const) : ("auto" as const),
      decoding: "async" as const,
      draggable: false,
    });

  // ---- Fade (video-style) ----
  if (mode === "fade") {
    async function exportVideo() {
      setErr(null);
      const picked = pickMime();
      if (!picked) {
        setErr("Seu navegador não permite gerar o vídeo. Tente pelo Safari (iPhone/Mac).");
        return;
      }
      setBusy(true);
      try {
        const [arW, arH] = parseAr(aspectRatio);
        const long = 1280;
        let W = arW >= arH ? long : Math.round((long * arW) / arH);
        let H = arW >= arH ? Math.round((long * arH) / arW) : long;
        W -= W % 2;
        H -= H % 2;

        const imgs = await Promise.all(pics.map(loadImage));
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas indisponível");

        const stream = canvas.captureStream(30);
        const rec = new MediaRecorder(stream, {
          mimeType: picked.mime,
          videoBitsPerSecond: 6_000_000,
        });
        const chunks: BlobPart[] = [];
        rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
        const stopped = new Promise<void>((res) => (rec.onstop = () => res()));

        const holdMs = stepMs;
        const fadeMs = Math.min(900, holdMs * 0.5);
        const totalMs = n * holdMs;

        rec.start();
        const t0 = performance.now();
        await new Promise<void>((resolve) => {
          const frame = (now: number) => {
            const t = now - t0;
            if (t >= totalMs) return resolve();
            ctx.fillStyle = "#0b0b0b";
            ctx.fillRect(0, 0, W, H);
            const c = Math.floor(t / holdMs) % n;
            const localT = t - Math.floor(t / holdMs) * holdMs;
            drawCover(ctx, imgs[c], W, H, 1 + 0.06 * (localT / holdMs), 1);
            if (localT > holdMs - fadeMs) {
              const fp = (localT - (holdMs - fadeMs)) / fadeMs;
              drawCover(ctx, imgs[(c + 1) % n], W, H, 1, fp);
            }
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        rec.stop();
        await stopped;

        const blob = new Blob(chunks, { type: picked.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `slideshow.${picked.ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } catch {
        setErr("Não foi possível gerar o vídeo (imagens podem estar bloqueadas). Tente novamente.");
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="flex flex-col gap-3">
        <div
          ref={containerRef}
          className={boxCls}
          style={boxStyle}
          onMouseMove={nudgeControls}
          onMouseLeave={() => setShowControls(false)}
        >
          <div className="absolute inset-0" style={{ background: activeBg }} aria-hidden="true" />
          {pics.map((_, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={srcFor(idx)}
              alt=""
              {...imgProps(idx)}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-in-out"
              style={{ opacity: idx === i ? 1 : 0 }}
            />
          ))}
          <FsButton isFs={isFs} onClick={toggleFs} className={ctrlCls} style={fsBtnStyle} />
        </div>

        {download && (
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={exportVideo}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-[13px] font-bold uppercase tracking-[0.04em] text-ink-deep transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? (
                "Gerando vídeo..."
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
                  Baixar vídeo
                </>
              )}
            </button>
            {err && <span className="text-[12px] text-terracotta">{err}</span>}
          </div>
        )}
      </div>
    );
  }

  // ---- Slide (default) ----
  return (
    <div
      ref={containerRef}
      className={boxCls}
      style={boxStyle}
      onMouseMove={nudgeControls}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        nudgeControls();
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="absolute inset-0" style={{ background: activeBg }} aria-hidden="true" />
      <div
        className={`relative flex h-full ease-out ${anim ? "transition-transform duration-500" : ""}`}
        style={{
          transform: `translateX(-${i * 100}%)`,
          transitionDuration: anim ? undefined : "0ms",
        }}
        onTransitionEnd={() => {
          if (i >= n) {
            setAnim(false);
            setI(0);
          }
        }}
      >
        {[...pics, pics[0]].map((_, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={idx}
            src={srcFor(idx)}
            alt=""
            {...imgProps(idx)}
            className="h-full w-full shrink-0 object-contain"
          />
        ))}
      </div>

      <FsButton isFs={isFs} onClick={toggleFs} className={ctrlCls} style={fsBtnStyle} />

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Anterior"
            className={`absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white hover:bg-black/70 ${ctrlCls}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo"
            className={`absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white hover:bg-black/70 ${ctrlCls}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 ${ctrlCls}`} style={fsDotsStyle}>
            {pics.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ir para imagem ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i % n ? "w-6 bg-gold" : "w-2 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
