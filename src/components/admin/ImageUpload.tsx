"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import MediaPicker from "./MediaPicker";
import {
  ImagesIcon,
  SpinnerIcon,
  SwapIcon,
  TrashIcon,
  UploadIcon,
  iconSm as svg,
} from "./mediaIcons";

/** Proporção da caixa — reflete o lugar real onde a imagem aparece.
 *  `"auto"` faz a caixa assumir a proporção REAL da foto enviada (sem corte). */
export type ImageAspect = "square" | "video" | "wide" | "portrait" | "og" | "auto";

/** Proporções nomeadas (as com medida fixa). `"auto"` não entra aqui: sua caixa
 *  se molda à imagem, então não tem classe de aspecto própria. */
const ASPECT_CLASS: Record<Exclude<ImageAspect, "auto">, string> = {
  square: "aspect-square", // logo de parceiro, favicon, foto de pessoa, item do kit
  video: "aspect-video", // 16:9 — imagem genérica, mapa do percurso, A Causa
  wide: "aspect-[16/6]", // logo horizontal do cabeçalho
  portrait: "aspect-[3/4]", // retrato vertical
  og: "aspect-[1200/630]", // capa de compartilhamento (Open Graph)
};

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  /** Proporção da caixa (reflete o local real). Default: "video" (16:9).
   *  Use `"auto"` para a caixa se moldar à proporção real da foto (sem corte). */
  aspect?: ImageAspect;
  /** Proporção CSS explícita (ex.: `"16/9"`, `"3/4"`) — tem prioridade sobre
   *  `aspect`. Serve para o preview espelhar EXATAMENTE a proporção escolhida no
   *  editor (ex.: o seletor "Proporção" do bloco de imagem). Vazio → usa `aspect`. */
  ratio?: string;
  /** Estilo extra da caixa (ex.: `bg-...`, `max-w-...`). A proporção vem de `aspect`. */
  className?: string;
  label?: string;
  /** When true, accepts a video (mp4/webm/mov) and previews it. */
  video?: boolean;
  /** How the preview fits its box: "cover" (default) or "contain" (logos, no crop). */
  fit?: "cover" | "contain";
  /** When set, uploads go to Cloudinary (unsigned) instead of /api/media. */
  cloudinary?: { cloudName?: string; uploadPreset?: string };
  /** "Escolher do armazenamento" como botão SOBRE a imagem (padrão). Desligue
   *  (`false`) só em caixas minúsculas onde os 3 ícones não caibam — aí o link
   *  aparece abaixo. */
  pickerOverlay?: boolean;
}

/**
 * Campo de imagem do ADM: envia para /api/media (KV) e devolve a URL. A caixa tem
 * **proporção configurável** (`aspect`) refletindo o local real, e os controles
 * ficam **sobre a imagem** (escolher do armazenamento + trocar + remover). Em dev
 * sem binding, a API responde not_configured e mostramos um aviso amigável.
 */
export default function ImageUpload({
  value,
  onChange,
  aspect = "video",
  ratio,
  className = "",
  label = "Imagem",
  video = false,
  fit = "cover",
  cloudinary,
  pickerOverlay = true,
}: ImageUploadProps) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  // Proporção efetiva:
  // - `ratio` explícito vence tudo (aplicado por style — espelha o seletor do editor);
  // - `auto` faz a caixa se moldar à foto (imagem: altura vem da própria; vídeo cai p/ 16:9);
  // - nomeadas usam a classe fixa correspondente.
  const usingRatio = !!ratio?.trim();
  const isAuto = !usingRatio && aspect === "auto";
  const namedClass = usingRatio || aspect === "auto" ? "" : ASPECT_CLASS[aspect];
  const ratioStyle = usingRatio ? { aspectRatio: ratio } : undefined;
  // Imagem "auto" com foto: a caixa não tem altura fixa (a foto a define, sem corte).
  const autoImage = isAuto && !video;
  // Caixa cheia: sem classe quando é imagem auto; vídeo auto cai p/ 16:9.
  const filledAspect = autoImage ? "" : isAuto ? ASPECT_CLASS.video : namedClass;
  // Dropzone (sem foto) sempre precisa de altura-alvo → auto usa 16:9.
  const emptyAspect = isAuto ? ASPECT_CLASS.video : namedClass;
  const boxClass = `w-full ${emptyAspect} ${className}`;
  const overlayBtn =
    "grid h-8 w-8 place-items-center rounded-md bg-black/60 text-white hover:bg-black/80 disabled:opacity-60";
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleFile(rawFile: File) {
    setError(null);
    setBusy(true);
    const r = await uploadMedia(rawFile, { video, cloudinary });
    if (r.code === "not_configured") {
      setError("Upload disponível apenas no site publicado.");
    } else if (r.url) {
      onChange(r.url);
    } else {
      setError(r.error ?? "Falha no upload.");
    }
    setBusy(false);
  }

  const pickerBtn = (stop = false) => (
    <button
      type="button"
      onClick={(e) => {
        if (stop) e.stopPropagation();
        setPickerOpen(true);
      }}
      disabled={busy}
      aria-label="Escolher do armazenamento"
      title="Escolher do armazenamento"
      className={overlayBtn}
    >
      <ImagesIcon />
    </button>
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={video ? "video/mp4,video/webm,video/quicktime" : "image/*"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div
          className={`relative overflow-hidden rounded-lg border border-adm-border w-full ${filledAspect} ${className}`}
          style={ratioStyle}
        >
          {video ? (
            <video
              src={value}
              className={`h-full w-full bg-black ${fitClass}`}
              muted
              playsInline
              controls
            />
          ) : autoImage ? (
            // Proporção real da foto: largura total, altura automática, sem corte.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="block h-auto w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className={`h-full w-full ${fitClass}`} />
          )}
          {/* Controles SOBRE a imagem: escolher do armazenamento + trocar + remover. */}
          <div className="absolute right-1.5 top-1.5 flex gap-1.5">
            {pickerOverlay && pickerBtn()}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              aria-label={`Trocar ${label.toLowerCase()}`}
              title="Trocar (enviar do computador)"
              className={overlayBtn}
            >
              {busy ? <SpinnerIcon className={svg} /> : <SwapIcon />}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Remover ${label.toLowerCase()}`}
              title="Remover"
              className={overlayBtn}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className={`relative ${boxClass}`} style={ratioStyle}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label={busy ? "Enviando" : `Enviar ${label.toLowerCase()}`}
            title={busy ? "Enviando…" : `Enviar ${label.toLowerCase()}`}
            className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-[#ccc] bg-[#fbfbfa] text-[#999] transition-colors hover:border-terracotta hover:text-terracotta"
          >
            {busy ? <SpinnerIcon /> : <UploadIcon />}
          </button>
          {pickerOverlay && (
            <div className="absolute right-1.5 top-1.5">{pickerBtn(true)}</div>
          )}
        </div>
      )}

      {/* Fallback: só quando o overlay está desligado (caixas minúsculas). */}
      {!pickerOverlay && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={busy}
          className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-[12px] font-medium text-terracotta hover:underline disabled:opacity-60"
        >
          <ImagesIcon className="h-4 w-4" />
          Escolher do armazenamento
        </button>
      )}

      {error && <div className="mt-1.5 text-[12px] text-[#c0392b]">{error}</div>}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => onChange(url)}
        kind={video ? "video" : "image"}
      />
    </div>
  );
}
