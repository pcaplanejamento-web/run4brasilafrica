"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Percurso, PercursoRoute } from "@/lib/content/types";
import { percursoRoutes } from "@/lib/content/percurso";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  PrimaryButton,
  SaveBar,
  SectionLabel,
  TextInput,
} from "@/components/admin/ui";

function newRoute(n: number): PercursoRoute {
  return {
    id: `rota-${n}-${Math.floor(Date.now() / 1000)}`,
    title: "",
    stravaRouteRef: "",
    garminRouteRef: "",
    fallbackImage: "",
    fallbackNote: "",
    distance: "",
    elevation: "",
    startFinish: "",
  };
}

function StravaForm({ initial }: { initial: Percurso }) {
  const { save } = useContent();
  // Normalise to a routes-based model (migrate the legacy single route in).
  const [p, setP] = useState<Percurso>(() => ({
    ...initial,
    routes: initial.routes?.length ? initial.routes : percursoRoutes(initial),
  }));
  const routes = p.routes ?? [];

  const setRoute = (i: number, patch: Partial<PercursoRoute>) =>
    setP((prev) => ({
      ...prev,
      routes: (prev.routes ?? []).map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  const addRoute = () =>
    setP((prev) => ({
      ...prev,
      routes: [...(prev.routes ?? []), newRoute((prev.routes ?? []).length + 1)],
    }));
  const removeRoute = (i: number) =>
    setP((prev) => ({
      ...prev,
      routes: (prev.routes ?? []).filter((_, idx) => idx !== i),
    }));
  const move = (i: number, dir: -1 | 1) =>
    setP((prev) => {
      const list = [...(prev.routes ?? [])];
      const j = i + dir;
      if (j < 0 || j >= list.length) return prev;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...prev, routes: list };
    });

  return (
    <>
      <div className="mb-7">
        <PageTitle>Percurso</PageTitle>
      </div>

      <div className="flex max-w-[820px] flex-col gap-5">
        <Card>
          <SectionLabel>Título da seção</SectionLabel>
          <FieldLabel>Aparece como título grande da seção do percurso no site</FieldLabel>
          <TextInput
            value={p.title}
            onChange={(e) => setP({ ...p, title: e.target.value })}
            placeholder="ex.: PURA ADRENALINA."
          />
        </Card>

        <div className="flex items-center justify-between">
          <SectionLabel>Percursos</SectionLabel>
          <PrimaryButton onClick={addRoute} className="px-4 py-2 text-[13px]">
            + Novo percurso
          </PrimaryButton>
        </div>
        <p className="-mt-2 text-[12px] text-adm-muted">
          Cadastre um ou mais percursos. Quando houver mais de um, o visitante troca
          entre eles na tela inicial e vê os dados de cada um.
        </p>

        {routes.map((r, i) => (
          <Card key={r.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-adm-ink">
                {r.title?.trim() || `Percurso ${i + 1}`}
              </span>
              <div className="flex gap-2">
                <GhostButton onClick={() => move(i, -1)} className="px-3 py-1.5 text-[12px]">
                  ↑
                </GhostButton>
                <GhostButton onClick={() => move(i, 1)} className="px-3 py-1.5 text-[12px]">
                  ↓
                </GhostButton>
                {routes.length > 1 && (
                  <GhostButton
                    onClick={() => removeRoute(i)}
                    className="px-3 py-1.5 text-[12px]"
                  >
                    Remover
                  </GhostButton>
                )}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Título do percurso</FieldLabel>
              <TextInput
                value={r.title}
                onChange={(e) => setRoute(i, { title: e.target.value })}
                placeholder="ex.: 10 KM"
              />
            </div>

            <div className="mb-4">
              <FieldLabel>ID ou link da rota no Strava</FieldLabel>
              <TextInput
                value={r.stravaRouteRef ?? ""}
                onChange={(e) => setRoute(i, { stravaRouteRef: e.target.value })}
                placeholder="ex.: 3300000 ou strava.com/routes/3300000"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Rota <strong>pública</strong> do Strava — o mapa aparece sozinho, sem
                credenciais.
              </p>
            </div>

            <div className="mb-4">
              <FieldLabel>Garmin (opcional)</FieldLabel>
              <TextInput
                value={r.garminRouteRef ?? ""}
                onChange={(e) => setRoute(i, { garminRouteRef: e.target.value })}
                placeholder="ex.: connect.garmin.com/modern/course/123456789"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Aceita <strong>percurso (course)</strong>, atividade, rota <strong>ou
                evento</strong>. Course/atividade mostram o mapa incorporado; um link de{" "}
                <strong>evento</strong> (<code>/modern/event/…</code>) aparece como um botão
                &ldquo;Ver evento no Garmin&rdquo;.
              </p>
            </div>

            <div className="mb-4">
              <FieldLabel>Fallback manual (caso a API falhe)</FieldLabel>
              <ImageUpload
                value={r.fallbackImage}
                onChange={(url) => setRoute(i, { fallbackImage: url })}
                label="imagem do mapa"
                className="h-44"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Imagem do mapa exibida quando não há Strava/Garmin (ou como opção
                &ldquo;Mapa&rdquo; ao lado deles).
              </p>
            </div>

            <SectionLabel>Dados complementares</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel>Distância</FieldLabel>
                <TextInput
                  value={r.distance ?? ""}
                  onChange={(e) => setRoute(i, { distance: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Elevação</FieldLabel>
                <TextInput
                  value={r.elevation ?? ""}
                  onChange={(e) => setRoute(i, { elevation: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Largada/Chegada</FieldLabel>
                <TextInput
                  value={r.startFinish ?? ""}
                  onChange={(e) => setRoute(i, { startFinish: e.target.value })}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="max-w-[820px]">
        <SaveBar onSave={() => save({ percurso: p }, "Atualizou os percursos")} />
      </div>
    </>
  );
}

export default function StravaPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <StravaForm initial={content.percurso} />;
}
