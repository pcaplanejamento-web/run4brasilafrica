"use client";

import { useMemo, useState } from "react";
import { useContent } from "@/lib/content/store";
import {
  AdmLoading,
  ImagePlaceholder,
  PageHeader,
  PrimaryButton,
} from "@/components/admin/ui";

export default function GaleriaPage() {
  const { content, hydrated, save } = useContent();
  const [active, setActive] = useState(0);

  const albums = content.albums;
  const activeAlbum = albums[active] ?? albums[0];

  // Placeholder thumbnails for the selected album (real uploads replace these).
  const photos = useMemo(
    () => Array.from({ length: Math.min(activeAlbum?.count ?? 12, 18) }, (_, i) => i),
    [activeAlbum],
  );

  if (!hydrated) return <AdmLoading />;

  function addAlbum() {
    const name = `Álbum ${albums.length + 1}`;
    save(
      { albums: [...albums, { name, count: 0 }] },
      `Criou o álbum "${name}"`,
    );
    setActive(albums.length);
  }

  return (
    <>
      <PageHeader
        title="Gestão da Galeria"
        aside={<PrimaryButton onClick={addAlbum}>+ Novo álbum</PrimaryButton>}
      />

      <div className="mb-6 flex flex-wrap gap-2.5">
        {albums.map((a, i) => {
          const on = i === active;
          return (
            <button
              key={a.name}
              type="button"
              onClick={() => setActive(i)}
              className="rounded-full border border-[#ddd] px-4 py-2 text-[13px] font-semibold transition-colors"
              style={{
                background: on ? "#2b2b2b" : "#fff",
                color: on ? "#fff" : "#555",
              }}
            >
              {a.name} · {a.count}
            </button>
          );
        })}
      </div>

      <div className="mb-6 rounded-lg border border-dashed border-[#b8b8b0] bg-adm-card p-5">
        <div className="mb-2.5 text-[13px] text-adm-muted">
          UPLOAD EM LOTE — ÁLBUM &ldquo;{activeAlbum?.name?.toUpperCase()}&rdquo;
        </div>
        <div className="rounded-lg border-2 border-dashed border-[#ccc] p-8 text-center text-[13px] text-[#999]">
          Arraste imagens aqui ou clique para selecionar
          <br />
          <span className="text-[11px]">Miniaturas geradas automaticamente</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((p) => (
          <div key={p} className="relative">
            <ImagePlaceholder className="h-[90px] rounded-md md:h-[100px]" />
            <span className="absolute right-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
              ✕
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
