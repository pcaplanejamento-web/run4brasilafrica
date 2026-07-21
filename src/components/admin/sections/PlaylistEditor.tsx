"use client";

import type { PlaylistSection } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

/** Editor controlado da "Playlist do evento" (`PlaylistSection`). */
export function PlaylistEditor({
  value,
  onChange,
}: {
  value: PlaylistSection;
  onChange: (next: PlaylistSection) => void;
}) {
  const pl = value ?? {};
  const set = (patch: Partial<PlaylistSection>) => onChange({ ...pl, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <Card dashed>
        <SectionLabel>Exibição</SectionLabel>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel>Mostrar a seção no site?</FieldLabel>
            <Select
              value={pl.enabled ? "sim" : "nao"}
              onChange={(e) => set({ enabled: e.target.value === "sim" })}
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </Select>
          </div>
          <div>
            <FieldLabel>O que fica visível</FieldLabel>
            <Select
              value={pl.visible ?? "both"}
              onChange={(e) => set({ visible: e.target.value as PlaylistSection["visible"] })}
            >
              <option value="both">Spotify e YouTube (o visitante escolhe)</option>
              <option value="youtube">Somente YouTube</option>
              <option value="spotify">Somente Spotify</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card dashed>
        <SectionLabel>Textos</SectionLabel>
        <div className="mb-4">
          <FieldLabel>Título</FieldLabel>
          <TextInput
            value={pl.title ?? ""}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Playlist do evento"
          />
        </div>
        <div>
          <FieldLabel>Descrição (opcional)</FieldLabel>
          <TextArea rows={2} value={pl.note ?? ""} onChange={(e) => set({ note: e.target.value })} />
        </div>
      </Card>

      <Card dashed>
        <SectionLabel>Links das playlists</SectionLabel>
        <div className="mb-4">
          <FieldLabel>Link da playlist no YouTube</FieldLabel>
          <TextInput
            value={pl.youtubeUrl ?? ""}
            onChange={(e) => set({ youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/playlist?list=PLxxxxxxxx"
          />
        </div>
        <div>
          <FieldLabel>Link da playlist no Spotify</FieldLabel>
          <TextInput
            value={pl.spotifyUrl ?? ""}
            onChange={(e) => set({ spotifyUrl: e.target.value })}
            placeholder="https://open.spotify.com/playlist/xxxxxxxx"
          />
        </div>
        <p className="mt-3 text-[12px] text-adm-muted">
          A playlist toca enquanto o visitante navega; quando um vídeo do banner/&quot;A Causa&quot;
          liga o som, a do YouTube é silenciada e a do Spotify pausada.
        </p>
      </Card>
    </div>
  );
}
