"use client";

import { useRef, useState } from "react";

/* Inline icons (no text labels on the controls). */
const svg = "h-[18px] w-[18px]";
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
function UploadIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className={svg} {...stroke} aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className={svg} {...stroke} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
function SpinnerIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} {...stroke} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.2-8.5" />
    </svg>
  );
}

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

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      // Cloudinary path (unsigned, direct from the browser) when configured.
      if (cloudinary?.cloudName && cloudinary?.uploadPreset) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", cloudinary.uploadPreset);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${video ? "video" : "image"}/upload`,
          { method: "POST", body: fd },
        );
        const data = (await res.json()) as {
          secure_url?: string;
          error?: { message?: string };
        };
        if (data.secure_url) {
          onChange(data.secure_url);
        } else {
          setError(data.error?.message ?? "Falha no upload (Cloudinary).");
        }
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; url?: string; code?: string; error?: string };
      if (data.code === "not_configured") {
        setError("Upload disponível apenas no site publicado.");
        return;
      }
      if (!data.ok || !data.url) {
        setError(data.error ?? "Falha no upload.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Falha de conexão no upload.");
    } finally {
      setBusy(false);
    }
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
