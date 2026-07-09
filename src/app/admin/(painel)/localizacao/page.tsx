"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { LocationSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  PageHeader,
  SaveBar,
  SectionLabel,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

function LocalizacaoForm({ initial }: { initial: LocationSection }) {
  const { save } = useContent();
  const [loc, setLoc] = useState<LocationSection>(initial);
  const set = (patch: Partial<LocationSection>) => setLoc((l) => ({ ...l, ...patch }));

  return (
    <>
      <PageHeader title="Localização" />

      <div className="flex max-w-[760px] flex-col gap-5">
        <Card>
          <SectionLabel>Seção &ldquo;Localização&rdquo; no site</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Preencha o endereço para aparecer o mapa e o botão &ldquo;Como chegar&rdquo;. A seção
            fica oculta enquanto não houver endereço nem nome do local.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Título</FieldLabel>
              <TextInput
                value={loc.title ?? ""}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Localização"
              />
            </div>
            <div>
              <FieldLabel>Nome do local</FieldLabel>
              <TextInput
                value={loc.venueName ?? ""}
                onChange={(e) => set({ venueName: e.target.value })}
                placeholder="Ex.: Parque Municipal de Rio Verde"
              />
            </div>
            <div>
              <FieldLabel>Endereço (gera o mapa e a rota)</FieldLabel>
              <TextInput
                value={loc.address ?? ""}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>
            <div>
              <FieldLabel>Chamada (opcional)</FieldLabel>
              <TextArea
                value={loc.note ?? ""}
                onChange={(e) => set({ note: e.target.value })}
                rows={2}
                placeholder="Onde a corrida acontece e como chegar."
              />
            </div>
            <div>
              <FieldLabel>Mapa (URL de incorporação do Google Maps)</FieldLabel>
              <TextInput
                value={loc.mapEmbedUrl ?? ""}
                onChange={(e) => set({ mapEmbedUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <div className="mt-1 text-[12px] text-adm-muted">
                No Google Maps: Compartilhar → Incorporar um mapa → copie apenas o endereço do{" "}
                <code>src=&quot;...&quot;</code>. Sem isso, mostramos o endereço + botão &ldquo;Como
                chegar&rdquo; (sem mapa).
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-[760px]">
        <SaveBar onSave={() => save({ location: loc }, "Atualizou a localização")} />
      </div>
    </>
  );
}

export default function LocalizacaoPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <LocalizacaoForm initial={content.location ?? {}} />;
}
