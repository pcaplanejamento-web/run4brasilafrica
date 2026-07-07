"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Album, GalleryConfig } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  Select,
  TextInput,
} from "@/components/admin/ui";

function BuyButtonCard({ initial }: { initial: GalleryConfig }) {
  const { save, status } = useContent();
  const [buy, setBuy] = useState<GalleryConfig>(initial);
  return (
    <Card dashed className="mb-6">
      <SectionLabel>Botão &quot;comprar fotos&quot; (ao lado do título)</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel>Mostrar o botão?</FieldLabel>
          <Select
            value={buy.buyEnabled ? "sim" : "nao"}
            onChange={(e) => setBuy({ ...buy, buyEnabled: e.target.value === "sim" })}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </Select>
        </div>
        <div>
          <FieldLabel>Texto do botão</FieldLabel>
          <TextInput
            value={buy.buyLabel ?? ""}
            onChange={(e) => setBuy({ ...buy, buyLabel: e.target.value })}
            placeholder="Comprar fotos"
          />
        </div>
        <div>
          <FieldLabel>Link (site de venda das fotos)</FieldLabel>
          <TextInput
            value={buy.buyUrl ?? ""}
            onChange={(e) => setBuy({ ...buy, buyUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <GhostButton
          onClick={() => save({ gallery: buy }, "Atualizou o botão de comprar fotos")}
          disabled={status === "saving"}
        >
          Salvar botão
        </GhostButton>
      </div>
    </Card>
  );
}

function SectionsEditor({ initial }: { initial: Album[] }) {
  const { save, status } = useContent();
  const [albums, setAlbums] = useState<Album[]>(initial);
  const [test, setTest] = useState<Record<number, string>>({});

  function setAlbum(i: number, patch: Partial<Album>) {
    setAlbums((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function add() {
    setAlbums((a) => [...a, { name: `Seção ${a.length + 1}`, count: 0 }]);
  }
  function remove(i: number) {
    setAlbums((a) => a.filter((_, idx) => idx !== i));
  }
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
    <>
      {albums.map((a, i) => (
        <Card key={i} className="mb-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Nome da seção</FieldLabel>
              <TextInput
                value={a.name}
                onChange={(e) => setAlbum(i, { name: e.target.value })}
              />
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
            <GhostButton onClick={() => testLink(i, a.sourceUrl)}>
              Testar link
            </GhostButton>
            {test[i] && (
              <span className="text-[12px] text-adm-muted">{test[i]}</span>
            )}
            <div className="ml-auto">
              <GhostButton onClick={() => remove(i)}>Excluir seção</GhostButton>
            </div>
          </div>
        </Card>
      ))}

      <button
        type="button"
        onClick={add}
        className="mb-6 inline-block rounded border border-dashed border-[#999] px-4 py-2.5 text-[13px] text-[#666] hover:border-terracotta hover:text-terracotta"
      >
        + Nova seção
      </button>

      <div className="flex items-center justify-end gap-3">
        {status === "saved" && (
          <span className="text-[13px] font-semibold text-[#4a9d5f]">
            Seções salvas
          </span>
        )}
        <PrimaryButton
          onClick={() => save({ albums }, "Atualizou as seções da galeria")}
          disabled={status === "saving"}
        >
          Salvar seções
        </PrimaryButton>
      </div>
    </>
  );
}

export default function GaleriaPage() {
  const { content, hydrated } = useContent();
  if (!hydrated) return <AdmLoading />;

  return (
    <>
      <PageHeader title="Gestão da Galeria" />

      <BuyButtonCard initial={content.gallery ?? {}} />

      <div className="mb-3 text-[13px] font-bold uppercase text-adm-muted">
        Seções (cada uma puxa as fotos de um álbum do Google Fotos)
      </div>
      <p className="mb-4 text-[12px] text-adm-muted">
        Cole o link de um álbum <strong>público</strong> do Google Fotos em cada seção —
        as fotos aparecem na galeria do site (com marca d&apos;água e proteção). O álbum
        precisa estar compartilhado como &ldquo;qualquer pessoa com o link&rdquo;.
      </p>

      <SectionsEditor initial={content.albums ?? []} />
    </>
  );
}
