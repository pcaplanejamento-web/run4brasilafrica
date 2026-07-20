"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import {
  SpinnerIcon,
  SwapIcon,
  TrashIcon,
  UploadIcon,
  iconSm as svg,
} from "./mediaIcons";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  /** Tailwind height/aspect classes for the preview box. */
  className?: string;
  label?: string;
  /** When true, accepts a video (mp4/webm/mov) and previews it. */
  video?: boolean;
  /** How the preview fits its box: "cover" (default) or "contain" (logos, no crop). */
  fit?: "cover" | "contain";
  /** When set, uploads go to Cloudinary (unsigned) instead of /api/media. */
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}

/**
 * Uploads an image to /api/media (Cloudflare KV) and reports the served URL.
 * Shows a preview + replace/remove controls. In local dev (no media binding)
 * the API returns not_configured and we surface a friendly note.
 */
export default function ImageUpload({
  value,
  onChange,
  className = "h-40",
  label = "Imagem",
  video = false,
  fit = "cover",
  cloudinary,
}: ImageUploadProps) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="relative overflow-hidden rounded-lg border border-adm-border">
          {video ? (
            <video
              src={value}
              className={`w-full bg-black ${fitClass} ${className}`}
              muted
              playsInline
              controls
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className={`w-full ${fitClass} ${className}`} />
          )}
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              aria-label={`Trocar ${label.toLowerCase()}`}
              title="Trocar"
              className="grid h-9 w-9 place-items-center rounded-md bg-black/60 text-white hover:bg-black/80 disabled:opacity-60"
            >
              {busy ? <SpinnerIcon className={svg} /> : <SwapIcon />}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Remover ${label.toLowerCase()}`}
              title="Remover"
              className="grid h-9 w-9 place-items-center rounded-md bg-black/60 text-white hover:bg-black/80"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={busy ? "Enviando" : `Enviar ${label.toLowerCase()}`}
          title={busy ? "Enviando…" : `Enviar ${label.toLowerCase()}`}
          className={`flex w-full items-center justify-center rounded-lg border-2 border-dashed border-[#ccc] bg-[#fbfbfa] text-[#999] transition-colors hover:border-terracotta hover:text-terracotta ${className}`}
        >
          {busy ? <SpinnerIcon /> : <UploadIcon />}
        </button>
      )}

      {error && <div className="mt-1.5 text-[12px] text-[#c0392b]">{error}</div>}
    </div>
  );
}
