"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { PlaylistSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

function PlaylistForm({ initial }: { initial: PlaylistSection }) {
  const { save } = useContent();
  const [pl, setPl] = useState<PlaylistSection>(initial);

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Playlist do evento</PageTitle>
      </div>

      <Card dashed className="mb-7">
        <SectionLabel>Exibição</SectionLabel>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel>Mostrar a seção no site?</FieldLabel>
            <Select
              value={pl.enabled ? "sim" : "nao"}
              onChange={(e) => setPl({ ...pl, enabled: e.target.value === "sim" })}
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </Select>
          </div>
          <div>
            <FieldLabel>O que fica visível</FieldLabel>
            <Select
              value={pl.visible ?? "both"}
              onChange={(e) =>
                setPl({
                  ...pl,
                  visible: e.target.value as PlaylistSection["visible"],
                })
              }
            >
              <option value="both">Spotify e YouTube (o visitante escolhe)</option>
              <option value="youtube">Somente YouTube</option>
              <option value="spotify">Somente Spotify</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card dashed className="mb-7">
        <SectionLabel>Textos</SectionLabel>
        <div className="mb-4">
          <FieldLabel>Título</FieldLabel>
          <TextInput
            value={pl.title ?? ""}
            onChange={(e) => setPl({ ...pl, title: e.target.value })}
            placeholder="Playlist do evento"
          />
        </div>
        <div>
          <FieldLabel>Descrição (opcional)</FieldLabel>
          <TextArea
            rows={2}
            value={pl.note ?? ""}
            onChange={(e) => setPl({ ...pl, note: e.target.value })}
          />
        </div>
      </Card>

      <Card dashed>
        <SectionLabel>Links das playlists</SectionLabel>
        <div className="mb-4">
          <FieldLabel>Link da playlist no YouTube</FieldLabel>
          <TextInput
            value={pl.youtubeUrl ?? ""}
            onChange={(e) => setPl({ ...pl, youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/playlist?list=PLxxxxxxxx"
          />
        </div>
        <div>
          <FieldLabel>Link da playlist no Spotify</FieldLabel>
          <TextInput
            value={pl.spotifyUrl ?? ""}
            onChange={(e) => setPl({ ...pl, spotifyUrl: e.target.value })}
            placeholder="https://open.spotify.com/playlist/xxxxxxxx"
          />
        </div>
        <p className="mt-3 text-[12px] text-adm-muted">
          A playlist toca enquanto o visitante navega. Quando o som de um vídeo do
          banner ou de &quot;A Causa&quot; é ligado, a do YouTube é silenciada e a do
          Spotify é pausada automaticamente. O Spotify não permite iniciar sozinho
          nem ser silenciado (só pausado) — o visitante dá play uma vez.
        </p>
      </Card>

      <SaveBar onSave={() => save({ playlist: pl }, "Atualizou a playlist do evento")} />
    </>
  );
}

export default function PlaylistPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <PlaylistForm initial={content.playlist} />;
}
