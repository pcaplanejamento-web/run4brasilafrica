"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import {
  cleanupUnusedMedia,
  deleteMedia,
  fetchMediaList,
  formatBytes,
  isVideoKey,
  type MediaItem,
} from "@/lib/media";
import {
  AdmLoading,
  Card,
  GhostButton,
  PageHeader,
  PrimaryButton,
} from "@/components/admin/ui";
import { ImagesIcon, SpinnerIcon, TrashIcon, UploadIcon } from "@/components/admin/mediaIcons";

/**
 * Armazenamento — biblioteca central de mídia do sistema (Cloudflare KV, servida
 * em `/api/media/<key>`). Lista tudo que foi enviado, mostra tamanho e se está em
 * uso (referenciado em qualquer edição), permite enviar novas (compactadas p/
 * WebP), excluir individuais e **limpar as não usadas** de uma vez. 100% ADM.
 */
export default function ArmazenamentoPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await fetchMediaList();
    if (r.code === "not_configured") {
      setError("Armazenamento disponível apenas no site publicado.");
    } else if (!r.ok) {
      setError("Não foi possível carregar o armazenamento.");
    } else {
      setError(null);
    }
    setItems(r.items);
    setUsedKeys(new Set(r.usedKeys));
    setLoading(false);
  }, []);

  useEffect(() => {
    // Carga inicial: refresh liga o spinner e busca a lista (setState assíncrono
    // após o fetch). O flush síncrono do `loading` é intencional aqui.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const used = items.filter((it) => usedKeys.has(it.key));
  const unused = items.filter((it) => !usedKeys.has(it.key));
  const totalBytes = items.reduce((s, it) => s + (it.size ?? 0), 0);

  async function handleUpload(file: File) {
    setBusy(true);
    setNotice(null);
    const r = await uploadMedia(file, { video: file.type.startsWith("video/") });
    setBusy(false);
    if (r.code === "not_configured") {
      setError("Envio disponível apenas no site publicado.");
    } else if (r.url) {
      setNotice("Imagem enviada.");
      refresh();
    } else {
      setError(r.error ?? "Falha no envio.");
    }
  }

  async function handleDelete(it: MediaItem) {
    const inUse = usedKeys.has(it.key);
    const msg = inUse
      ? "Esta imagem ESTÁ EM USO no site. Excluir mesmo assim? Ela sumirá de onde estiver."
      : "Excluir esta imagem do armazenamento? Esta ação não pode ser desfeita.";
    if (!window.confirm(msg)) return;
    setBusy(true);
    const ok = await deleteMedia(it.key);
    setBusy(false);
    if (ok) {
      setItems((xs) => xs.filter((x) => x.key !== it.key));
      setNotice("Imagem excluída.");
    } else {
      setError("Não foi possível excluir.");
    }
  }

  async function handleCleanup() {
    if (unused.length === 0) return;
    if (
      !window.confirm(
        `Limpar ${unused.length} ${unused.length === 1 ? "imagem não usada" : "imagens não usadas"}? ` +
          "Só remove o que NÃO está referenciado em nenhuma edição. Não pode ser desfeito.",
      )
    )
      return;
    setBusy(true);
    setNotice(null);
    const r = await cleanupUnusedMedia();
    setBusy(false);
    if (r.ok) {
      setNotice(
        r.deleted.length > 0
          ? `${r.deleted.length} ${r.deleted.length === 1 ? "imagem removida" : "imagens removidas"}.`
          : "Nada para remover.",
      );
      refresh();
    } else {
      setError(r.error ?? "Não foi possível limpar.");
    }
  }

  if (loading && items.length === 0) return <AdmLoading />;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = "";
        }}
      />

      <PageHeader
        title="Armazenamento"
        aside={
          <PrimaryButton onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Enviando…" : "+ Enviar imagem"}
          </PrimaryButton>
        }
      />

      <div className="max-w-[960px]">
        <p className="-mt-2 mb-4 text-[13px] text-adm-muted">
          Todas as imagens enviadas ao sistema ficam aqui. Ao enviar, o sistema{" "}
          <strong>compacta e converte para .webp</strong> automaticamente. Em qualquer campo de
          imagem do painel você pode <strong>escolher uma daqui</strong> em vez de enviar de novo.
        </p>

        {/* Resumo */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Arquivos", value: String(items.length) },
            { label: "Em uso", value: String(used.length) },
            { label: "Não usados", value: String(unused.length) },
            { label: "Espaço", value: formatBytes(totalBytes) },
          ].map((s) => (
            <Card key={s.label} className="py-3">
              <div className="text-[22px] font-bold text-adm-ink">{s.value}</div>
              <div className="text-[12px] text-adm-muted">{s.label}</div>
            </Card>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <GhostButton onClick={refresh} disabled={busy || loading} className="px-3 py-2">
            Atualizar
          </GhostButton>
          <GhostButton
            onClick={handleCleanup}
            disabled={busy || unused.length === 0}
            className="px-3 py-2 text-[#c0392b] disabled:text-adm-muted"
          >
            Limpar não usadas{unused.length > 0 ? ` (${unused.length})` : ""}
          </GhostButton>
          {notice && <span className="text-[13px] text-[#2f7a45]">{notice}</span>}
          {error && <span className="text-[13px] text-[#c0392b]">{error}</span>}
        </div>

        {items.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-10 text-center text-adm-muted">
              <ImagesIcon className="h-8 w-8" />
              <p className="text-[14px]">Nenhuma imagem no armazenamento ainda.</p>
              <PrimaryButton onClick={() => inputRef.current?.click()} disabled={busy}>
                <span className="inline-flex items-center gap-2">
                  <UploadIcon className="h-4 w-4" /> Enviar a primeira
                </span>
              </PrimaryButton>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((it) => {
              const inUse = usedKeys.has(it.key);
              return (
                <div
                  key={it.key}
                  className="group overflow-hidden rounded-lg border border-adm-border bg-[#faf9f7]"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#eee]">
                    {isVideoKey(it.key) ? (
                      <video src={it.url} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span
                      className="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
                      style={
                        inUse
                          ? { background: "rgba(47,122,69,0.92)", color: "#fff" }
                          : { background: "rgba(192,57,43,0.92)", color: "#fff" }
                      }
                    >
                      {inUse ? "Em uso" : "Não usado"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(it)}
                      disabled={busy}
                      aria-label="Excluir imagem"
                      title="Excluir"
                      className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 focus:opacity-100 group-hover:opacity-100 disabled:opacity-60 sm:h-8 sm:w-8"
                    >
                      {busy ? <SpinnerIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-[11px] text-adm-muted">
                    <span>{formatBytes(it.size)}</span>
                    <span className="uppercase">{it.key.split(".").pop()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
