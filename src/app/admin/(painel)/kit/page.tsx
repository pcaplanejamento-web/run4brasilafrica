"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { KitItem, KitSection, Lote } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import { KIT_ICONS, KitIcon } from "@/components/site/KitIcons";

type Cloud = { cloudName?: string; uploadPreset?: string } | undefined;

function ItemsEditor({
  items,
  onChange,
  cloudinary,
}: {
  items: KitItem[];
  onChange: (items: KitItem[]) => void;
  cloudinary: Cloud;
}) {
  const set = (i: number, patch: Partial<KitItem>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { name: "" }]);

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-adm-border bg-[#fbfbfa] p-3">
          <div className="mb-3 flex items-end gap-3">
            <div className="flex-1">
              <FieldLabel>Nome do item</FieldLabel>
              <TextInput
                value={it.name}
                onChange={(e) => set(i, { name: e.target.value })}
                placeholder="ex.: Mochila, Óculos, Boné, Anorak, Garrafinha…"
              />
            </div>
            <div className="flex gap-1">
              <GhostButton onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </GhostButton>
              <GhostButton onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                ↓
              </GhostButton>
              <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
            </div>
          </div>

          <FieldLabel>Ícone (biblioteca)</FieldLabel>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {KIT_ICONS.map((ic) => (
              <button
                key={ic.key}
                type="button"
                title={ic.label}
                aria-pressed={it.icon === ic.key}
                onClick={() =>
                  set(i, { icon: it.icon === ic.key ? undefined : ic.key, image: undefined })
                }
                className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                  it.icon === ic.key
                    ? "border-terracotta bg-[#fbeee9] text-terracotta"
                    : "border-adm-border text-adm-ink hover:border-terracotta"
                }`}
              >
                <KitIcon name={ic.key} size={22} />
              </button>
            ))}
          </div>

          <details>
            <summary className="cursor-pointer text-[12px] text-adm-muted">
              Ou enviar uma imagem própria
            </summary>
            <div className="mt-2 w-[120px]">
              <ImageUpload
                value={it.image}
                onChange={(url) => set(i, { image: url, icon: undefined })}
                className="h-16"
                label="imagem"
                cloudinary={cloudinary}
              />
            </div>
          </details>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-block self-start rounded border border-dashed border-[#999] px-4 py-2 text-[13px] text-[#666] hover:border-terracotta hover:text-terracotta"
      >
        + Adicionar item
      </button>
    </div>
  );
}

function KitForm({
  initial,
  lotes,
  cloudinary,
}: {
  initial: KitSection;
  lotes: Lote[];
  cloudinary: Cloud;
}) {
  const { save } = useContent();
  const [kit, setKit] = useState<KitSection>(initial);
  const regText = kit.regulamentoMode === "text";
  const perLote = kit.kitMode === "perLote";

  const loteItems = (loteId: string) =>
    (kit.perLote ?? []).find((p) => p.loteId === loteId)?.items ?? [];
  const setLoteItems = (loteId: string, items: KitItem[]) => {
    const cur = kit.perLote ?? [];
    const next = cur.some((p) => p.loteId === loteId)
      ? cur.map((p) => (p.loteId === loteId ? { ...p, items } : p))
      : [...cur, { loteId, items }];
    setKit({ ...kit, perLote: next });
  };

  return (
    <>
      <div className="mb-7">
        <PageTitle>Kit do atleta</PageTitle>
      </div>

      <div className="flex max-w-[900px] flex-col gap-5">
        <Card>
          <SectionLabel>Textos</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Título</FieldLabel>
              <TextInput value={kit.title} onChange={(e) => setKit({ ...kit, title: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Subtítulo</FieldLabel>
              <TextInput
                value={kit.subtitle}
                onChange={(e) => setKit({ ...kit, subtitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Rótulo do botão do regulamento</FieldLabel>
              <TextInput
                value={kit.regulamentoLabel}
                onChange={(e) => setKit({ ...kit, regulamentoLabel: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <SectionLabel>Regulamento</SectionLabel>
          <div className="mb-3 max-w-[280px]">
            <FieldLabel>Como disponibilizar</FieldLabel>
            <Select
              value={kit.regulamentoMode ?? "link"}
              onChange={(e) =>
                setKit({ ...kit, regulamentoMode: e.target.value as "link" | "text" })
              }
            >
              <option value="link">Link para um arquivo</option>
              <option value="text">Texto do regulamento</option>
            </Select>
          </div>
          {regText ? (
            <div>
              <FieldLabel>Texto do regulamento</FieldLabel>
              <TextArea
                rows={6}
                value={kit.regulamentoText ?? ""}
                onChange={(e) => setKit({ ...kit, regulamentoText: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <FieldLabel>Link do arquivo (PDF, etc.)</FieldLabel>
              <TextInput
                value={kit.regulamentoUrl ?? ""}
                onChange={(e) => setKit({ ...kit, regulamentoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}
        </Card>

        <Card>
          <SectionLabel>Itens do kit</SectionLabel>
          <div className="mb-4 max-w-[320px]">
            <FieldLabel>Forma de cadastro</FieldLabel>
            <Select
              value={kit.kitMode ?? "single"}
              onChange={(e) =>
                setKit({ ...kit, kitMode: e.target.value as "single" | "perLote" })
              }
            >
              <option value="single">Kit único (mesmo para todos)</option>
              <option value="perLote">Kit diferente por lote</option>
            </Select>
          </div>

          {perLote ? (
            lotes.length === 0 ? (
              <div className="text-[13px] text-adm-muted">
                Cadastre os lotes em &ldquo;Links &amp; inscrição&rdquo; para definir o kit de
                cada um.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {lotes.map((l) => (
                  <div key={l.id}>
                    <div className="mb-2 text-[13px] font-bold text-adm-ink">{l.name}</div>
                    <ItemsEditor
                      items={loteItems(l.id)}
                      onChange={(items) => setLoteItems(l.id, items)}
                      cloudinary={cloudinary}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <ItemsEditor
              items={kit.items ?? []}
              onChange={(items) => setKit({ ...kit, items })}
              cloudinary={cloudinary}
            />
          )}
        </Card>
      </div>

      <div className="max-w-[900px]">
        <SaveBar onSave={() => save({ kit }, "Atualizou o kit do atleta")} />
      </div>
    </>
  );
}

export default function KitPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <KitForm
      initial={content.kit}
      lotes={content.lotes ?? []}
      cloudinary={content.cloudinary}
    />
  );
}
