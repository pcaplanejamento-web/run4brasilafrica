"use client";

import { useEffect, useRef, useState } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import { fetchMediaList, formatBytes, isVideoKey, type MediaItem } from "@/lib/media";
import { SpinnerIcon, UploadIcon } from "./mediaIcons";

/**
 * Reusable media library picker (modal). Lists everything already uploaded to the
 * system (Cloudflare KV, "Armazenamento") so the ADM can reuse a file, or upload
 * a new one from the computer (compressed to WebP first) — which then joins the
 * library. Shared by every image field (`ImageUpload`, `HeroImageField`).
 *
 * Responsivo/touch: grade fluida (2→5 colunas), alvos grandes, rola no corpo.
 */
export default function MediaPicker({
  open,
  onClose,
  onPick,
  onPickMany,
  multiple = false,
  kind = "image",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  /** When `multiple`, called with all selected URLs on confirm. */
  onPickMany?: (urls: string[]) => void;
  /** Allow selecting several items at once (adds a confirm bar). */
  multiple?: boolean;
  /** Which files to offer: images (default) or videos. */
  kind?: "image" | "video";
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (url: string) =>
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));

  const wantVideo = kind === "video";
  const visible = items.filter((it) => isVideoKey(it.key) === wantVideo);

  async function refresh() {
    setLoading(true);
    setError(null);
    const r = await fetchMediaList();
    if (r.code === "not_configured") {
      setError("Armazenamento disponível apenas no site publicado.");
    } else if (!r.ok) {
      setError("Não foi possível carregar o armazenamento.");
    }
    setItems(r.items);
    setLoading(false);
  }

  // Load when opened; close on Escape.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected([]);
    refresh();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function handleUpload(file: File) {
    setError(null);
    setBusy(true);
    // Library uploads always land in KV (so they show up here) → sem cloudinary.
    const r = await uploadMedia(file, { video: wantVideo });
    setBusy(false);
    if (r.code === "not_configured") {
      setError("Envio disponível apenas no site publicado.");
      return;
    }
    if (r.url) {
      if (multiple) {
        setSelected((s) => [...s, r.url as string]);
        refresh();
      } else {
        onPick(r.url);
        onClose();
      }
    } else {
      setError(r.error ?? "Falha no envio.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Armazenamento de imagens"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-adm-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-[15px] font-bold text-adm-ink">Armazenamento</h2>
            <p className="text-[12px] text-adm-muted">
              Escolha um{wantVideo ? " vídeo" : "a imagem"} já enviad{wantVideo ? "o" : "a"} ou
              envie {wantVideo ? "um novo" : "uma nova"} do computador.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[22px] leading-none text-adm-muted hover:bg-[#f2f0ed]"
          >
            ×
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-b border-adm-border px-4 py-2.5 sm:px-5">
          <input
            ref={inputRef}
            type="file"
            accept={wantVideo ? "video/mp4,video/webm,video/quicktime" : "image/*"}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-terracotta px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <SpinnerIcon className="h-4 w-4" /> : <UploadIcon />}
            {busy ? "Enviando…" : "Enviar do computador"}
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading || busy}
            className="ml-auto inline-flex min-h-11 items-center rounded-lg border border-adm-border px-3 text-[13px] text-adm-ink hover:border-terracotta disabled:opacity-60"
          >
            Atualizar
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded-md border border-[#e0b4b0] bg-[#fdf2f1] px-3 py-2 text-[13px] text-[#c0392b] sm:mx-5">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="grid place-items-center py-16 text-adm-muted">
              <SpinnerIcon className="h-7 w-7" />
            </div>
          ) : visible.length === 0 ? (
            <div className="grid place-items-center py-16 text-center text-[13px] text-adm-muted">
              Nenhum{wantVideo ? " vídeo" : "a imagem"} no armazenamento ainda.
              <br />
              Envie {wantVideo ? "um" : "uma"} do computador acima.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visible.map((it) => {
                const on = selected.includes(it.url);
                return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => {
                    if (multiple) {
                      toggle(it.url);
                    } else {
                      onPick(it.url);
                      onClose();
                    }
                  }}
                  aria-pressed={multiple ? on : undefined}
                  title={`${it.key} · ${formatBytes(it.size)}`}
                  className={`group relative overflow-hidden rounded-lg border bg-[#faf9f7] transition-colors focus:outline-none ${on ? "border-terracotta ring-2 ring-terracotta" : "border-adm-border hover:border-terracotta focus:border-terracotta"}`}
                >
                  {multiple && (
                    <span
                      className={`absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full text-[13px] font-bold ${on ? "bg-terracotta text-white" : "bg-white/80 text-transparent"}`}
                    >
                      ✓
                    </span>
                  )}
                  <div className="aspect-square w-full overflow-hidden bg-[#eee]">
                    {wantVideo ? (
                      <video src={it.url} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="truncate px-2 py-1.5 text-left text-[11px] text-adm-muted">
                    {formatBytes(it.size)}
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="flex items-center justify-between gap-3 border-t border-adm-border px-4 py-3 sm:px-5">
            <span className="text-[13px] text-adm-muted">
              {selected.length} selecionada{selected.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => {
                onPickMany?.(selected);
                onClose();
              }}
              className="inline-flex min-h-11 items-center rounded-lg bg-terracotta px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Adicionar {selected.length > 0 ? selected.length : ""} ao carrossel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
