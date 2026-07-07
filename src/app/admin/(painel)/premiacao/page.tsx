"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { PodiumPlace, PremiacaoSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  PrimaryButton,
  SaveBar,
  SectionLabel,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

/** Default podium colors (ouro / prata / bronze) used when a position has none. */
const DEFAULT_HEX = ["#c8ce2e", "#c9ccd2", "#cd7f4d"];

function PremiacaoForm({ initial }: { initial: PremiacaoSection }) {
  const { save } = useContent();
  const [p, setP] = useState<PremiacaoSection>({
    ...initial,
    places: initial.places ?? [],
  });
  const places = p.places ?? [];

  const setPlace = (i: number, patch: Partial<PodiumPlace>) =>
    setP((prev) => ({
      ...prev,
      places: (prev.places ?? []).map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
    }));
  const add = () =>
    setP((prev) => ({
      ...prev,
      places: [
        ...(prev.places ?? []),
        { place: `${(prev.places ?? []).length + 1}º lugar`, prize: "" },
      ],
    }));
  const remove = (i: number) =>
    setP((prev) => ({ ...prev, places: (prev.places ?? []).filter((_, idx) => idx !== i) }));
  const move = (i: number, dir: -1 | 1) =>
    setP((prev) => {
      const list = [...(prev.places ?? [])];
      const j = i + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...prev, places: list };
    });

  return (
    <>
      <div className="mb-7">
        <PageTitle>Premiação</PageTitle>
      </div>

      <div className="flex max-w-[860px] flex-col gap-5">
        <Card>
          <SectionLabel>Seção</SectionLabel>
          <p className="mb-4 text-[12px] text-adm-muted">
            Para <strong>mostrar ou ocultar</strong> a Premiação no site, use o{" "}
            <strong>Dashboard</strong> &rarr; &ldquo;Componentes da tela inicial&rdquo;
            (ativar/ocultar e ordenar). Aqui você configura o conteúdo.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Chapéu (eyebrow)</FieldLabel>
              <TextInput
                value={p.eyebrow ?? ""}
                onChange={(e) => setP({ ...p, eyebrow: e.target.value })}
                placeholder="PREMIAÇÃO"
              />
            </div>
            <div>
              <FieldLabel>Título da seção</FieldLabel>
              <TextInput
                value={p.title ?? ""}
                onChange={(e) => setP({ ...p, title: e.target.value })}
                placeholder="Pódio"
              />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Texto de apoio (opcional)</FieldLabel>
            <TextArea
              rows={2}
              value={p.note ?? ""}
              onChange={(e) => setP({ ...p, note: e.target.value })}
              placeholder="ex.: Premiação para os 3 primeiros de cada categoria."
            />
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Pódio (premiação por posição)</SectionLabel>
            <PrimaryButton onClick={add} className="px-4 py-2 text-[13px]">
              + Posição
            </PrimaryButton>
          </div>
          <p className="mb-4 text-[12px] text-adm-muted">
            As <strong>3 primeiras</strong> posições viram o pódio (1º ao centro, mais alto).
            As demais aparecem como uma lista abaixo do pódio.
          </p>

          {places.length === 0 && (
            <div className="rounded-lg border border-dashed border-adm-border p-6 text-center text-[13px] text-adm-muted">
              Nenhuma posição ainda. Clique em &ldquo;+ Posição&rdquo;.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {places.map((place, i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-end gap-3 rounded-lg border border-adm-border p-3 sm:grid-cols-[150px_1fr_auto_auto]"
              >
                <div>
                  <FieldLabel>Posição</FieldLabel>
                  <TextInput
                    value={place.place}
                    onChange={(e) => setPlace(i, { place: e.target.value })}
                    placeholder={`${i + 1}º lugar`}
                  />
                </div>
                <div>
                  <FieldLabel>Premiação</FieldLabel>
                  <TextInput
                    value={place.prize}
                    onChange={(e) => setPlace(i, { prize: e.target.value })}
                    placeholder="ex.: R$ 500 + troféu + kit"
                  />
                </div>
                <div>
                  <FieldLabel>Cor do pódio</FieldLabel>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      aria-label={`Cor do pódio ${place.place || i + 1}`}
                      value={place.color || DEFAULT_HEX[i] || "#c8ce2e"}
                      onChange={(e) => setPlace(i, { color: e.target.value })}
                      className="h-9 w-10 cursor-pointer rounded border border-adm-border bg-transparent"
                    />
                    {place.color && (
                      <button
                        type="button"
                        onClick={() => setPlace(i, { color: "" })}
                        className="text-[11px] text-adm-muted underline"
                      >
                        Padrão
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <GhostButton onClick={() => move(i, -1)} className="px-3 py-2 text-[12px]">
                    ↑
                  </GhostButton>
                  <GhostButton onClick={() => move(i, 1)} className="px-3 py-2 text-[12px]">
                    ↓
                  </GhostButton>
                  <GhostButton onClick={() => remove(i)} className="px-3 py-2 text-[12px]">
                    ✕
                  </GhostButton>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Resultados completos (opcional)</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Texto do botão</FieldLabel>
              <TextInput
                value={p.resultsLabel ?? ""}
                onChange={(e) => setP({ ...p, resultsLabel: e.target.value })}
                placeholder="Ver resultados completos"
              />
            </div>
            <div>
              <FieldLabel>Link (cronometragem, planilha, etc.)</FieldLabel>
              <TextInput
                value={p.resultsUrl ?? ""}
                onChange={(e) => setP({ ...p, resultsUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-[860px]">
        <SaveBar onSave={() => save({ premiacao: p }, "Atualizou a premiação")} />
      </div>
    </>
  );
}

const DEFAULT_PREMIACAO: PremiacaoSection = {
  eyebrow: "PREMIAÇÃO",
  title: "Pódio",
  note: "",
  places: [
    { place: "1º lugar", prize: "" },
    { place: "2º lugar", prize: "" },
    { place: "3º lugar", prize: "" },
  ],
  resultsLabel: "Ver resultados completos",
  resultsUrl: "",
};

export default function PremiacaoPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <PremiacaoForm initial={content.premiacao ?? DEFAULT_PREMIACAO} />;
}
