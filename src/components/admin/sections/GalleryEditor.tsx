"use client";

import { useState } from "react";
import type { Album, GalleryConfig } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  SectionLabel,
  Select,
  TextInput,
} from "@/components/admin/ui";

/**
 * Editor **controlado** da Galeria (config + seções/álbuns), embutido no bloco
 * `galeria` da aba: deriva de `value` a cada render (fonte única = o bloco no
 * pai) e emite via `onChange`. As seções viram **abas** no site — a 1ª é a que
 * abre — e **cada seção tem o seu próprio botão "comprar fotos"**. O estado
 * `test` (resultado do "testar link") é só de UI e fica local.
 */
export function GalleryEditor({
  value,
  onChange,
}: {
  value: { gallery?: GalleryConfig; albums?: Album[] };
  onChange: (v: { gallery: GalleryConfig; albums: Album[] }) => void;
}) {
  const gallery = value.gallery ?? {};
  const albums = value.albums ?? [];
  const [test, setTest] = useState<Record<number, string>>({});
  const num = (v: number | undefined, fallback: number) => v ?? fallback;

  const emit = (nextGallery: GalleryConfig, nextAlbums: Album[]) =>
    onChange({ gallery: nextGallery, albums: nextAlbums });
  const setCfg = (patch: Partial<GalleryConfig>) => emit({ ...gallery, ...patch }, albums);
  const setAlbum = (i: number, patch: Partial<Album>) =>
    emit(gallery, albums.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const addAlbum = () =>
    emit(gallery, [...albums, { name: `Seção ${albums.length + 1}`, count: 0 }]);
  const removeAlbum = (i: number) => emit(gallery, albums.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= albums.length) return;
    const list = [...albums];
    [list[i], list[j]] = [list[j], list[i]];
    emit(gallery, list);
  };

  // Botão de compra da seção herda o global legado enquanto não for editado, para
  // não perder o link antigo (migração suave — o público resolve igual).
  const buyEnabled = (a: Album) => a.buyEnabled ?? gallery.buyEnabled ?? false;
  const buyLabel = (a: Album) => a.buyLabel ?? gallery.buyLabel ?? "";
  const buyUrl = (a: Album) => a.buyUrl ?? gallery.buyUrl ?? "";

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
        <SectionLabel>Grade deslizante (slide) da galeria</SectionLabel>
        <p className="-mt-2 mb-3 text-[12px] text-adm-muted">
          Dentro de cada seção, as fotos aparecem numa grade que desliza sozinha até mostrar
          todas. Defina quantas colunas × linhas por vez no computador e no celular.
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
      </Card>

      <div>
        <div className="mb-2 text-[13px] font-bold uppercase text-adm-muted">
          Seções de fotos (viram abas no site)
        </div>
        <p className="mb-4 text-[12px] text-adm-muted">
          Cada seção puxa as fotos de um álbum <strong>público</strong> do Google Fotos e vira
          uma <strong>aba</strong> no site. A <strong>ordem manda</strong> — a primeira seção é a
          que abre. Cada seção tem o <strong>seu próprio botão &ldquo;comprar fotos&rdquo;</strong>.
        </p>

        {albums.map((a, i) => (
          <Card key={i} className="mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-adm-ink">
                {a.name?.trim() || `Seção ${i + 1}`}
                {i === 0 && (
                  <span className="ml-2 rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#2f7a45]">
                    Abre primeiro
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <GhostButton onClick={() => move(i, -1)} className="px-3 py-1.5 text-[12px]">
                  ↑
                </GhostButton>
                <GhostButton onClick={() => move(i, 1)} className="px-3 py-1.5 text-[12px]">
                  ↓
                </GhostButton>
                <GhostButton onClick={() => removeAlbum(i)} className="px-3 py-1.5 text-[12px] text-[#c0392b]">
                  Excluir
                </GhostButton>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Nome da seção (rótulo da aba)</FieldLabel>
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
            </div>

            {/* Botão "comprar fotos" PRÓPRIO desta seção. */}
            <div className="mt-4 rounded-lg border border-dashed border-adm-border bg-adm-card/40 p-4">
              <SectionLabel>Botão &quot;comprar fotos&quot; desta seção</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel>Mostrar o botão?</FieldLabel>
                  <Select
                    value={buyEnabled(a) ? "sim" : "nao"}
                    onChange={(e) => setAlbum(i, { buyEnabled: e.target.value === "sim" })}
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Texto do botão</FieldLabel>
                  <TextInput
                    value={buyLabel(a)}
                    onChange={(e) => setAlbum(i, { buyLabel: e.target.value })}
                    placeholder="Comprar fotos"
                  />
                </div>
                <div>
                  <FieldLabel>Link (site de venda das fotos)</FieldLabel>
                  <TextInput
                    value={buyUrl(a)}
                    onChange={(e) => setAlbum(i, { buyUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {albums.length === 0 && (
          <p className="mb-4 text-[13px] text-adm-muted">Nenhuma seção ainda.</p>
        )}

        {/* Adicionar ABAIXO da última seção (nova seção entra no fim da lista). */}
        <PrimaryButton onClick={addAlbum} className="px-4 py-2 text-[13px]">
          + Nova seção
        </PrimaryButton>
      </div>
    </div>
  );
}
