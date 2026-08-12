"use client";

import { useCallback, useRef, useState } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import { SpinnerIcon } from "./mediaIcons";

/** Retângulo de recorte em **pixels naturais** da imagem (0..natW × 0..natH). */
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Handle = "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const MIN = 16; // lado mínimo do recorte (px naturais)

/** Fundo xadrez (mostra a transparência do PNG por baixo do recorte). */
const CHECKER: React.CSSProperties = {
  backgroundColor: "#fff",
  backgroundImage:
    "linear-gradient(45deg,#e2e2dc 25%,transparent 25%,transparent 75%,#e2e2dc 75%)," +
    "linear-gradient(45deg,#e2e2dc 25%,transparent 25%,transparent 75%,#e2e2dc 75%)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0,11px 11px",
};

/**
 * **Editor de recorte** de uma imagem do armazenamento — arraste/redimensione o
 * quadro (8 alças + mover), no **toque** e no mouse. O recorte é feito num canvas
 * **sem preencher fundo**, então **PNGs transparentes mantêm a transparência**
 * (exporta PNG; o upload converte p/ WebP com alpha). Salva como **nova imagem**
 * no armazenamento (não sobrescreve — mantém as referências existentes intactas).
 * 100% componente; sem dependências externas.
 */
export default function MediaCropEditor({
  url,
  onCancel,
  onSaved,
}: {
  url: string;
  onCancel: () => void;
  onSaved: (newUrl: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; sx: number; sy: number; start: Rect; factor: number } | null>(null);

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    setNat({ w, h });
    // Recorte inicial: 86% central (dá margem visível p/ arrastar as alças).
    const cw = Math.round(w * 0.86);
    const ch = Math.round(h * 0.86);
    setRect({ x: Math.round((w - cw) / 2), y: Math.round((h - ch) / 2), w: cw, h: ch });
  };

  const clamp = useCallback(
    (r: Rect): Rect => {
      if (!nat) return r;
      let { x, y, w, h } = r;
      if (w < 0) { x += w; w = -w; }
      if (h < 0) { y += h; h = -h; }
      w = Math.max(MIN, Math.min(w, nat.w));
      h = Math.max(MIN, Math.min(h, nat.h));
      x = Math.max(0, Math.min(x, nat.w - w));
      y = Math.max(0, Math.min(y, nat.h - h));
      return { x, y, w, h };
    },
    [nat],
  );

  /** Fator px-de-tela → px-naturais (mesma proporção nos dois eixos). */
  const factorNow = () => {
    const wrap = wrapRef.current;
    if (!wrap || !nat) return 1;
    const r = wrap.getBoundingClientRect();
    return r.width ? nat.w / r.width : 1;
  };

  const beginDrag = (e: React.PointerEvent) => {
    if (!rect) return;
    const handle = ((e.currentTarget as HTMLElement).dataset.handle as Handle) || "move";
    e.preventDefault();
    e.stopPropagation();
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* ok */ }
    drag.current = { handle, sx: e.clientX, sy: e.clientY, start: { ...rect }, factor: factorNow() };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) * d.factor;
    const dy = (e.clientY - d.sy) * d.factor;
    const s = d.start;
    let r: Rect = { ...s };
    switch (d.handle) {
      case "move": r = { ...s, x: s.x + dx, y: s.y + dy }; break;
      case "e": r = { ...s, w: s.w + dx }; break;
      case "w": r = { ...s, x: s.x + dx, w: s.w - dx }; break;
      case "s": r = { ...s, h: s.h + dy }; break;
      case "n": r = { ...s, y: s.y + dy, h: s.h - dy }; break;
      case "se": r = { ...s, w: s.w + dx, h: s.h + dy }; break;
      case "sw": r = { ...s, x: s.x + dx, w: s.w - dx, h: s.h + dy }; break;
      case "ne": r = { ...s, y: s.y + dy, w: s.w + dx, h: s.h - dy }; break;
      case "nw": r = { ...s, x: s.x + dx, y: s.y + dy, w: s.w - dx, h: s.h - dy }; break;
    }
    if (d.handle === "move") {
      // mover não redimensiona — só clampa a posição
      r.x = Math.max(0, Math.min(r.x, (nat?.w ?? r.w) - r.w));
      r.y = Math.max(0, Math.min(r.y, (nat?.h ?? r.h) - r.h));
      setRect(r);
    } else {
      setRect(clamp(r));
    }
  };
  const endDrag = () => { drag.current = null; };

  const reset = () => { if (nat) setRect({ x: 0, y: 0, w: nat.w, h: nat.h }); };

  async function apply() {
    const img = imgRef.current;
    if (!img || !rect || !nat) return;
    setSaving(true);
    setError(null);
    try {
      const x = Math.round(rect.x), y = Math.round(rect.y);
      const w = Math.max(1, Math.round(rect.w)), h = Math.max(1, Math.round(rect.h));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      // SEM fillRect → o alpha do PNG é preservado (fundo transparente continua transparente).
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("toBlob");
      const file = new File([blob], "recorte.png", { type: "image/png" });
      const r = await uploadMedia(file);
      if (r.code === "not_configured") { setError("Edição disponível apenas no site publicado."); return; }
      if (!r.url) { setError(r.error ?? "Não foi possível salvar o recorte."); return; }
      onSaved(r.url);
    } catch {
      // Canvas "tainted" (imagem sem CORS) faz o toBlob lançar — reportamos sem quebrar.
      setError("Não foi possível processar a imagem (permissão de origem).");
    } finally {
      setSaving(false);
    }
  }

  // Posição das alças em % do recorte (para renderização).
  const pct = nat && rect
    ? { left: `${(rect.x / nat.w) * 100}%`, top: `${(rect.y / nat.h) * 100}%`, width: `${(rect.w / nat.w) * 100}%`, height: `${(rect.h / nat.h) * 100}%` }
    : null;

  const handles: { h: Handle; cls: string; cursor: string }[] = [
    { h: "nw", cls: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
    { h: "n", cls: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
    { h: "ne", cls: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
    { h: "e", cls: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
    { h: "se", cls: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
    { h: "s", cls: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
    { h: "sw", cls: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
    { h: "w", cls: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-adm-ink">Recortar imagem</div>
        {nat && (
          <div className="text-[12px] text-adm-muted">
            Recorte: {rect ? `${Math.round(rect.w)} × ${Math.round(rect.h)} px` : "—"}
          </div>
        )}
      </div>

      {/* Palco: imagem (contain) com xadrez atrás + quadro de recorte por cima. */}
      <div className="grid place-items-center rounded-lg border border-adm-border bg-[#f4f4f2] p-2 sm:p-3">
        <div
          ref={wrapRef}
          className="relative inline-block select-none"
          style={{ touchAction: "none", maxWidth: "100%" }}
        >
          <div className="pointer-events-none absolute inset-0 rounded" style={CHECKER} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            crossOrigin="anonymous"
            alt="Imagem para recortar"
            onLoad={onImgLoad}
            draggable={false}
            className="relative block max-h-[56vh] w-auto max-w-full rounded"
          />

          {pct && (
            <div className="pointer-events-none absolute inset-0" onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
              {/* Área do recorte: móvel; fora dela escurece via box-shadow. */}
              <div
                data-handle="move"
                className="pointer-events-auto absolute cursor-move"
                style={{ ...pct, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)", outline: "1px solid rgba(255,255,255,0.9)" }}
                onPointerDown={beginDrag}
                onPointerMove={onMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {/* Regra dos terços. */}
                <div className="pointer-events-none absolute inset-0 opacity-70">
                  <div className="absolute left-1/3 top-0 h-full w-px bg-white/40" />
                  <div className="absolute left-2/3 top-0 h-full w-px bg-white/40" />
                  <div className="absolute top-1/3 left-0 w-full h-px bg-white/40" />
                  <div className="absolute top-2/3 left-0 w-full h-px bg-white/40" />
                </div>
                {/* Alças (alvo grande p/ toque via padding transparente). */}
                {handles.map((hd) => (
                  <span
                    key={hd.h}
                    data-handle={hd.h}
                    onPointerDown={beginDrag}
                    onPointerMove={onMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    role="button"
                    aria-label={`Ajustar ${hd.h}`}
                    className={`absolute grid h-8 w-8 place-items-center ${hd.cls}`}
                    style={{ cursor: hd.cursor, touchAction: "none" }}
                  >
                    <span className="h-3.5 w-3.5 rounded-[3px] border-2 border-white bg-terracotta shadow" />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[#e0b4b0] bg-[#fdf2f1] px-3 py-2 text-[13px] text-[#c0392b]">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={saving || !rect}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-terracotta px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <SpinnerIcon className="h-4 w-4" /> : null}
          {saving ? "Salvando…" : "Salvar recorte como nova imagem"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={saving}
          className="min-h-11 rounded-md border border-[#ccc] bg-white px-4 text-[13px] text-adm-ink transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-60"
        >
          Imagem inteira
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-11 rounded-md px-4 text-[13px] text-adm-muted transition-colors hover:text-adm-ink disabled:opacity-60"
        >
          Cancelar
        </button>
        <span className="w-full text-[12px] text-adm-muted sm:ml-auto sm:w-auto">
          PNG transparente mantém a transparência. Arraste o quadro ou as alças (funciona no toque).
        </span>
      </div>
    </div>
  );
}
