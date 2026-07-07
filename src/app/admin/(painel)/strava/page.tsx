"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Percurso } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  SaveBar,
  SectionLabel,
  TextInput,
} from "@/components/admin/ui";

function StravaForm({ initial }: { initial: Percurso }) {
  const { save } = useContent();
  const [p, setP] = useState(initial);

  function set<K extends keyof Percurso>(key: K, value: Percurso[K]) {
    setP({ ...p, [key]: value });
  }

  return (
    <>
      <div className="mb-7">
        <PageTitle>Configuração do percurso (Strava)</PageTitle>
      </div>

      <div className="flex max-w-[760px] flex-col gap-5">
        <Card>
          <SectionLabel>Título da seção</SectionLabel>
          <FieldLabel>Aparece como título grande do percurso no site</FieldLabel>
          <TextInput
            value={p.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="ex.: PURA ADRENALINA."
          />
        </Card>

        <Card>
          <FieldLabel>ID ou link da rota no Strava</FieldLabel>
          <div className="mb-1.5">
            <TextInput
              value={p.stravaRouteRef}
              onChange={(e) => set("stravaRouteRef", e.target.value)}
              placeholder="ex.: 3300000 ou strava.com/routes/3300000"
            />
          </div>
          <p className="mb-4 text-[12px] text-adm-muted">
            Cole o ID ou o link de uma rota <strong>pública</strong> do Strava. O mapa
            aparece no site automaticamente — não precisa de credenciais.
          </p>

          <div className="mb-4 flex items-center gap-2 text-[13px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.connected ? "#4a9d5f" : "#c0392b" }}
            />
            {p.connected
              ? "Conectado — token renovado automaticamente"
              : "Desconectado"}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <GhostButton
              onClick={() => set("connected", !p.connected)}
              className="min-h-11 px-4 py-2.5 text-[13px]"
            >
              {p.connected ? "Desconectar conta Strava" : "Reconectar conta Strava"}
            </GhostButton>
            <GhostButton className="min-h-11 px-4 py-2.5 text-[13px]">
              Testar conexão
            </GhostButton>
          </div>
        </Card>

        <Card>
          <SectionLabel>Garmin (opcional)</SectionLabel>
          <FieldLabel>ID ou link do percurso/atividade pública do Garmin</FieldLabel>
          <div className="mb-1.5">
            <TextInput
              value={p.garminRouteRef ?? ""}
              onChange={(e) => set("garminRouteRef", e.target.value)}
              placeholder="ex.: connect.garmin.com/modern/course/123456789"
            />
          </div>
          <p className="text-[12px] text-adm-muted">
            Use o link de um <strong>percurso (course)</strong>, atividade ou rota{" "}
            <strong>público</strong> do Garmin Connect — ex.:{" "}
            <code>connect.garmin.com/modern/course/123456789</code>. Links de{" "}
            <strong>evento</strong> (<code>/modern/event/…</code>) não têm mapa para
            incorporar. Se você preencher Strava e Garmin, o visitante escolhe qual ver.
          </p>
        </Card>

        <Card>
          <SectionLabel>Fallback manual (caso a API falhe)</SectionLabel>
          <div className="rounded-lg border-2 border-dashed border-[#ccc] p-7 text-center text-[13px] text-[#999]">
            Upload de arquivo GPX ou imagem do mapa
          </div>
        </Card>

        <Card>
          <SectionLabel>Dados complementares</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Distância</FieldLabel>
              <TextInput
                value={p.distance}
                onChange={(e) => set("distance", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Elevação</FieldLabel>
              <TextInput
                value={p.elevation}
                onChange={(e) => set("elevation", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Largada/Chegada</FieldLabel>
              <TextInput
                value={p.startFinish}
                onChange={(e) => set("startFinish", e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-[760px]">
        <SaveBar
          onSave={() =>
            save({ percurso: p }, "Atualizou configuração do percurso (Strava)")
          }
        />
      </div>
    </>
  );
}

export default function StravaPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <StravaForm initial={content.percurso} />;
}
