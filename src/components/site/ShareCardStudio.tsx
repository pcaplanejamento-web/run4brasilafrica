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
  ensureFonts,
  FORMATS,
  loadImageTaintSafe,
  MODE_LABEL,
  MODE_SPEC,
  TEMPLATE_LABEL,
  type CardAssets,
  type CardField,
  type CardFormat,
  type CardMode,
  type CardModel,
  type CardState,
  type CardTemplate,
  type LayerTransform,
} from "@/lib/results/card";
import { qrMatrix } from "@/lib/results/qr";
import SegmentedTabs from "./SegmentedTabs";

const PREFS_KEY = "r4ba:card:prefs";
const DEFAULT_T: LayerTransform = { ox: 0, oy: 0, zoom: 1 };

interface Prefs {
  format: CardFormat;
  showBadge: boolean;
  showQr: boolean;
  showRaceName: boolean;
  mode: CardMode;
  cardTemplate: CardTemplate;
}
function loadPrefs(): Partial<Prefs> {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}
function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

type ShareOutcome = "shared" | "canceled" | "unavailable";
/**
 * Tenta o **compartilhamento nativo** de um arquivo. Distingue o usuário ter
 * **cancelado** a folha (`AbortError`) — que NÃO deve disparar nenhum fallback
 * (nada de baixar sozinho nem abrir o WhatsApp) — de o recurso estar
 * **indisponível/falhar**, quando o chamador cai no plano B (baixar).
 */
async function tryNativeShare(file: File, extra?: { title?: string; text?: string }): Promise<ShareOutcome> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.share !== "function" || !nav.canShare?.({ files: [file] })) return "unavailable";
  try {
    await nav.share({ files: [file], ...extra });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "canceled";
    return "unavailable";
  }
}

/** Baixa um blob como arquivo (desktop, ou quando não há compartilhamento nativo). */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

/** Gestos de enquadramento (arraste + pinça de 2 dedos + roda). No **toque**, só
 *  age quando `editingRef` está ligado (fora disso o dedo **rola a página** —
 *  `touch-action: pan-y`); com **mouse** age sempre. */
function useLayerGesture(
  tRef: React.MutableRefObject<LayerTransform>,
  setT: (fn: (t: LayerTransform) => LayerTransform) => void,
  editingRef: React.MutableRefObject<boolean>,
  minZoom = 1,
  maxZoom = 4,
) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const clampZoom = (z: number) => Math.max(minZoom, Math.min(maxZoom, z));
  const acts = (e: React.PointerEvent) => e.pointerType === "mouse" || editingRef.current;
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!acts(e)) return; // toque fora do modo edição → deixa a página rolar
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
      setT((t) => ({ ...t, ox: t.ox + (e.clientX - prev.x) * s, oy: t.oy + (e.clientY - prev.y) * s }));
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!editingRef.current) return; // fora da edição a roda rola a página
    setT((t) => ({ ...t, zoom: clampZoom(t.zoom - e.deltaY * 0.001) }));
  };
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel };
}

/**
 * Estúdio de **cards** de um corredor, em duas abas: **Fotos** (o card leva as
 * informações e o usuário sobe a foto que fica ao fundo — pode baixar sem foto,
 * com **fundo transparente**) e **Cards** (banners prontos, estilo Strava, em
 * temas claro/escuro para baixar). Engrenagem = **chaves** que ligam/desligam as
 * informações (padrão do ADM). Logo do evento sempre presente. 100% no navegador.
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
  const available: CardField[] = useMemo(() => cardFieldOptions(runner, event, routes), [runner, event, routes]);
  const prefs = useMemo(() => (typeof window !== "undefined" ? loadPrefs() : {}), []);

  const hasMap = mapRoutes.length > 0;

  const [tab, setTab] = useState(0); // 0 = Fotos, 1 = Cards
  const [format, setFormat] = useState<CardFormat>(prefs.format ?? "feed");
  const [showBadge, setShowBadge] = useState(prefs.showBadge ?? true);
  const [showQr, setShowQr] = useState(prefs.showQr ?? false);
  const [showRaceName, setShowRaceName] = useState(prefs.showRaceName ?? false);
  const [showMap, setShowMap] = useState(false); // mapa sobre a foto (fora das configs)
  const [mode, setMode] = useState<CardMode>(prefs.mode ?? "escuro"); // Cards: claro/escuro/transparente
  const [cardTemplate, setCardTemplate] = useState<CardTemplate>(prefs.cardTemplate ?? "banner");
  const [photoLayer, setPhotoLayer] = useState<"foto" | "mapa">("foto"); // camada ativa na aba Fotos
  const [fields, setFields] = useState<Record<string, boolean>>(() => defaultFields(available, display));
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoT, setPhotoT] = useState<LayerTransform>(DEFAULT_T);
  const [mapInsetT, setMapInsetT] = useState<LayerTransform>(DEFAULT_T);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [mapImg, setMapImg] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  // Modo de "reposicionar" da aba Fotos: no toque, só enquadra quando ligado
  // (senão a página rola por cima da imagem). No mouse, arrasta sempre.
  const [photoEditing, setPhotoEditing] = useState(false);
  const photoTRef = useRef(photoT);
  const mapInsetTRef = useRef(mapInsetT);
  const photoEditRef = useRef(photoEditing);
  useEffect(() => { photoTRef.current = photoT; }, [photoT]);
  useEffect(() => { mapInsetTRef.current = mapInsetT; }, [mapInsetT]);
  useEffect(() => { photoEditRef.current = photoEditing; }, [photoEditing]);
  const photoGesture = useLayerGesture(photoTRef, setPhotoT, photoEditRef);
  // O mapa sobre a foto pode diminuir (0,3×) e crescer (3×).
  const mapInsetGesture = useLayerGesture(mapInsetTRef, setMapInsetT, photoEditRef, 0.3, 3);

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
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ format, showBadge, showQr, showRaceName, mode, cardTemplate } as Prefs),
      );
    } catch { /* ignore */ }
  }, [format, showBadge, showQr, showRaceName, mode, cardTemplate]);

  const model: CardModel = useMemo(() => {
    const heroTime = fields.netTime ? runner.timeNet : fields.grossTime ? runner.timeGross : undefined;
    const chipKeys = ["pace", "team", "modality", "bib", "age", "ageGroup", "ageGroupPos", "dateCity"];
    const chips = available.filter((f) => chipKeys.includes(f.key) && fields[f.key]).map((f) => ({ label: f.label, value: f.value }));
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

  const assets: CardAssets = useMemo(() => ({ logo: logoImg, photo: photoImg, map: mapImg, qr }), [logoImg, photoImg, mapImg, qr]);
  const drawKey = fontsReady ? 1 : 0;

  function handlePhoto(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setPhotoImg((prev) => { if (prev) URL.revokeObjectURL(prev.src); return img; }); setPhotoT(DEFAULT_T); };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  const chip = (active: boolean) =>
    `min-h-9 rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors ${
      active ? "bg-gold text-gold-ink" : "border border-line-soft bg-ink text-muted-strong hover:text-cream"
    }`;

  const fotoState: CardState = {
    template: "foto", format, theme: "dourado", transparent: false,
    photo: photoT, map: DEFAULT_T, mapInset: mapInsetT,
    showMap: showMap && hasMap, showRaceName,
  };

  // Aba Cards: visualização (template) × modo (claro/escuro/transparente).
  const cardTemplates: CardTemplate[] = hasMap ? ["banner", "destaque", "mapa"] : ["banner", "destaque"];
  const activeTemplate = cardTemplates.includes(cardTemplate) ? cardTemplate : "banner";
  const modeSpec = MODE_SPEC[mode];
  const cardsState: CardState = {
    template: activeTemplate, format, theme: modeSpec.theme, transparent: modeSpec.transparent,
    photo: DEFAULT_T, map: DEFAULT_T, showRaceName,
  };

  // A camada ativa na aba Fotos (foto ou mapa) diz qual transform o gesto move.
  const activeIsMap = photoLayer === "mapa" && showMap && hasMap;
  const fotoGesture = activeIsMap ? mapInsetGesture : photoGesture;
  const fotoZoom = activeIsMap ? mapInsetT.zoom : photoT.zoom;
  const setFotoZoom = activeIsMap
    ? (z: number) => setMapInsetT((t) => ({ ...t, zoom: z }))
    : (z: number) => setPhotoT((t) => ({ ...t, zoom: z }));
  const fotoMovable = !!photoImg || (showMap && hasMap);

  return (
    <div className="rounded-xl border border-line-soft bg-ink p-4">
      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ""; }}
      />

      {/* Cabeçalho + engrenagem. */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-cream">Card para compartilhar</div>
        <button
          type="button" onClick={() => setSettingsOpen((v) => !v)} aria-label="Configurações do card" aria-expanded={settingsOpen}
          className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${settingsOpen ? "border-gold text-gold" : "border-line-soft text-muted-strong hover:text-cream"}`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {settingsOpen && (
        <div className="mb-4 rounded-lg border border-line-soft bg-ink-panel p-4">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-muted">Informações no card</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {available.map((f) => (
              <Switch key={f.key} label={f.label} on={!!fields[f.key]} onChange={(v) => setFields((s) => ({ ...s, [f.key]: v }))} />
            ))}
          </div>
          <div className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-[0.05em] text-muted">Extras</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <Switch label="Nome da corrida ao lado da logo" on={showRaceName} onChange={setShowRaceName} />
            <Switch label={runner.pos <= 3 ? "Selo de medalha" : "Selo finisher"} on={showBadge} onChange={setShowBadge} />
            <Switch label="QR da classificação" on={showQr} onChange={setShowQr} />
          </div>
        </div>
      )}

      <SegmentedTabs items={["Fotos", "Cards"]} active={tab} onSelect={setTab} ariaLabel="Fotos ou cards" className="mb-4 rounded-lg border border-line-soft" />

      {/* Formato (compartilhado). */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(FORMATS) as CardFormat[]).map((f) => (
          <button key={f} type="button" onClick={() => setFormat(f)} className={chip(format === f)}>{FORMATS[f].label}</button>
        ))}
      </div>

      {tab === 0 ? (
        /* ---- Aba Fotos: o card leva as infos; o usuário sobe a foto ao fundo ---- */
        <div>
          {/* Mapa da prova (FORA das configurações) + seletor de camada. */}
          {hasMap && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowMap((v) => !v)} className={chip(showMap)}>Mapa da prova</button>
              {showMap && (
                <>
                  <span className="text-[11px] uppercase tracking-[0.05em] text-muted">Editar:</span>
                  <button type="button" onClick={() => setPhotoLayer("foto")} className={chip(photoLayer === "foto")}>Foto</button>
                  <button type="button" onClick={() => setPhotoLayer("mapa")} className={chip(photoLayer === "mapa")}>Mapa</button>
                </>
              )}
            </div>
          )}
          <CardPreview
            title="Sua foto com os dados"
            state={fotoState}
            model={model}
            assets={assets}
            drawKey={drawKey}
            filenameBase={`card-${slug(runner.name)}-foto-${format}`}
            shareText={`${runner.name} — ${runner.pos}º lugar (${categoryLabel}).`}
            movable={fotoMovable}
            gesture={fotoMovable ? fotoGesture : undefined}
            zoom={fotoMovable ? fotoZoom : undefined}
            onZoom={fotoMovable ? setFotoZoom : undefined}
            onCanvasClick={!photoImg && photoLayer === "foto" ? () => fileRef.current?.click() : undefined}
            hint={!photoImg ? "Toque para escolher sua foto de fundo" : undefined}
            extraDownloadLabel="Baixar sem foto (transparente)"
            editing={photoEditing}
            onToggleEdit={fotoMovable ? () => setPhotoEditing((v) => !v) : undefined}
            editLabel={activeIsMap ? "Reposicionar mapa" : "Reposicionar foto"}
          />
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => fileRef.current?.click()} className={chip(false)}>{photoImg ? "Trocar foto" : "Escolher foto"}</button>
            {photoImg && (
              <button type="button" onClick={() => { setPhotoImg(null); setPhotoT(DEFAULT_T); }} className={chip(false)}>Remover foto</button>
            )}
          </div>
        </div>
      ) : (
        /* ---- Aba Cards: visualização × modo (claro/escuro/transparente) ---- */
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="w-[70px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">Modelo</span>
            {cardTemplates.map((t) => (
              <button key={t} type="button" onClick={() => setCardTemplate(t)} className={chip(activeTemplate === t)}>{TEMPLATE_LABEL[t]}</button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="w-[70px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">Fundo</span>
            {(Object.keys(MODE_LABEL) as CardMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={chip(mode === m)}>{MODE_LABEL[m]}</button>
            ))}
          </div>
          <div className="mx-auto max-w-[460px]">
            <CardPreview
              title={`${TEMPLATE_LABEL[activeTemplate]} · ${MODE_LABEL[mode]}`}
              state={cardsState}
              model={model}
              assets={assets}
              drawKey={drawKey}
              filenameBase={`card-${slug(runner.name)}-${activeTemplate}-${mode}-${format}`}
              shareText={`${runner.name} — ${runner.pos}º lugar (${categoryLabel}).`}
            />
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
      type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-[13px] text-cream transition-colors hover:bg-white/5"
    >
      <span>{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-gold" : "bg-line-soft"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** Um card (canvas WYSIWYG) + baixar/compartilhar. Opcionalmente enquadrável
 *  (arraste/zoom) e/ou clicável para escolher a foto. */
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
  onCanvasClick,
  hint,
  extraDownloadLabel,
  editing,
  onToggleEdit,
  editLabel,
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
  onCanvasClick?: () => void;
  hint?: string;
  extraDownloadLabel?: string;
  editing?: boolean;
  onToggleEdit?: () => void;
  editLabel?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // No **celular** só oferecemos "Compartilhar" (que salva na galeria); o botão
  // Baixar fica só no desktop.
  const [coarse] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches,
  );
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const { w, h } = FORMATS[state.format];
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    try {
      drawCard(ctx, w, h, state, model, assets);
    } catch (e) {
      console.error("[card] erro ao desenhar:", e);
    }
  }, [state, model, assets, drawKey]);

  /** Renderiza off-screen (permite variante transparente sem sujar o preview).
   *  Blindado: se o canvas for "tainted" (imagem cross-origin sem CORS) o
   *  `toBlob` lança — capturamos e devolvemos null, nunca quebrando a UI. */
  const renderBlob = (transparent: boolean) =>
    new Promise<Blob | null>((res) => {
      try {
        const { w, h } = FORMATS[state.format];
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return res(null);
        drawCard(ctx, w, h, transparent ? { ...state, transparent: true } : state, model, assets);
        c.toBlob(res, "image/png");
      } catch {
        res(null);
      }
    });

  /** Salva a imagem. No **celular** usa o compartilhamento nativo (com um toque em
   *  "Salvar em Fotos" a imagem vai direto para a galeria); no **desktop** baixa
   *  direto (sem prompt). */
  const saveImage = async (transparent: boolean) => {
    const blob = await renderBlob(transparent);
    if (!blob) return;
    const filename = `${filenameBase}${transparent ? "-transparente" : ""}.png`;
    // No celular tentamos a folha nativa (um toque em "Salvar em Fotos" leva à
    // galeria). Cancelar NÃO baixa nada; só baixamos se o recurso não existir.
    if (coarse) {
      const r = await tryNativeShare(new File([blob], filename, { type: "image/png" }));
      if (r === "shared" || r === "canceled") return;
    }
    downloadBlob(blob, filename);
  };
  const share = async () => {
    const blob = await renderBlob(false);
    if (!blob) return;
    const filename = `${filenameBase}.png`;
    const file = new File([blob], filename, { type: "image/png" });
    const r = await tryNativeShare(file, { title: "Meu resultado", text: shareText });
    if (r === "shared" || r === "canceled") return; // compartilhou ou cancelou → fim
    // Sem compartilhamento nativo (ex.: desktop): baixa a imagem e abre o WhatsApp.
    downloadBlob(blob, filename);
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  };

  const canEdit = movable && !!onToggleEdit;
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{title}</span>
        {canEdit && (
          <button
            type="button"
            onClick={onToggleEdit}
            aria-pressed={!!editing}
            className={`min-h-9 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.03em] transition-colors ${
              editing ? "bg-gold text-gold-ink" : "border border-line-soft text-muted-strong hover:text-cream"
            }`}
          >
            {editing ? "Concluir" : (editLabel ?? "Reposicionar")}
          </button>
        )}
      </div>
      <canvas
        ref={ref}
        {...(movable && gesture ? gesture : {})}
        onClick={onCanvasClick}
        className={`mt-1.5 w-full rounded-lg border ${editing ? "border-gold" : "border-line-soft"} ${movable && editing ? "cursor-grab active:cursor-grabbing" : ""} ${onCanvasClick ? "cursor-pointer" : ""}`}
        style={{
          aspectRatio: `${FORMATS[state.format].w} / ${FORMATS[state.format].h}`,
          // Fora do modo edição, o toque ROLA a página (pan-y); em edição, gestos.
          touchAction: movable ? (editing ? "none" : "pan-y") : undefined,
        }}
        aria-label={`Card ${title}`}
      />
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      {canEdit && (
        <p className="mt-1 text-[11px] text-muted">
          {editing
            ? "Arraste para reposicionar · pinça (celular) para zoom · toque em Concluir para rolar"
            : "Toque em Reposicionar para enquadrar (fora disso, a página rola normalmente)"}
        </p>
      )}
      {movable && editing && (
        <div className="mt-1.5 hidden items-center gap-3 md:flex">
          <span className="w-[54px] shrink-0 text-[11px] uppercase tracking-[0.05em] text-muted">Zoom</span>
          <input type="range" min={1} max={4} step={0.02} value={zoom ?? 1} onChange={(e) => onZoom?.(Number(e.target.value))} className="h-2 w-full accent-gold" aria-label="Zoom" />
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {/* No mobile só "Compartilhar" (que salva na galeria); "Baixar" só no desktop. */}
        {!coarse && (
          <button type="button" onClick={() => saveImage(false)} className="min-h-11 flex-1 rounded-lg bg-gold px-4 text-[13px] font-bold text-gold-ink transition-transform hover:-translate-y-0.5">Baixar</button>
        )}
        <button type="button" onClick={share} className={`min-h-11 rounded-lg text-[13px] font-bold transition-colors ${coarse ? "flex-1 bg-gold px-4 text-gold-ink hover:-translate-y-0.5" : "border border-gold px-4 text-gold hover:bg-gold hover:text-gold-ink"}`}>Compartilhar</button>
      </div>
      {extraDownloadLabel && !coarse && (
        <button type="button" onClick={() => saveImage(true)} className="mt-2 min-h-11 rounded-lg border border-line-soft px-4 text-[13px] font-bold text-muted-strong transition-colors hover:border-gold hover:text-cream">
          {extraDownloadLabel}
        </button>
      )}
    </div>
  );
}
