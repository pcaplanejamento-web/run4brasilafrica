"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  /** Tailwind height/aspect classes for the preview box. */
  className?: string;
  label?: string;
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
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
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
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-adm-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className={`w-full object-cover ${className}`} />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-black/75"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-black/75"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`flex w-full items-center justify-center rounded-lg border-2 border-dashed border-[#ccc] bg-[#fbfbfa] text-[13px] text-[#999] transition-colors hover:border-terracotta ${className}`}
        >
          {busy ? "Enviando..." : `+ Enviar ${label.toLowerCase()}`}
        </button>
      )}

      {error && <div className="mt-1.5 text-[12px] text-[#c0392b]">{error}</div>}
    </div>
  );
}
