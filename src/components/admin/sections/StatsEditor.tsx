"use client";

import type { Stat } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  TextInput,
} from "@/components/admin/ui";

/**
 * Editor controlado dos "Números em destaque" (`Stat[]`). Sem store/save —
 * reusado na página legada e dentro do editor de aba (bloco `secao`).
 */
export function StatsEditor({
  value,
  onChange,
}: {
  value: Stat[];
  onChange: (next: Stat[]) => void;
}) {
  const stats = value ?? [];
  const set = (i: number, patch: Partial<Stat>) =>
    onChange(stats.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= stats.length) return;
    const next = [...stats];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(stats.filter((_, idx) => idx !== i));
  const add = () => onChange([...stats, { value: "", label: "" }]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-adm-muted">
        Os blocos que aparecem sobre o banner. O número anima de 0 até o valor ao rolar.
      </p>
      {stats.map((s, i) => (
        <Card key={i}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase text-adm-muted">
              Destaque {i + 1}
            </span>
            <div className="flex gap-1.5">
              <GhostButton onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </GhostButton>
              <GhostButton onClick={() => move(i, 1)} disabled={i === stats.length - 1}>
                ↓
              </GhostButton>
              <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Número / valor</FieldLabel>
              <TextInput
                value={s.value}
                onChange={(e) => set(i, { value: e.target.value })}
                placeholder="ex.: 3.200+  ·  R$ 180 mil"
              />
            </div>
            <div>
              <FieldLabel>Legenda</FieldLabel>
              <TextInput
                value={s.label}
                onChange={(e) => set(i, { label: e.target.value })}
                placeholder="ex.: Corredores em 2025"
              />
            </div>
          </div>
        </Card>
      ))}
      {stats.length === 0 && (
        <div className="text-[13px] text-adm-muted">Nenhum número ainda.</div>
      )}
      <div>
        <PrimaryButton onClick={add}>+ Novo número</PrimaryButton>
      </div>
    </div>
  );
}
