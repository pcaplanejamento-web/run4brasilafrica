"use client";

import { useEffect, useState } from "react";
import { deleteMedia, formatBytes, isImageKey, isVideoKey, type MediaItem } from "@/lib/media";
import { SpinnerIcon, TrashIcon } from "./mediaIcons";
import MediaCropEditor from "./MediaCropEditor";

/** Só imagens rasterizadas (não SVG/GIF/vídeo) podem ser recortadas. */
function isEditable(key: string): boolean {
  return isImageKey(key) && /\.(png|jpe?g|webp)$/i.test(key);
}

/** Fundo xadrez (deixa a transparência do PNG visível no preview). */
const CHECKER: React.CSSProperties = {
  backgroundColor: "#fff",
  backgroundImage:
    "linear-gradient(45deg,#e2e2dc 25%,transparent 25%,transparent 75%,#e2e2dc 75%)," +
    "linear-gradient(45deg,#e2e2dc 25%,transparent 25%,transparent 75%,#e2e2dc 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0,10px 10px",
};

function absUrl(url: string): string {
  if (typeof window === "undefined" || /^https?:\/\//i.test(url)) return url;
  return window.location.origin + url;
}

/**
 * **Banner de detalhe** de um arquivo do Armazenamento (modal): mostra TODOS os
 * dados (arquivo, tipo, tamanho, dimensões, envio, situação, endereço) e permite
 * **editar a imagem** (recorte que preserva transparência — `MediaCropEditor`) ou
 * **excluir**. 100% ADM, responsivo/touch. Não sobrescreve nada: o recorte vira
 * uma nova imagem no armazenamento.
 */
export default function MediaDetail({
  item,
  inUse,
  onClose,
  onDeleted,
  onSavedNew,
}: {
  item: MediaItem;
  inUse: boolean;
  onClose: () => void;
  onDeleted: (key: string) => void;
  onSavedNew: (url: string) => void;
}) {
  const [dims, setDims] = useState<{ url: string; w: number; h: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const video = isVideoKey(item.key);
  const editable = isEditable(item.key);
  const ext = (item.key.split(".").pop() || "").toUpperCase();

  // Fecha no Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Dimensões reais (não ficam no metadata — medimos carregando o arquivo). A url
  // fica guardada junto p/ ignorar medição de um item anterior (sem setState no corpo).
  useEffect(() => {
    if (video) return;
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) setDims({ url: item.url, w: img.naturalWidth, h: img.naturalHeight }); };
    img.src = item.url;
    return () => { alive = false; };
  }, [item.url, video]);
  const shownDims = dims && dims.url === item.url ? dims : null;

  async function handleDelete() {
    const msg = inUse
      ? "Esta imagem ESTÁ EM USO no site. Excluir mesmo assim? Ela sumirá de onde estiver."
      : "Excluir esta imagem do armazenamento? Esta ação não pode ser desfeita.";
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError(null);
    const r = await deleteMedia(item.key);
    setBusy(false);
    if (r.ok) onDeleted(item.key);
    else setError(r.error ?? "Não foi possível excluir.");
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(absUrl(item.url));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Arquivo", value: <span className="break-all font-mono text-[12px]">{item.key}</span> },
    { label: "Tipo", value: item.contentType || (ext ? `imagem/${ext.toLowerCase()}` : "—") },
    { label: "Tamanho", value: formatBytes(item.size) },
    { label: "Dimensões", value: video ? "—" : shownDims ? `${shownDims.w} × ${shownDims.h} px` : "medindo…" },
    { label: "Enviado em", value: item.uploadedAt ? new Date(item.uploadedAt).toLocaleString("pt-BR") : "—" },
    {
      label: "Situação",
      value: (
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
          style={{ background: inUse ? "#2f7a45" : "#c0392b" }}
        >
          {inUse ? "Em uso" : "Não usada"}
        </span>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${item.key}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-[900px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-adm-border px-4 py-3 sm:px-5">
          <h2 className="text-[15px] font-bold text-adm-ink">
            {editing ? "Editar imagem" : "Detalhes do arquivo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[22px] leading-none text-adm-muted hover:bg-[#f2f0ed]"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {editing ? (
            <MediaCropEditor
              url={item.url}
              onCancel={() => setEditing(false)}
              onSaved={(newUrl) => { setEditing(false); onSavedNew(newUrl); }}
            />
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row">
              {/* Preview (xadrez atrás → transparência visível). */}
              <div className="sm:w-[46%]">
                <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg border border-adm-border" style={CHECKER}>
                  {video ? (
                    <video src={item.url} className="max-h-full max-w-full" controls playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
              </div>

              {/* Dados + ações. */}
              <div className="min-w-0 flex-1">
                <dl className="divide-y divide-adm-line rounded-lg border border-adm-border">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-4 px-3 py-2.5">
                      <dt className="shrink-0 text-[12px] uppercase tracking-[0.04em] text-adm-muted">{r.label}</dt>
                      <dd className="min-w-0 text-right text-[13px] text-adm-ink">{r.value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Endereço (URL) + copiar/abrir. */}
                <div className="mt-3">
                  <div className="mb-1 text-[12px] uppercase tracking-[0.04em] text-adm-muted">Endereço</div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={absUrl(item.url)}
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 rounded border border-[#ccc] bg-[#fbfbfa] px-2.5 py-2 font-mono text-[12px] text-adm-ink outline-none"
                    />
                    <button type="button" onClick={copyUrl} className="min-h-10 shrink-0 rounded border border-[#ccc] bg-white px-3 text-[12px] text-adm-ink transition-colors hover:border-terracotta hover:text-terracotta">
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="grid min-h-10 shrink-0 place-items-center rounded border border-[#ccc] bg-white px-3 text-[12px] text-adm-ink transition-colors hover:border-terracotta hover:text-terracotta">
                      Abrir
                    </a>
                  </div>
                </div>

                {error && (
                  <div className="mt-3 rounded-md border border-[#e0b4b0] bg-[#fdf2f1] px-3 py-2 text-[13px] text-[#c0392b]">{error}</div>
                )}

                {/* Ações principais. */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {editable ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="min-h-11 rounded-md bg-terracotta px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Editar imagem (recortar)
                    </button>
                  ) : (
                    <span className="self-center text-[12px] text-adm-muted">
                      {video ? "Vídeo não é editável aqui." : "Recorte disponível para .png/.jpg/.webp."}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#e0b4b0] bg-white px-4 text-[13px] font-semibold text-[#c0392b] transition-colors hover:bg-[#fdf2f1] disabled:opacity-60"
                  >
                    {busy ? <SpinnerIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
