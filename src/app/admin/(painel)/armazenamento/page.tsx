"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import {
  cleanupUnusedMedia,
  deleteMedia,
  extractMediaKey,
  fetchMediaList,
  formatBytes,
  isVideoKey,
  type MediaItem,
} from "@/lib/media";
import { useContent } from "@/lib/content/store";
import type { CropCommitMode, CropCommitResult } from "@/components/admin/MediaCropEditor";
import {
  AdmLoading,
  Card,
  GhostButton,
  PageHeader,
  PrimaryButton,
} from "@/components/admin/ui";
import { ImagesIcon, SpinnerIcon, TrashIcon, UploadIcon } from "@/components/admin/mediaIcons";
import MediaDetail from "@/components/admin/MediaDetail";

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
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Store do conteúdo (para reescrever as referências ao SUBSTITUIR uma imagem).
  const { stored, restore } = useContent();

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

  /**
   * Grava um recorte: **nova** imagem (só sobe) OU **substitui a atual** — sobe a
   * nova, reescreve TODAS as referências no conteúdo (`oldKey` → nova key, pelo
   * store, mantendo backend + ADM em sincronia) e apaga a antiga. Assim a imagem
   * troca em todo o site **sem perder os vínculos** e sem cache velho (key nova).
   */
  const commitCrop = useCallback(
    async (file: File, mode: CropCommitMode, oldKey: string): Promise<CropCommitResult> => {
      setError(null);
      const up = await uploadMedia(file); // sempre KV (biblioteca) → /api/media/<key>
      if (up.code === "not_configured") return { ok: false, error: "Edição disponível apenas no site publicado." };
      if (!up.url) return { ok: false, error: up.error ?? "Não foi possível salvar o recorte." };

      if (mode === "new") {
        setNotice("Recorte salvo como nova imagem no armazenamento.");
        await refresh();
        return { ok: true };
      }

      // Substituir: reescreve as referências (substring da key, que é única) e apaga a antiga.
      const newKey = extractMediaKey(up.url);
      if (newKey && oldKey && newKey !== oldKey) {
        const raw = JSON.stringify(stored);
        const count = raw.split(oldKey).length - 1;
        if (count > 0) {
          const rewritten = JSON.parse(raw.split(oldKey).join(newKey));
          const okSave = await restore(rewritten, "Substituição de imagem (recorte)");
          if (!okSave) return { ok: false, error: "Não foi possível atualizar as referências." };
        }
        await deleteMedia(oldKey);
        setNotice(
          count > 0
            ? `Imagem substituída — ${count} ${count === 1 ? "referência atualizada" : "referências atualizadas"}.`
            : "Imagem substituída.",
        );
      } else {
        setNotice("Imagem substituída (nova cópia salva).");
      }
      await refresh();
      return { ok: true };
    },
    [stored, restore, refresh],
  );

  const used = items.filter((it) => usedKeys.has(it.key));
  const unused = items.filter((it) => !usedKeys.has(it.key));
  const totalBytes = items.reduce((s, it) => s + (it.size ?? 0), 0);

  // Detalhamento por TIPO de arquivo (extensão): quantos + quanto ocupam.
  const byType = (() => {
    const m = new Map<string, { count: number; bytes: number }>();
    for (const it of items) {
      const ext = (it.key.split(".").pop() || "?").toLowerCase();
      const cur = m.get(ext) ?? { count: 0, bytes: 0 };
      cur.count += 1;
      cur.bytes += it.size ?? 0;
      m.set(ext, cur);
    }
    return [...m.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  })();

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
    setError(null);
    const r = await deleteMedia(it.key);
    setBusy(false);
    if (r.ok) {
      setItems((xs) => xs.filter((x) => x.key !== it.key));
      setNotice("Arquivo excluído.");
    } else {
      setError(r.error ?? "Não foi possível excluir.");
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
    setError(null);
    const r = await cleanupUnusedMedia();
    setBusy(false);
    if (r.ok) {
      setNotice(
        r.deleted.length > 0
          ? `${r.deleted.length} ${r.deleted.length === 1 ? "arquivo removido" : "arquivos removidos"}.`
          : "Nada para remover.",
      );
    } else {
      // Pode ter removido alguns antes de travar (ex.: cota) — mostra o parcial + o motivo.
      setError(
        (r.deleted.length > 0 ? `${r.deleted.length} removido(s). ` : "") +
          (r.error ?? "Não foi possível limpar."),
      );
    }
    refresh(); // reflete o que foi removido (mesmo parcial)
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
          Todos os arquivos enviados ao sistema (imagens e vídeos) ficam aqui, com o espaço total
          usado e a divisão por tipo. Ao enviar imagem, o sistema{" "}
          <strong>compacta e converte para .webp</strong> automaticamente. Em qualquer campo de
          imagem do painel você pode <strong>escolher uma daqui</strong> em vez de enviar de novo.
        </p>

        {/* Resumo: total de arquivos, em uso, não usados e ESPAÇO TOTAL usado. */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Arquivos", value: String(items.length) },
            { label: "Em uso", value: String(used.length) },
            { label: "Não usados", value: String(unused.length) },
            { label: "Espaço total", value: formatBytes(totalBytes) },
          ].map((s) => (
            <Card key={s.label} className="py-3">
              <div className="text-[22px] font-bold text-adm-ink">{s.value}</div>
              <div className="text-[12px] text-adm-muted">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Tipos de arquivo que ocupam o armazenamento (extensão · qtd · tamanho). */}
        {byType.length > 0 && (
          <Card className="mb-4 py-3">
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-adm-muted">
              Tipos de arquivo
            </div>
            <div className="flex flex-wrap gap-2">
              {byType.map(([ext, s]) => (
                <span
                  key={ext}
                  className="inline-flex items-center gap-1.5 rounded-full border border-adm-border bg-[#faf9f7] px-3 py-1 text-[12px]"
                  title={`${s.count} arquivo(s) .${ext} · ${formatBytes(s.bytes)}`}
                >
                  <strong className="uppercase text-adm-ink">.{ext}</strong>
                  <span className="text-adm-muted">
                    {s.count} · {formatBytes(s.bytes)}
                  </span>
                </span>
              ))}
            </div>
          </Card>
        )}

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
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(it)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(it); } }}
                  aria-label={`Ver detalhes de ${it.key}`}
                  className="group cursor-pointer overflow-hidden rounded-lg border border-adm-border bg-[#faf9f7] transition-colors hover:border-terracotta focus:border-terracotta focus:outline-none"
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
                    {/* Excluir individual — SEMPRE visível (funciona no toque; não
                        depende de hover). Confirma antes de apagar. */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(it); }}
                      disabled={busy}
                      aria-label="Excluir arquivo"
                      title="Excluir arquivo"
                      className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-md bg-black/70 text-white transition-colors hover:bg-[#c0392b] disabled:opacity-60"
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

      {selected && (
        <MediaDetail
          item={selected}
          inUse={usedKeys.has(selected.key)}
          onClose={() => setSelected(null)}
          onDeleted={(key) => {
            setItems((xs) => xs.filter((x) => x.key !== key));
            setSelected(null);
            setNotice("Arquivo excluído.");
          }}
          onCommit={commitCrop}
        />
      )}
    </>
  );
}
