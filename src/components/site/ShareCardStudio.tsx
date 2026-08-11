"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventInfo, PercursoRoute, RaceResultRow } from "@/lib/content/types";
import {
  cardFieldOptions,
  drawCard,
  ensureFonts,
  FORMATS,
  loadImageTaintSafe,
  TEMPLATE_LABEL,
  THEME_LABEL,
  type CardAssets,
  type CardField,
  type CardFieldKey,
  type CardFormat,
  type CardModel,
  type CardState,
  type CardTemplate,
  type CardTheme,
  type LayerTransform,
} from "@/lib/results/card";
import { qrMatrix } from "@/lib/results/qr";

const PREFS_KEY = "r4ba:card:prefs";
const DEFAULT_ON: CardFieldKey[] = ["netTime", "pace", "team"];

interface Prefs {
  template: CardTemplate;
  format: CardFormat;
  theme: CardTheme;
  showBadge: boolean;
  showQr: boolean;
  transparent: boolean;
  fields: Partial<Record<CardFieldKey, boolean>>;
}

function loadPrefs(): Partial<Prefs> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

/**
 * Estúdio de **cards compartilháveis** (estilo Strava) para um corredor. O
 * usuário escolhe template, formato (feed 4:5 / stories 9:16), tema, quais dados
 * aparecem, envia e **enquadra** (pan/zoom, com pinça no toque) a foto ou o mapa
 * do trajeto, liga selo/medalha e QR, e pode exportar com **fundo transparente**.
 * A logo do evento é sempre desenhada (não removível). Tudo no `<canvas>`, sem
 * upload — baixar/compartilhar direto do aparelho.
 */
export default function ShareCardStudio({
  runner,
  event,
  brandLogo,
  routes,
  categoryLabel,
}: {
  runner: RaceResultRow;
  event?: EventInfo;
  brandLogo?: string;
  routes: PercursoRoute[];
  categoryLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mapRoutes = useMemo(() => routes.filter((r) => r.fallbackImage), [routes]);
  const available: CardField[] = useMemo(
    () => cardFieldOptions(runner, event, routes),
    [runner, event, routes],
  );
  const availableTemplates = useMemo<CardTemplate[]>(
    () => (mapRoutes.length ? ["foto", "resultado", "trajeto"] : ["foto", "resultado"]),
    [mapRoutes],
  );

  const prefs = useMemo(() => (typeof window !== "undefined" ? loadPrefs() : {}), []);

  const [template, setTemplate] = useState<CardTemplate>(
    prefs.template && (prefs.template !== "trajeto" || mapRoutes.length) ? prefs.template : "foto",
  );
  const [format, setFormat] = useState<CardFormat>(prefs.format ?? "feed");
  const [theme, setTheme] = useState<CardTheme>(prefs.theme ?? "dourado");
  const [showBadge, setShowBadge] = useState(prefs.showBadge ?? true);
  const [showQr, setShowQr] = useState(prefs.showQr ?? false);
  const [transparent, setTransparent] = useState(prefs.transparent ?? false);
  const [fields, setFields] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const f of available) init[f.key] = prefs.fields?.[f.key] ?? DEFAULT_ON.includes(f.key);
    return init;
  });
  const [routeIdx, setRouteIdx] = useState(0);
  const [photo, setPhoto] = useState<LayerTransform>({ ox: 0, oy: 0, zoom: 1 });
  const [map, setMap] = useState<LayerTransform>({ ox: 0, oy: 0, zoom: 1 });

  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [mapImg, setMapImg] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeLayer: "photo" | "map" | null =
    template === "foto" ? "photo" : template === "trajeto" ? "map" : null;

  // Carrega fontes, logo e QR uma vez.
  useEffect(() => {
    ensureFonts().then(() => setFontsReady(true));
  }, []);
  useEffect(() => {
    loadImageTaintSafe(brandLogo).then(setLogoImg);
  }, [brandLogo]);
  const qr = useMemo(() => {
    if (!showQr || typeof window === "undefined") return null;
    try {
      return qrMatrix(`${window.location.origin}/#classificacao`);
    } catch {
      return null;
    }
  }, [showQr]);

  // Carrega o mapa da rota escolhida quando em "trajeto".
  useEffect(() => {
    if (template !== "trajeto") return;
    const url = mapRoutes[routeIdx]?.fallbackImage;
    let alive = true;
    loadImageTaintSafe(url).then((img) => alive && setMapImg(img));
    return () => {
      alive = false;
    };
  }, [template, routeIdx, mapRoutes]);

  // Persiste preferências.
  useEffect(() => {
    const p: Prefs = { template, format, theme, showBadge, showQr, transparent, fields };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, [template, format, theme, showBadge, showQr, transparent, fields]);

  const model: CardModel = useMemo(() => {
    const heroTime = fields.netTime ? runner.timeNet : fields.grossTime ? runner.timeGross : undefined;
    const chipKeys: CardFieldKey[] = ["pace", "team", "modality", "bib", "age", "ageGroup", "ageGroupPos", "dateCity"];
    const chips = available
      .filter((f) => chipKeys.includes(f.key) && fields[f.key])
      .map((f) => ({ label: f.label, value: f.value }));
    return {
      pos: runner.pos,
      name: runner.name,
      categoryLabel,
      heroTime,
      chips,
      badge: showBadge ? (runner.pos <= 3 ? { kind: "medal", place: runner.pos } : { kind: "finisher" }) : null,
      brandName: event?.brandName,
    };
  }, [runner, categoryLabel, fields, available, showBadge, event]);

  const state: CardState = useMemo(
    () => ({ template, format, theme, transparent, photo, map }),
    [template, format, theme, transparent, photo, map],
  );

  const assets: CardAssets = useMemo(
    () => ({ logo: logoImg, photo: photoImg, map: mapImg, qr }),
    [logoImg, photoImg, mapImg, qr],
  );

  // Redesenho síncrono (não depende de rAF — que pode ficar pausado quando a aba
  // é considerada oculta; e as mudanças aqui são pontuais, disparadas pelo user).
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = FORMATS[format];
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCard(ctx, w, h, state, model, assets);
  }, [format, state, model, assets]);

  useEffect(() => {
    redraw();
  }, [redraw, fontsReady]);

  /* ---- Pan / zoom (pointer events unificam mouse + toque) ---- */
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const setLayer = useCallback(
    (fn: (t: LayerTransform) => LayerTransform) => {
      if (activeLayer === "photo") setPhoto(fn);
      else if (activeLayer === "map") setMap(fn);
    },
    [activeLayer],
  );

  const canvasScale = () => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return canvas.width / rect.width;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!activeLayer) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cur = activeLayer === "photo" ? photo.zoom : map.zoom;
      pinchStart.current = { dist, zoom: cur };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!activeLayer || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const z = Math.max(1, Math.min(4, (pinchStart.current.zoom * dist) / pinchStart.current.dist));
      setLayer((t) => ({ ...t, zoom: z }));
    } else {
      const s = canvasScale();
      const dx = (e.clientX - prev.x) * s;
      const dy = (e.clientY - prev.y) * s;
      setLayer((t) => ({ ...t, ox: t.ox + dx, oy: t.oy + dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!activeLayer) return;
    const cur = activeLayer === "photo" ? photo.zoom : map.zoom;
    const z = Math.max(1, Math.min(4, cur - e.deltaY * 0.001));
    setLayer((t) => ({ ...t, zoom: z }));
  };

  const zoomValue = activeLayer === "photo" ? photo.zoom : activeLayer === "map" ? map.zoom : 1;

  /* ---- Foto ---- */
  function handlePhoto(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhotoImg((prev) => {
        if (prev) URL.revokeObjectURL(prev.src);
        return img;
      });
      setPhoto({ ox: 0, oy: 0, zoom: 1 });
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  /* ---- Export ---- */
  const filename = () => `card-${slug(runner.name)}-${format}.png`;
  const getBlob = () =>
    new Promise<Blob | null>((res) => canvasRef.current?.toBlob(res, "image/png"));

  async function download() {
    setBusy(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], filename(), { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "Meu resultado", text: `${runner.name} — ${runner.pos}º lugar` });
        return;
      } catch {
        /* cancelou → fallback */
      }
    }
    await download();
    const txt = encodeURIComponent(`${runner.name} — ${runner.pos}º lugar (${categoryLabel}).`);
    window.open(`https://wa.me/?text=${txt}`, "_blank", "noopener,noreferrer");
  }

  /* ---- UI helpers ---- */
  const chip = (active: boolean) =>
    `min-h-9 rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors ${
      active ? "bg-gold text-gold-ink" : "border border-line-soft bg-ink text-muted-strong hover:text-cream"
    }`;

  return (
    <div className="rounded-xl border border-line-soft bg-ink p-4">
      <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-cream">
        Card para compartilhar
      </div>
      <p className="mt-1 text-[12px] text-muted">
        Monte seu card e baixe/compartilhe — tudo no seu aparelho, sem enviar nada.
      </p>

      {/* Preview (canvas WYSIWYG). */}
      <div className="mt-3 flex justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          className={`w-auto max-h-[62vh] max-w-full rounded-lg border border-line-soft ${
            activeLayer ? "cursor-grab touch-none active:cursor-grabbing" : ""
          }`}
          style={{ aspectRatio: `${FORMATS[format].w} / ${FORMATS[format].h}` }}
          aria-label="Prévia do card"
        />
      </div>
      {activeLayer && (
        <p className="mt-1.5 text-center text-[11px] text-muted">
          Arraste para reposicionar {activeLayer === "photo" ? "a foto" : "o mapa"} · pinça/rolar para zoom
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePhoto(f);
          e.target.value = "";
        }}
      />

      {/* Controles. */}
      <div className="mt-4 flex flex-col gap-3.5">
        <Group label="Modelo">
          {availableTemplates.map((t) => (
            <button key={t} type="button" onClick={() => setTemplate(t)} className={chip(template === t)}>
              {TEMPLATE_LABEL[t]}
            </button>
          ))}
        </Group>

        <Group label="Formato">
          {(Object.keys(FORMATS) as CardFormat[]).map((f) => (
            <button key={f} type="button" onClick={() => setFormat(f)} className={chip(format === f)}>
              {FORMATS[f].label}
            </button>
          ))}
        </Group>

        <Group label="Tema">
          {(Object.keys(THEME_LABEL) as CardTheme[]).map((t) => (
            <button key={t} type="button" onClick={() => setTheme(t)} className={chip(theme === t)}>
              {THEME_LABEL[t]}
            </button>
          ))}
        </Group>

        {template === "foto" && (
          <Group label="Foto">
            <button type="button" onClick={() => fileRef.current?.click()} className={chip(false)}>
              {photoImg ? "Trocar foto" : "Escolher foto"}
            </button>
          </Group>
        )}
        {template === "trajeto" && mapRoutes.length > 1 && (
          <Group label="Trajeto">
            {mapRoutes.map((r, i) => (
              <button key={r.id} type="button" onClick={() => setRouteIdx(i)} className={chip(routeIdx === i)}>
                {r.title || `Rota ${i + 1}`}
              </button>
            ))}
          </Group>
        )}

        {activeLayer && (
          <div className="flex items-center gap-3">
            <span className="w-[54px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.02}
              value={zoomValue}
              onChange={(e) => setLayer((t) => ({ ...t, zoom: Number(e.target.value) }))}
              className="h-2 w-full accent-gold"
              aria-label="Zoom"
            />
          </div>
        )}

        <Group label="Mostrar">
          {available.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFields((s) => ({ ...s, [f.key]: !s[f.key] }))}
              className={chip(!!fields[f.key])}
            >
              {f.label}
            </button>
          ))}
        </Group>

        <Group label="Extras">
          <button type="button" onClick={() => setShowBadge((v) => !v)} className={chip(showBadge)}>
            {runner.pos <= 3 ? "Medalha" : "Selo finisher"}
          </button>
          <button type="button" onClick={() => setShowQr((v) => !v)} className={chip(showQr)}>
            QR resultados
          </button>
          <button type="button" onClick={() => setTransparent((v) => !v)} className={chip(transparent)}>
            Fundo transparente
          </button>
        </Group>

        <div className="mt-1 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="min-h-11 rounded-lg bg-gold px-5 text-[13px] font-bold text-gold-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            Baixar imagem
          </button>
          <button
            type="button"
            onClick={share}
            className="min-h-11 rounded-lg border border-gold px-5 text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-gold-ink"
          >
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Linha rotulada de chips (rótulo à esquerda, chips que quebram). */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[54px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">{label}</span>
      <div className="flex flex-1 flex-wrap gap-2">{children}</div>
    </div>
  );
}
