"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Stat } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  TextInput,
} from "@/components/admin/ui";

function NumerosForm({ initial }: { initial: Stat[] }) {
  const { save } = useContent();
  const [stats, setStats] = useState<Stat[]>(initial);

  const set = (i: number, patch: Partial<Stat>) =>
    setStats((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setStats((xs) => {
      const j = i + dir;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setStats((xs) => xs.filter((_, idx) => idx !== i));
  const add = () => setStats((xs) => [...xs, { value: "", label: "" }]);

  return (
    <>
      <PageHeader
        title="Números em destaque"
        aside={<PrimaryButton onClick={add}>+ Novo número</PrimaryButton>}
      />
      <p className="mb-6 -mt-4 max-w-[640px] text-[12px] text-adm-muted">
        Os três (ou mais) blocos que aparecem sobre o banner na tela inicial. O número anima
        de 0 até o valor ao rolar a página.
      </p>

      <div className="flex max-w-[720px] flex-col gap-4">
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
          <div className="text-[13px] text-adm-muted">
            Nenhum número. Clique em &ldquo;+ Novo número&rdquo;.
          </div>
        )}
      </div>

      <div className="max-w-[720px]">
        <SaveBar onSave={() => save({ stats }, "Atualizou os números em destaque")} />
      </div>
    </>
  );
}

export default function NumerosPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <NumerosForm initial={content.stats ?? []} />;
}
