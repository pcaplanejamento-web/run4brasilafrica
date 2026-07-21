"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContent } from "@/lib/content/store";
import type { CustomBlockType, CustomSection, LayoutItem } from "@/lib/content/types";
import {
  customIdFromKey,
  customKey,
  isCustomKey,
  resolveLayout,
  sectionMeta,
} from "@/lib/content/sections";
import { AdmLoading, Card, PageTitle, PrimaryButton } from "@/components/admin/ui";

const BLOCK_CHOICES: { type: CustomBlockType; label: string }[] = [
  { type: "subtitulo", label: "Subtítulo" },
  { type: "texto", label: "Texto" },
  { type: "imagem", label: "Imagem" },
  { type: "video", label: "Vídeo (YouTube)" },
  { type: "botao", label: "Botão" },
  { type: "carrossel", label: "Carrossel de imagens" },
  { type: "formulario", label: "Formulário (e-mail)" },
  { type: "secao", label: "Seção pronta (FAQ, Números…)" },
];

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

function ArrowBtn({
  dir,
  onClick,
  disabled,
}: {
  dir: "up" | "down";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "up" ? "Mover para cima" : "Mover para baixo"}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-adm-border text-adm-ink transition-colors hover:border-terracotta disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
        <path
          d={dir === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/** Reorder / enable-disable homepage sections; each label links to its config
 *  page. Custom "abas" appear here too, and can be created / deleted. */
function HomeLayoutCard({ initial }: { initial: LayoutItem[] }) {
  const { save, status, content } = useContent();
  const router = useRouter();
  const [layout, setLayout] = useState<LayoutItem[]>(initial);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [picked, setPicked] = useState<{ id: string; type: CustomBlockType }[]>([]);

  const customSections = content.customSections ?? [];
  const sectionTitle = (key: string) => {
    const id = customIdFromKey(key);
    const s = customSections.find((c) => c.id === id);
    return s?.title?.trim() || "Aba sem título";
  };

  const move = (i: number, dir: -1 | 1) =>
    setLayout((l) => {
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const next = [...l];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const toggle = (i: number) =>
    setLayout((l) => l.map((x, idx) => (idx === i ? { ...x, enabled: !x.enabled } : x)));

  const addPick = (t: CustomBlockType) =>
    setPicked((p) => [...p, { id: uid(), type: t }]);
  const removePick = (id: string) =>
    setPicked((p) => p.filter((x) => x.id !== id));
  const movePick = (i: number, dir: -1 | 1) =>
    setPicked((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function createAba() {
    const title = newTitle.trim();
    if (!title) return;
    const id = uid();
    const section: CustomSection = {
      id,
      title,
      blocks: picked.map((x) => ({ id: x.id, type: x.type })),
    };
    const nextLayout = [...layout, { key: customKey(id), enabled: true }];
    setLayout(nextLayout);
    await save(
      { customSections: [...customSections, section], layout: nextLayout },
      `Criou a aba "${title}"`,
    );
    setCreating(false);
    setNewTitle("");
    setPicked([]);
    router.push(`/admin/custom/${id}`);
  }

  async function deleteAba(key: string) {
    const id = customIdFromKey(key);
    if (!id) return;
    if (!confirm(`Excluir a aba "${sectionTitle(key)}"? Esta ação não pode ser desfeita.`)) return;
    const nextLayout = layout.filter((li) => li.key !== key);
    setLayout(nextLayout);
    await save(
      {
        customSections: customSections.filter((c) => c.id !== id),
        layout: nextLayout,
      },
      `Excluiu a aba "${sectionTitle(key)}"`,
    );
  }

  return (
    <Card>
      <div className="mb-1 text-[14px] font-bold">Componentes da tela inicial</div>
      <p className="mb-4 text-[12px] text-adm-muted">
        Ordene (setas), ative/desative e clique no nome para configurar cada seção.
      </p>

      <div className="flex flex-col gap-2">
        {layout.map((li, i) => {
          const custom = isCustomKey(li.key);
          const meta = sectionMeta(li.key);
          if (!custom && !meta) return null;
          const label = custom ? sectionTitle(li.key) : meta!.label;
          const href = custom ? `/admin/custom/${customIdFromKey(li.key)}` : meta!.href;
          return (
            <div
              key={li.key}
              className="flex items-center gap-2 rounded-lg border border-adm-border p-2.5"
              style={{ opacity: li.enabled ? 1 : 0.6 }}
            >
              <div className="flex gap-1">
                <ArrowBtn dir="up" onClick={() => move(i, -1)} disabled={i === 0} />
                <ArrowBtn
                  dir="down"
                  onClick={() => move(i, 1)}
                  disabled={i === layout.length - 1}
                />
              </div>
              <Link
                href={href}
                className="min-w-0 flex-1 truncate text-[13px] font-semibold text-adm-ink transition-colors hover:text-terracotta"
              >
                {label}
                {custom && (
                  <span className="ml-2 rounded-full bg-[#f0ece2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#a07c2f]">
                    Aba
                  </span>
                )}
              </Link>
              {custom && (
                <button
                  type="button"
                  onClick={() => deleteAba(li.key)}
                  aria-label={`Excluir ${label}`}
                  className="grid h-9 w-9 place-items-center rounded-md border border-adm-border text-adm-muted transition-colors hover:border-red-400 hover:text-red-500"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2m-9 0v14a1 1 0 001 1h8a1 1 0 001-1V6" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={li.enabled}
                className="min-h-9 rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors"
                style={{
                  background: li.enabled ? "#e7f5eb" : "#f0f0ee",
                  color: li.enabled ? "#2f7a45" : "#999",
                }}
              >
                {li.enabled ? "Ativo" : "Oculto"}
              </button>
            </div>
          );
        })}
      </div>

      {creating ? (
        <div className="mt-4 rounded-lg border border-dashed border-adm-border p-3.5">
          <div className="mb-2 text-[13px] font-bold text-adm-ink">Nova aba</div>
          <label className="mb-1 block text-[12px] font-semibold text-adm-muted">
            Título da aba
          </label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex.: Programação"
            className="mb-3 w-full rounded-md border border-adm-border bg-white px-3 py-2 text-[14px] text-adm-ink outline-none focus:border-terracotta"
          />
          <div className="mb-1 text-[12px] font-semibold text-adm-muted">
            Componentes desta aba (opcional — clique para adicionar; pode reordenar abaixo)
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {BLOCK_CHOICES.map((c) => (
              <button
                key={c.type}
                type="button"
                onClick={() => addPick(c.type)}
                className="rounded-full border border-adm-border px-3 py-1.5 text-[12px] font-semibold text-[#666] transition-colors hover:border-terracotta hover:text-terracotta"
              >
                + {c.label}
              </button>
            ))}
          </div>

          {picked.length > 0 && (
            <ol className="mb-3 flex flex-col gap-1.5">
              {picked.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-md border border-adm-border bg-white px-2 py-1.5"
                >
                  <span className="w-5 text-center text-[12px] font-bold text-adm-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-adm-ink">
                    {BLOCK_CHOICES.find((c) => c.type === p.type)?.label ?? p.type}
                  </span>
                  <ArrowBtn dir="up" onClick={() => movePick(i, -1)} disabled={i === 0} />
                  <ArrowBtn
                    dir="down"
                    onClick={() => movePick(i, 1)}
                    disabled={i === picked.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => removePick(p.id)}
                    aria-label="Remover componente"
                    className="grid h-9 w-9 place-items-center rounded-md border border-adm-border text-adm-muted transition-colors hover:border-red-400 hover:text-red-500"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewTitle("");
                setPicked([]);
              }}
              className="min-h-9 rounded-md px-4 text-[13px] font-semibold text-adm-muted hover:text-adm-ink"
            >
              Cancelar
            </button>
            <PrimaryButton onClick={createAba} disabled={!newTitle.trim() || status === "saving"}>
              {status === "saving" ? "Criando..." : "Criar aba"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="min-h-9 rounded-md border border-dashed border-adm-border px-4 text-[13px] font-semibold text-adm-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            + Criar aba
          </button>
          <PrimaryButton
            onClick={() => save({ layout }, "Reordenou/ativou componentes da tela inicial")}
            disabled={status === "saving"}
          >
            {status === "saving" ? "Salvando..." : "Salvar ordem"}
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { content, hydrated } = useContent();

  if (!hydrated) return <AdmLoading />;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Visão geral</PageTitle>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-[#777]">
            Edição ativa: {content.event.brandName} {content.event.editionYear}
          </span>
          <span className="inline-block h-[34px] w-[34px] rounded-full bg-[#ccc]" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: `Inscritos (${content.event.editionYear})`, value: content.metrics.registered },
          { label: "Vagas restantes", value: content.metrics.spotsLeft },
          { label: "Fotos na galeria", value: String((content.galleryPhotos ?? []).length) },
          { label: "Patrocinadores", value: String(content.sponsors.length) },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-[10px] border border-adm-border bg-adm-card p-5"
          >
            <div className="text-[13px] text-adm-muted">{k.label}</div>
            <div className="mt-1.5 font-display text-[26px] font-bold text-terracotta md:text-[30px]">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <HomeLayoutCard
          initial={resolveLayout(
            content.layout,
            (content.customSections ?? []).map((s) => s.id),
          )}
        />

        <Card>
          <div className="mb-4 text-[14px] font-bold">Últimas alterações</div>
          {content.log.slice(0, 4).map((l, i) => (
            <div
              key={i}
              className="border-b border-adm-line py-2.5 text-[13px] last:border-0"
            >
              <div className="text-adm-ink">{l.action}</div>
              <div className="mt-0.5 text-[#999]">
                {l.time} · {l.user}
              </div>
            </div>
          ))}
          <Link
            href="/admin/log"
            className="mt-3.5 inline-block text-[12px] font-semibold text-terracotta"
          >
            Ver log completo →
          </Link>
        </Card>
      </div>
    </>
  );
}
