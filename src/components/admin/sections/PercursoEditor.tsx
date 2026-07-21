"use client";

import type { Percurso, PercursoRoute } from "@/lib/content/types";
import { percursoRoutes } from "@/lib/content/percurso";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
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

/** Editor controlado do "Percurso" (`Percurso`). */
export function PercursoEditor({
  value,
  onChange,
  cloudinary,
}: {
  value: Percurso;
  onChange: (next: Percurso) => void;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}) {
  // Normaliza o modelo legado de rota única para o de múltiplas rotas (só p/ edição).
  const routes = value.routes?.length ? value.routes : percursoRoutes(value);
  const set = (patch: Partial<Percurso>) => onChange({ ...value, ...patch });
  const setRoute = (i: number, patch: Partial<PercursoRoute>) =>
    set({ routes: routes.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  const addRoute = () => set({ routes: [...routes, newRoute(routes.length + 1)] });
  const removeRoute = (i: number) => set({ routes: routes.filter((_, idx) => idx !== i) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= routes.length) return;
    const list = [...routes];
    [list[i], list[j]] = [list[j], list[i]];
    set({ routes: list });
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionLabel>Título da seção</SectionLabel>
        <FieldLabel>Título grande da seção do percurso no site</FieldLabel>
        <TextInput
          value={value.title}
          onChange={(e) => set({ title: e.target.value })}
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
        Um ou mais percursos. Com mais de um, o visitante troca entre eles na tela inicial.
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
                <GhostButton onClick={() => removeRoute(i)} className="px-3 py-1.5 text-[12px]">
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
              placeholder="ex.: 3300000, strava.com/routes/3300000 ou strava.app.link/XXXX"
            />
          </div>
          <div className="mb-4">
            <FieldLabel>Garmin (opcional)</FieldLabel>
            <TextInput
              value={r.garminRouteRef ?? ""}
              onChange={(e) => setRoute(i, { garminRouteRef: e.target.value })}
              placeholder="ex.: connect.garmin.com/modern/course/123456789"
            />
          </div>
          <div className="mb-4">
            <FieldLabel>Fallback manual (caso a API falhe)</FieldLabel>
            <ImageUpload
              value={r.fallbackImage}
              onChange={(url) => setRoute(i, { fallbackImage: url })}
              label="imagem do mapa"
              className="h-44"
              cloudinary={cloudinary}
            />
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
  );
}
