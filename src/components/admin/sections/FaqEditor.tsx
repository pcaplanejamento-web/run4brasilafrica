"use client";

import type { FaqItem } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

/**
 * Editor controlado das Perguntas frequentes (`FaqItem[]`). Sem store/save —
 * reusado tanto na página legada quanto dentro do editor de aba (bloco `secao`).
 */
export function FaqEditor({
  value,
  onChange,
}: {
  value: FaqItem[];
  onChange: (next: FaqItem[]) => void;
}) {
  const items = value ?? [];
  const set = (i: number, patch: Partial<FaqItem>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { q: "", a: "" }]);

  return (
    <div className="flex flex-col gap-4">
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
          Nenhuma pergunta ainda.
        </div>
      )}
      <div>
        <PrimaryButton onClick={add}>+ Nova pergunta</PrimaryButton>
      </div>
    </div>
  );
}
