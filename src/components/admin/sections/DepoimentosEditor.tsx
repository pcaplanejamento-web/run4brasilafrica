"use client";

import type { Testimonial } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

/**
 * Editor controlado dos depoimentos ("Quem já correu", `Testimonial[]`). Sem
 * store/save — reusado na página legada e dentro do editor de aba (bloco `secao`).
 */
export function DepoimentosEditor({
  value,
  onChange,
  cloudinary,
}: {
  value: Testimonial[];
  onChange: (next: Testimonial[]) => void;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}) {
  const items = value ?? [];
  const set = (i: number, patch: Partial<Testimonial>) =>
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { quote: "", name: "", role: "" }]);

  return (
    <div className="flex flex-col gap-4">
      {items.map((t, i) => (
        <Card key={i}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase text-adm-muted">
              Depoimento {i + 1}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
            <div>
              <FieldLabel>Foto (opcional)</FieldLabel>
              <ImageUpload
                value={t.photo}
                onChange={(url) => set(i, { photo: url })}
                className="h-32"
                label="foto"
                cloudinary={cloudinary}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Autor</FieldLabel>
                  <TextInput
                    value={t.name}
                    onChange={(e) => set(i, { name: e.target.value })}
                    placeholder="Nome de quem correu"
                  />
                </div>
                <div>
                  <FieldLabel>Legenda (quem é / edição)</FieldLabel>
                  <TextInput
                    value={t.role}
                    onChange={(e) => set(i, { role: e.target.value })}
                    placeholder="ex.: Participante 2025"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Depoimento</FieldLabel>
                <TextArea
                  rows={3}
                  value={t.quote}
                  onChange={(e) => set(i, { quote: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="text-[13px] text-adm-muted">Nenhum depoimento ainda.</div>
      )}
      <div>
        <PrimaryButton onClick={add}>+ Novo depoimento</PrimaryButton>
      </div>
    </div>
  );
}
