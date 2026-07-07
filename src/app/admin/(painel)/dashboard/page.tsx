"use client";

import { useState } from "react";
import Link from "next/link";
import { useContent } from "@/lib/content/store";
import type { LayoutItem } from "@/lib/content/types";
import { resolveLayout, sectionMeta } from "@/lib/content/sections";
import { AdmLoading, Card, PageTitle, PrimaryButton } from "@/components/admin/ui";

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

/** Reorder / enable-disable homepage sections; each label links to its config page. */
function HomeLayoutCard({ initial }: { initial: LayoutItem[] }) {
  const { save, status } = useContent();
  const [layout, setLayout] = useState<LayoutItem[]>(initial);

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

  return (
    <Card>
      <div className="mb-1 text-[14px] font-bold">Componentes da tela inicial</div>
      <p className="mb-4 text-[12px] text-adm-muted">
        Ordene (setas), ative/desative e clique no nome para configurar cada seção.
      </p>

      <div className="flex flex-col gap-2">
        {layout.map((li, i) => {
          const meta = sectionMeta(li.key);
          if (!meta) return null;
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
                href={meta.href}
                className="min-w-0 flex-1 truncate text-[13px] font-semibold text-adm-ink transition-colors hover:text-terracotta"
              >
                {meta.label}
              </Link>
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

      <div className="mt-4 flex justify-end">
        <PrimaryButton
          onClick={() => save({ layout }, "Reordenou/ativou componentes da tela inicial")}
          disabled={status === "saving"}
        >
          {status === "saving" ? "Salvando..." : "Salvar ordem"}
        </PrimaryButton>
      </div>
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
        <HomeLayoutCard initial={resolveLayout(content.layout)} />

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
