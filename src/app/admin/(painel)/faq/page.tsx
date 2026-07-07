"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { FaqItem } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

function FaqForm({ initial }: { initial: FaqItem[] }) {
  const { save } = useContent();
  const [items, setItems] = useState<FaqItem[]>(initial);

  const set = (i: number, patch: Partial<FaqItem>) =>
    setItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((xs) => {
      const j = i + dir;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setItems((xs) => xs.filter((_, idx) => idx !== i));
  const add = () => setItems((xs) => [...xs, { q: "", a: "" }]);

  return (
    <>
      <PageHeader
        title="Perguntas frequentes"
        aside={<PrimaryButton onClick={add}>+ Nova pergunta</PrimaryButton>}
      />

      <div className="flex max-w-[860px] flex-col gap-4">
        {items.map((f, i) => (
          <Card key={i}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase text-adm-muted">
                Pergunta {i + 1}
              </span>
              <div className="flex gap-1.5">
                <GhostButton onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </GhostButton>
                <GhostButton onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                  ↓
                </GhostButton>
                <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
              </div>
            </div>
            <div className="mb-3">
              <FieldLabel>Pergunta</FieldLabel>
              <TextInput value={f.q} onChange={(e) => set(i, { q: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Resposta</FieldLabel>
              <TextArea rows={3} value={f.a} onChange={(e) => set(i, { a: e.target.value })} />
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-[13px] text-adm-muted">
            Nenhuma pergunta. Clique em &ldquo;+ Nova pergunta&rdquo;.
          </div>
        )}
      </div>

      <div className="max-w-[860px]">
        <SaveBar onSave={() => save({ faq: items }, "Atualizou as perguntas frequentes")} />
      </div>
    </>
  );
}

export default function FaqPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <FaqForm initial={content.faq ?? []} />;
}
