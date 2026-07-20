"use client";

import { useRef, useState } from "react";
import type { HeroSlide } from "@/lib/content/types";
import HeroMedia from "@/components/site/HeroMedia";
import { uploadMedia, type CloudinaryConfig } from "@/lib/uploadMedia";
import { FieldLabel } from "./ui";
import { SpinnerIcon, SwapIcon, TrashIcon, UploadIcon, iconSm } from "./mediaIcons";

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Unified banner image field: **importar, reimportar, excluir e enquadrar** numa
 * caixa só, na proporção real do site (16:9 desktop / 3:4 mobile). Mostra a foto
 * exatamente como aparece na tela inicial (via `HeroMedia`, sem corte) e um clique/
 * toque na imagem define o ponto que fica centralizado (object-position). Os botões
 * no canto trocam ou removem a foto; sem foto, a caixa vira um botão de envio.
 *
 * Combina o antigo `ImageUpload` + `FocusPicker` (reaproveitando `uploadMedia`,
 * `HeroMedia` e os ícones), então não há duplicação e o preview é fiel ao público.
 */
export default function HeroImageField({
  slide,
  variant,
  ratioClass,
  label,
  value,
  onChange,
  onFocus,
  hint,
  cloudinary,
}: {
  slide: HeroSlide;
  variant: "desktop" | "mobile";
  ratioClass: string;
  label: string;
  /** This field's own image URL (image or imageMobile). */
  value?: string;
  onChange: (url: string) => void;
  onFocus: (x: number, y: number) => void;
  hint?: string;
  cloudinary?: CloudinaryConfig;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fx = variant === "desktop" ? slide.focusX ?? 50 : slide.focusXm ?? 50;
  const fy = variant === "desktop" ? slide.focusY ?? 50 : slide.focusYm ?? 50;
  // What HeroMedia will actually show for this variant (mobile falls back to the
  // desktop image). If there's something to show, the box is a framing preview;
  // otherwise it's an upload dropzone.
  const hasPreview =
    variant === "desktop" ? !!slide.image : !!(slide.imageMobile || slide.image);

  async function handleFile(f: File) {
    setError(null);
    setBusy(true);
    const r = await uploadMedia(f, { cloudinary });
    if (r.code === "not_configured") {
      setError("Upload disponível apenas no site publicado.");
    } else if (r.url) {
      onChange(r.url);
    } else {
      setError(r.error ?? "Falha no upload.");
    }
    setBusy(false);
  }

  function pick(clientX: number, clientY: number) {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.round(clampPct(((clientX - r.left) / r.width) * 100));
    const y = Math.round(clampPct(((clientY - r.top) / r.height) * 100));
    onFocus(x, y);
  }

  const overlayBtn =
    "grid h-9 w-9 place-items-center rounded-md bg-black/60 text-white hover:bg-black/80 disabled:opacity-60";

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {hasPreview ? (
        <div
          ref={boxRef}
          role="button"
          tabIndex={0}
          aria-label={`${label} — toque para escolher o ponto de foco`}
          onClick={(e) => pick(e.clientX, e.clientY)}
          className={`relative ${ratioClass} w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-adm-border bg-[#1a1400]`}
        >
          <HeroMedia slide={slide} variant={variant} />

          {/* Focal-point marker (exactly where the site centers the image). */}
          <span
            className="pointer-events-none absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.5)]"
            style={{ left: `${fx}%`, top: `${fy}%` }}
          />

          {/* Import (swap) / remove — stop the click so it doesn't set focus. */}
          <div className="absolute right-2 top-2 z-20 flex gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={busy}
              aria-label={`Trocar ${label.toLowerCase()}`}
              title="Trocar foto"
              className={overlayBtn}
            >
              {busy ? <SpinnerIcon className={iconSm} /> : <SwapIcon />}
            </button>
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                aria-label={`Remover ${label.toLowerCase()}`}
                title="Remover foto"
                className={overlayBtn}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={busy ? "Enviando" : `Enviar ${label.toLowerCase()}`}
          title={busy ? "Enviando…" : `Enviar ${label.toLowerCase()}`}
          className={`flex ${ratioClass} w-full items-center justify-center rounded-lg border-2 border-dashed border-[#ccc] bg-[#fbfbfa] text-[#999] transition-colors hover:border-terracotta hover:text-terracotta`}
        >
          {busy ? <SpinnerIcon /> : <UploadIcon />}
        </button>
      )}

      <p className="mt-1 text-[11px] text-adm-muted">
        {hasPreview
          ? `Toque/clique para enquadrar (${fx}% · ${fy}%).`
          : hint || "Toque para enviar a foto."}
      </p>
      {hint && hasPreview && (
        <p className="text-[11px] text-adm-muted">{hint}</p>
      )}
      {error && <div className="mt-1 text-[12px] text-[#c0392b]">{error}</div>}
    </div>
  );
}
