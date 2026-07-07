"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import { AdmLoading, PageHeader, PrimaryButton } from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

export default function GaleriaPage() {
  const { content, hydrated, save } = useContent();
  const [active, setActive] = useState(0);

  const albums = content.albums;
  const activeAlbum = albums[active] ?? albums[0];
  const albumName = activeAlbum?.name ?? "";
  const photos = (content.galleryPhotos ?? []).filter((p) => p.album === albumName);

  if (!hydrated) return <AdmLoading />;

  function withCounts(nextPhotos: typeof content.galleryPhotos) {
    // Keep each album's count in sync with the real photos it has.
    return albums.map((a) => ({
      ...a,
      count: nextPhotos.filter((p) => p.album === a.name).length || a.count,
    }));
  }

  function addPhoto(url: string) {
    if (!url) return;
    const next = [...(content.galleryPhotos ?? []), { url, album: albumName }];
    save(
      { galleryPhotos: next, albums: withCounts(next) },
      `Adicionou foto ao álbum "${albumName}"`,
    );
  }

  function removePhoto(url: string) {
    const next = (content.galleryPhotos ?? []).filter((p) => p.url !== url);
    save(
      { galleryPhotos: next, albums: withCounts(next) },
      `Removeu foto do álbum "${albumName}"`,
    );
    // Best-effort cleanup of the stored file.
    const key = url.split("/api/media/")[1];
    if (key) fetch(`/api/media/${key}`, { method: "DELETE" }).catch(() => {});
  }

  function addAlbum() {
    const name = `Álbum ${albums.length + 1}`;
    save({ albums: [...albums, { name, count: 0 }] }, `Criou o álbum "${name}"`);
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
          const n = (content.galleryPhotos ?? []).filter((p) => p.album === a.name).length;
          return (
            <button
              key={a.name}
              type="button"
              onClick={() => setActive(i)}
              className="rounded-full border border-[#ddd] px-4 py-2 text-[13px] font-semibold transition-colors"
              style={{ background: on ? "#2b2b2b" : "#fff", color: on ? "#fff" : "#555" }}
            >
              {a.name} · {n}
            </button>
          );
        })}
      </div>

      <div className="mb-6 rounded-lg border border-dashed border-[#b8b8b0] bg-adm-card p-5">
        <div className="mb-2.5 text-[13px] text-adm-muted">
          ADICIONAR FOTO — ÁLBUM &ldquo;{albumName.toUpperCase()}&rdquo;
        </div>
        <ImageUpload value="" onChange={addPhoto} className="h-32" label="foto" />
        <p className="mt-2 text-[12px] text-adm-muted">
          Cada envio adiciona uma foto ao álbum selecionado. JPG/PNG/WebP, até 8 MB.
        </p>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p) => (
            <div key={p.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-[90px] w-full rounded-md object-cover md:h-[100px]"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.url)}
                className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/80"
                aria-label="Remover foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-adm-border bg-adm-card px-5 py-6 text-[13px] text-adm-muted">
          Nenhuma foto neste álbum ainda. Envie a primeira acima.
        </div>
      )}
    </>
  );
}
