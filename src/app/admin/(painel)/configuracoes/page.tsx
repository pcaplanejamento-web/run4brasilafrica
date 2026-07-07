"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Backend } from "@/lib/content/store";
import type { EventInfo, Hero } from "@/lib/content/types";
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
import ChangePassword from "@/components/admin/ChangePassword";

const BACKEND_LABEL: Record<Backend, { text: string; dot: string; tone: string }> = {
  backend: { text: "Backend conectado (Cloudflare D1)", dot: "#4a9d5f", tone: "#2f7a45" },
  seed: {
    text: "Backend conectado — usando conteúdo padrão (nada salvo ainda)",
    dot: "#4a9d5f",
    tone: "#2f7a45",
  },
  local: {
    text: "Sem backend — salvando apenas neste navegador",
    dot: "#d9a441",
    tone: "#9a6b12",
  },
  unset: {
    text: "Backend não configurado (rodando localmente)",
    dot: "#d9a441",
    tone: "#9a6b12",
  },
  error: { text: "Backend inacessível", dot: "#c0392b", tone: "#a83227" },
};

function ConfiguracoesForm({
  initialEvent,
  initialHero,
}: {
  initialEvent: EventInfo;
  initialHero: Hero;
}) {
  const { save, reset, reload, backend, status } = useContent();
  const [event, setEvent] = useState(initialEvent);
  const [hero, setHero] = useState(initialHero);

  const b = BACKEND_LABEL[backend];

  function setEv<K extends keyof EventInfo>(key: K, value: EventInfo[K]) {
    setEvent({ ...event, [key]: value });
  }

  async function handleReset() {
    if (
      !window.confirm(
        "Restaurar todo o conteúdo do site para o padrão? As alterações salvas serão perdidas.",
      )
    )
      return;
    await reset();
    setEvent(initialEvent);
    setHero(initialHero);
  }

  return (
    <>
      <div className="mb-7">
        <PageTitle>Configurações</PageTitle>
      </div>

      <div className="flex max-w-[760px] flex-col gap-5">
        {/* Backend status */}
        <Card>
          <SectionLabel>Conexão com o backend</SectionLabel>
          <div className="flex items-center gap-2 text-[14px]" style={{ color: b.tone }}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: b.dot }}
            />
            {b.text}
          </div>
          <p className="mt-2 text-[13px] leading-[1.6] text-adm-muted">
            O conteúdo é gravado no Cloudflare D1 (o banco do próprio site). Rodando
            localmente sem o binding, as alterações ficam apenas neste navegador; no
            site publicado, salvam para todos os visitantes na hora.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <GhostButton
              onClick={() => reload()}
              className="min-h-11 px-4 py-2.5 text-[13px]"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Testando..." : "Testar conexão"}
            </GhostButton>
          </div>
        </Card>

        {/* Event info */}
        <Card>
          <SectionLabel>Identidade do evento</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Nome da marca</FieldLabel>
              <TextInput
                value={event.brandName}
                onChange={(e) => setEv("brandName", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Ano da edição</FieldLabel>
              <TextInput
                value={event.editionYear}
                onChange={(e) => setEv("editionYear", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Cidade</FieldLabel>
              <TextInput
                value={event.city}
                onChange={(e) => setEv("city", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Selo de data (badge do hero)</FieldLabel>
              <TextInput
                value={event.dateLabel}
                onChange={(e) => {
                  setEv("dateLabel", e.target.value);
                  setHero({ ...hero, badge: e.target.value });
                }}
              />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Chamada principal (título do hero)</FieldLabel>
            <TextInput
              value={hero.title}
              onChange={(e) => {
                setHero({ ...hero, title: e.target.value });
                setEv("tagline", e.target.value);
              }}
            />
          </div>
          <div className="mt-4">
            <FieldLabel>Texto do botão principal</FieldLabel>
            <TextInput
              value={hero.ctaLabel}
              onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })}
            />
          </div>
        </Card>

        {/* Change my password */}
        <ChangePassword />

        {/* Danger zone */}
        <Card>
          <SectionLabel>Restaurar conteúdo</SectionLabel>
          <p className="mb-3 text-[13px] leading-[1.6] text-adm-muted">
            Volta todo o conteúdo do site para os valores padrão de fábrica.
          </p>
          <GhostButton
            onClick={handleReset}
            className="min-h-11 border-[#e0b4b0] px-4 py-2.5 text-[13px] text-[#c0392b] hover:border-[#c0392b] hover:text-[#c0392b]"
          >
            Restaurar conteúdo padrão
          </GhostButton>
        </Card>
      </div>

      <div className="max-w-[760px]">
        <SaveBar
          onSave={() =>
            save({ event, hero }, "Atualizou configurações do evento")
          }
        />
      </div>
    </>
  );
}

export default function ConfiguracoesPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <ConfiguracoesForm initialEvent={content.event} initialHero={content.hero} />
  );
}
