"use client";

import { useState } from "react";
import type { Album, GalleryConfig } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  GhostButton,
  SectionLabel,
  Select,
  TextInput,
} from "@/components/admin/ui";

/**
 * Editor controlado da Galeria (config + seções/álbuns), embutido no bloco
 * `galeria` da aba. As fotos são buscadas em runtime (Google Fotos/upload); aqui
 * edita-se apenas a configuração e os álbuns públicos.
 */
export function GalleryEditor({
  value,
  onChange,
}: {
  value: { gallery?: GalleryConfig; albums?: Album[] };
  onChange: (v: { gallery: GalleryConfig; albums: Album[] }) => void;
}) {
  const [gallery, setGallery] = useState<GalleryConfig>(value.gallery ?? {});
  const [albums, setAlbums] = useState<Album[]>(value.albums ?? []);
  const [test, setTest] = useState<Record<number, string>>({});
  const num = (v: number | undefined, fallback: number) => v ?? fallback;

  function emit(nextGallery: GalleryConfig, nextAlbums: Album[]) {
    setGallery(nextGallery);
    setAlbums(nextAlbums);
    onChange({ gallery: nextGallery, albums: nextAlbums });
  }
  const setCfg = (patch: Partial<GalleryConfig>) => emit({ ...gallery, ...patch }, albums);
  const setAlbum = (i: number, patch: Partial<Album>) =>
    emit(gallery, albums.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const addAlbum = () =>
    emit(gallery, [...albums, { name: `Seção ${albums.length + 1}`, count: 0 }]);
  const removeAlbum = (i: number) => emit(gallery, albums.filter((_, idx) => idx !== i));

  async function testLink(i: number, url?: string) {
    if (!url) return;
    setTest((t) => ({ ...t, [i]: "Testando…" }));
    try {
      const r = await fetch(`/api/gphotos?url=${encodeURIComponent(url)}`);
      const d = (await r.json()) as { ok: boolean; count?: number; error?: string };
      setTest((t) => ({
        ...t,
        [i]: d.ok
          ? d.count
            ? `${d.count} foto(s) encontradas`
            : "Nenhuma foto encontrada — confira se o álbum é público"
          : d.error ?? "Falhou",
      }));
    } catch {
      setTest((t) => ({ ...t, [i]: "Falha de conexão" }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card dashed>
        <SectionLabel>Botão &quot;comprar fotos&quot; (ao lado do título)</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Mostrar o botão?</FieldLabel>
            <Select
              value={gallery.buyEnabled ? "sim" : "nao"}
              onChange={(e) => setCfg({ buyEnabled: e.target.value === "sim" })}
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Texto do botão</FieldLabel>
            <TextInput
              value={gallery.buyLabel ?? ""}
              onChange={(e) => setCfg({ buyLabel: e.target.value })}
              placeholder="Comprar fotos"
            />
          </div>
          <div>
            <FieldLabel>Link (site de venda das fotos)</FieldLabel>
            <TextInput
              value={gallery.buyUrl ?? ""}
              onChange={(e) => setCfg({ buyUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>Grade deslizante (slide) da galeria</SectionLabel>
          <p className="-mt-2 mb-3 text-[12px] text-adm-muted">
            As fotos aparecem numa grade que desliza sozinha até mostrar todas. Defina quantas
            colunas × linhas por vez no computador e no celular.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <FieldLabel>Colunas (PC)</FieldLabel>
              <TextInput type="number" min={1} max={8} value={num(gallery.slideCols, 3)}
                onChange={(e) => setCfg({ slideCols: Number(e.target.value) || 1 })} />
            </div>
            <div>
              <FieldLabel>Linhas (PC)</FieldLabel>
              <TextInput type="number" min={1} max={6} value={num(gallery.slideRows, 2)}
                onChange={(e) => setCfg({ slideRows: Number(e.target.value) || 1 })} />
            </div>
            <div>
              <FieldLabel>Colunas (celular)</FieldLabel>
              <TextInput type="number" min={1} max={4} value={num(gallery.slideColsMobile, 2)}
                onChange={(e) => setCfg({ slideColsMobile: Number(e.target.value) || 1 })} />
            </div>
            <div>
              <FieldLabel>Linhas (celular)</FieldLabel>
              <TextInput type="number" min={1} max={6} value={num(gallery.slideRowsMobile, 3)}
                onChange={(e) => setCfg({ slideRowsMobile: Number(e.target.value) || 1 })} />
            </div>
            <div>
              <FieldLabel>Troca a cada (s)</FieldLabel>
              <TextInput type="number" min={2} max={30} value={num(gallery.slideSeconds, 5)}
                onChange={(e) => setCfg({ slideSeconds: Number(e.target.value) || 5 })} />
            </div>
          </div>
        </div>
      </Card>

      <div>
        <div className="mb-2 text-[13px] font-bold uppercase text-adm-muted">
          Seções (cada uma puxa as fotos de um álbum do Google Fotos)
        </div>
        <p className="mb-4 text-[12px] text-adm-muted">
          Cole o link de um álbum <strong>público</strong> do Google Fotos em cada seção — as
          fotos aparecem na galeria do site (com marca d&apos;água e proteção).
        </p>
        {albums.map((a, i) => (
          <Card key={i} className="mb-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Nome da seção</FieldLabel>
                <TextInput value={a.name} onChange={(e) => setAlbum(i, { name: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Link do álbum público do Google Fotos</FieldLabel>
                <TextInput
                  value={a.sourceUrl ?? ""}
                  onChange={(e) => setAlbum(i, { sourceUrl: e.target.value })}
                  placeholder="https://photos.app.goo.gl/..."
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <GhostButton onClick={() => testLink(i, a.sourceUrl)}>Testar link</GhostButton>
              {test[i] && <span className="text-[12px] text-adm-muted">{test[i]}</span>}
              <div className="ml-auto">
                <GhostButton onClick={() => removeAlbum(i)}>Excluir seção</GhostButton>
              </div>
            </div>
          </Card>
        ))}
        <button
          type="button"
          onClick={addAlbum}
          className="inline-block rounded border border-dashed border-[#999] px-4 py-2.5 text-[13px] text-[#666] hover:border-terracotta hover:text-terracotta"
        >
          + Nova seção
        </button>
      </div>
    </div>
  );
}
