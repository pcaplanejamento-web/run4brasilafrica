"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ClassificacaoDisplay,
  EventInfo,
  PercursoRoute,
  RaceResultRow,
} from "@/lib/content/types";
import {
  cardFieldOptions,
  drawCard,
  drawCover,
  ensureFonts,
  FORMATS,
  loadImageTaintSafe,
  TEMPLATE_LABEL,
  THEME_LABEL,
  type CardAssets,
  type CardField,
  type CardModel,
  type CardState,
  type CardFormat,
  type CardTemplate,
  type CardTheme,
  type LayerTransform,
} from "@/lib/results/card";
import { qrMatrix } from "@/lib/results/qr";
import SegmentedTabs from "./SegmentedTabs";

const PREFS_KEY = "r4ba:card:prefs";
const DEFAULT_T: LayerTransform = { ox: 0, oy: 0, zoom: 1 };

interface Prefs {
  format: CardFormat;
  theme: CardTheme;
  showBadge: boolean;
  showQr: boolean;
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

/** Campos ligados por padrão = a predefinição do ADM (`display`); pace ligado. */
function defaultFields(available: CardField[], d?: ClassificacaoDisplay): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const f of available) {
    switch (f.key) {
      case "netTime": out[f.key] = d?.netTime ?? true; break;
      case "grossTime": out[f.key] = d?.grossTime ?? false; break;
      case "team": out[f.key] = d?.team ?? true; break;
      case "bib": out[f.key] = d?.bib ?? false; break;
      case "age": out[f.key] = d?.age ?? false; break;
      case "ageGroup": out[f.key] = d?.ageGroup ?? false; break;
      case "ageGroupPos": out[f.key] = d?.ageGroupPos ?? false; break;
      case "pace": out[f.key] = true; break;
      default: out[f.key] = false;
    }
  }
  return out;
}

/** Gestos de enquadramento (arraste + pinça de 2 dedos + roda) sobre uma camada. */
function useLayerGesture(
  tRef: React.MutableRefObject<LayerTransform>,
  setT: (fn: (t: LayerTransform) => LayerTransform) => void,
) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const clampZoom = (z: number) => Math.max(1, Math.min(4, z));

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: tRef.current.zoom };
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setT((t) => ({ ...t, zoom: clampZoom((pinch.current!.zoom * dist) / pinch.current!.dist) }));
    } else {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const s = canvas.width / rect.width;
      const dx = (e.clientX - prev.x) * s;
      const dy = (e.clientY - prev.y) * s;
      setT((t) => ({ ...t, ox: t.ox + dx, oy: t.oy + dy }));
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    setT((t) => ({ ...t, zoom: clampZoom(t.zoom - e.deltaY * 0.001) }));
  };
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel };
}

/**
 * Estúdio de **cards compartilháveis** (estilo Strava) para um corredor, em duas
 * abas: **Fotos** (enviar e enquadrar a foto) e **Cards** (todos os modelos
 * prontos para baixar). Um ícone de **configurações** abre um painel com
 * **chaves** para ligar/desligar as informações no card (o padrão vem do ADM).
 * A logo do evento é sempre desenhada. Tudo no `<canvas>`, 100% no navegador.
 */
export default function ShareCardStudio({
  runner,
  event,
  brandLogo,
  routes,
  categoryLabel,
  display,
}: {
  runner: RaceResultRow;
  event?: EventInfo;
  brandLogo?: string;
  routes: PercursoRoute[];
  categoryLabel: string;
  display?: ClassificacaoDisplay;
}) {
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

  const [tab, setTab] = useState(0); // 0 = Fotos, 1 = Cards
  const [format, setFormat] = useState<CardFormat>(prefs.format ?? "feed");
  const [theme, setTheme] = useState<CardTheme>(prefs.theme ?? "dourado");
  const [showBadge, setShowBadge] = useState(prefs.showBadge ?? true);
  const [showQr, setShowQr] = useState(prefs.showQr ?? false);
  const [transparent, setTransparent] = useState(false);
  const [fields, setFields] = useState<Record<string, boolean>>(() => defaultFields(available, display));
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoT, setPhotoT] = useState<LayerTransform>(DEFAULT_T);
  const [mapT, setMapT] = useState<LayerTransform>(DEFAULT_T);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [mapImg, setMapImg] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  const photoTRef = useRef(photoT);
  const mapTRef = useRef(mapT);
  useEffect(() => { photoTRef.current = photoT; }, [photoT]);
  useEffect(() => { mapTRef.current = mapT; }, [mapT]);
  const photoGesture = useLayerGesture(photoTRef, setPhotoT);
  const mapGesture = useLayerGesture(mapTRef, setMapT);

  useEffect(() => { ensureFonts().then(() => setFontsReady(true)); }, []);
  useEffect(() => { loadImageTaintSafe(brandLogo).then(setLogoImg); }, [brandLogo]);
  useEffect(() => {
    let alive = true;
    loadImageTaintSafe(mapRoutes[0]?.fallbackImage).then((img) => alive && setMapImg(img));
    return () => { alive = false; };
  }, [mapRoutes]);

  const qr = useMemo(() => {
    if (!showQr || typeof window === "undefined") return null;
    try { return qrMatrix(`${window.location.origin}/#classificacao`); } catch { return null; }
  }, [showQr]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ format, theme, showBadge, showQr } as Prefs));
    } catch { /* ignore */ }
  }, [format, theme, showBadge, showQr]);

  const model: CardModel = useMemo(() => {
    const heroTime = fields.netTime ? runner.timeNet : fields.grossTime ? runner.timeGross : undefined;
    const chipKeys = ["pace", "team", "modality", "bib", "age", "ageGroup", "ageGroupPos", "dateCity"];
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

  const assets: CardAssets = useMemo(
    () => ({ logo: logoImg, photo: photoImg, map: mapImg, qr }),
    [logoImg, photoImg, mapImg, qr],
  );
  // fontsReady entra nas deps de desenho (via key) para redesenhar quando as fontes carregam.
  const drawKey = fontsReady ? 1 : 0;

  function handlePhoto(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhotoImg((prev) => { if (prev) URL.revokeObjectURL(prev.src); return img; });
      setPhotoT(DEFAULT_T);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  const chip = (active: boolean) =>
    `min-h-9 rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors ${
      active ? "bg-gold text-gold-ink" : "border border-line-soft bg-ink text-muted-strong hover:text-cream"
    }`;
  const aspect = `${FORMATS[format].w} / ${FORMATS[format].h}`;

  return (
    <div className="rounded-xl border border-line-soft bg-ink p-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ""; }}
      />

      {/* Cabeçalho + engrenagem de configurações. */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-cream">
          Card para compartilhar
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Configurações do card"
          aria-expanded={settingsOpen}
          className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${
            settingsOpen ? "border-gold text-gold" : "border-line-soft text-muted-strong hover:text-cream"
          }`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Painel de configurações (chaves). */}
      {settingsOpen && (
        <div className="mb-4 rounded-lg border border-line-soft bg-ink-panel p-4">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
            Informações no card
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {available.map((f) => (
              <Switch key={f.key} label={f.label} on={!!fields[f.key]} onChange={(v) => setFields((s) => ({ ...s, [f.key]: v }))} />
            ))}
          </div>
          <div className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-[0.05em] text-muted">Extras</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <Switch label={runner.pos <= 3 ? "Selo de medalha" : "Selo finisher"} on={showBadge} onChange={setShowBadge} />
            <Switch label="QR da classificação" on={showQr} onChange={setShowQr} />
            <Switch label="Fundo transparente" on={transparent} onChange={setTransparent} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="w-full text-[12px] font-bold uppercase tracking-[0.05em] text-muted">Tema</span>
            {(Object.keys(THEME_LABEL) as CardTheme[]).map((t) => (
              <button key={t} type="button" onClick={() => setTheme(t)} className={chip(theme === t)}>
                {THEME_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Abas Fotos / Cards. */}
      <SegmentedTabs
        items={["Fotos", "Cards"]}
        active={tab}
        onSelect={setTab}
        ariaLabel="Fotos ou cards"
        className="mb-4 rounded-lg border border-line-soft"
      />

      {tab === 0 ? (
        /* ---- Aba Fotos: enviar + enquadrar ---- */
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(FORMATS) as CardFormat[]).map((f) => (
              <button key={f} type="button" onClick={() => setFormat(f)} className={chip(format === f)}>
                {FORMATS[f].label}
              </button>
            ))}
          </div>

          {photoImg ? (
            <>
              <div className="flex justify-center">
                <PhotoFrame img={photoImg} format={format} transform={photoT} gesture={photoGesture} />
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted">
                Arraste para reposicionar · pinça (celular) para zoom
              </p>
              <div className="mt-2 hidden items-center gap-3 md:flex">
                <span className="w-[54px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">Zoom</span>
                <input
                  type="range" min={1} max={4} step={0.02} value={photoT.zoom}
                  onChange={(e) => setPhotoT((t) => ({ ...t, zoom: Number(e.target.value) }))}
                  className="h-2 w-full accent-gold" aria-label="Zoom da foto"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button type="button" onClick={() => fileRef.current?.click()} className={chip(false)}>Trocar foto</button>
                <button type="button" onClick={() => { setPhotoImg(null); setPhotoT(DEFAULT_T); }} className={chip(false)}>Remover</button>
              </div>
            </>
          ) : (
            /* Componente de imagem clicável (escolher uma imagem). */
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full max-w-[360px] mx-auto flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-soft bg-ink-panel text-muted transition-colors hover:border-gold hover:text-cream"
              style={{ aspectRatio: aspect }}
              aria-label="Escolher uma foto"
            >
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 16l4-4 4 4 4-6 4 6" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="9" r="1.4" />
              </svg>
              <span className="text-[13px] font-bold uppercase tracking-[0.04em]">Escolher uma foto</span>
              <span className="text-[11px]">toque para enviar do seu aparelho</span>
            </button>
          )}
        </div>
      ) : (
        /* ---- Aba Cards: modelos prontos p/ baixar ---- */
        <div>
          <p className="mb-3 text-[12px] text-muted">
            Baixe/compartilhe — tudo no seu aparelho. Ajuste o que aparece na engrenagem.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {availableTemplates.map((t) => {
              const st: CardState = {
                template: t,
                format,
                theme,
                transparent,
                photo: photoT,
                map: mapT,
              };
              const movable = t === "trajeto";
              return (
                <CardPreview
                  key={t}
                  title={TEMPLATE_LABEL[t]}
                  state={st}
                  model={model}
                  assets={assets}
                  drawKey={drawKey}
                  filenameBase={`card-${slug(runner.name)}-${t}-${format}`}
                  shareText={`${runner.name} — ${runner.pos}º lugar (${categoryLabel}).`}
                  movable={movable}
                  gesture={movable ? mapGesture : undefined}
                  zoom={movable ? mapT.zoom : undefined}
                  onZoom={movable ? (z) => setMapT((tt) => ({ ...tt, zoom: z })) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Chave (toggle switch) acessível. */
function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-[13px] text-cream transition-colors hover:bg-white/5"
    >
      <span>{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-gold" : "bg-line-soft"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** Canvas de enquadramento da foto (só a foto, na proporção do formato). */
function PhotoFrame({
  img,
  format,
  transform,
  gesture,
}: {
  img: HTMLImageElement;
  format: CardFormat;
  transform: LayerTransform;
  gesture: ReturnType<typeof useLayerGesture>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const { w, h } = FORMATS[format];
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#120805";
    ctx.fillRect(0, 0, w, h);
    drawCover(ctx, img, 0, 0, w, h, transform);
  }, [img, format, transform]);
  return (
    <canvas
      ref={ref}
      {...gesture}
      className="w-auto max-h-[52vh] max-w-full cursor-grab touch-none rounded-lg border border-line-soft active:cursor-grabbing"
      style={{ aspectRatio: `${FORMATS[format].w} / ${FORMATS[format].h}` }}
      aria-label="Enquadrar a foto"
    />
  );
}

/** Um card pronto (canvas) + baixar/compartilhar. Opcionalmente enquadrável. */
function CardPreview({
  title,
  state,
  model,
  assets,
  drawKey,
  filenameBase,
  shareText,
  movable,
  gesture,
  zoom,
  onZoom,
}: {
  title: string;
  state: CardState;
  model: CardModel;
  assets: CardAssets;
  drawKey: number;
  filenameBase: string;
  shareText: string;
  movable?: boolean;
  gesture?: ReturnType<typeof useLayerGesture>;
  zoom?: number;
  onZoom?: (z: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const { w, h } = FORMATS[state.format];
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawCard(ctx, w, h, state, model, assets);
  }, [state, model, assets, drawKey]);

  const getBlob = () => new Promise<Blob | null>((res) => ref.current?.toBlob(res, "image/png"));
  const download = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const share = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], `${filenameBase}.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: "Meu resultado", text: shareText }); return; } catch { /* fallback */ }
    }
    await download();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{title}</div>
      <canvas
        ref={ref}
        {...(movable && gesture ? gesture : {})}
        className={`mt-1.5 w-full rounded-lg border border-line-soft ${movable ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
        style={{ aspectRatio: `${FORMATS[state.format].w} / ${FORMATS[state.format].h}` }}
        aria-label={`Card ${title}`}
      />
      {movable && (
        <>
          <p className="mt-1 text-[11px] text-muted">Arraste · pinça (celular) para enquadrar o mapa</p>
          <div className="mt-1.5 hidden items-center gap-3 md:flex">
            <span className="w-[54px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">Zoom</span>
            <input
              type="range" min={1} max={4} step={0.02} value={zoom ?? 1}
              onChange={(e) => onZoom?.(Number(e.target.value))}
              className="h-2 w-full accent-gold" aria-label="Zoom do mapa"
            />
          </div>
        </>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          className="min-h-11 flex-1 rounded-lg bg-gold px-4 text-[13px] font-bold text-gold-ink transition-transform hover:-translate-y-0.5"
        >
          Baixar
        </button>
        <button
          type="button"
          onClick={share}
          className="min-h-11 rounded-lg border border-gold px-4 text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-gold-ink"
        >
          Compartilhar
        </button>
      </div>
    </div>
  );
}
