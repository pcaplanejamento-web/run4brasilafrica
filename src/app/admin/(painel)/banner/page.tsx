"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Hero, HeroSlide } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  ImagePlaceholder,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

function BannerForm({
  initial,
  editionLabel,
}: {
  initial: Hero;
  editionLabel: string;
}) {
  const { save } = useContent();
  const [hero, setHero] = useState(initial);

  function setSlide(i: number, patch: Partial<HeroSlide>) {
    setHero((h) => ({
      ...h,
      slides: h.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }
  function move(i: number, dir: -1 | 1) {
    setHero((h) => {
      const next = [...h.slides];
      const j = i + dir;
      if (j < 0 || j >= next.length) return h;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...h, slides: next };
    });
  }
  function remove(i: number) {
    setHero((h) => ({ ...h, slides: h.slides.filter((_, idx) => idx !== i) }));
  }
  function add() {
    setHero((h) => ({
      ...h,
      slides: [...h.slides, { text: "Novo slide", cta: "Saiba mais" }],
    }));
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Gestão do Banner / Hero</PageTitle>
        <span className="text-[13px] text-[#777]">Edição: {editionLabel}</span>
      </div>

      <Card className="mb-7">
        <SectionLabel>Imagem de fundo do hero</SectionLabel>
        <ImageUpload
          value={hero.image}
          onChange={(url) => setHero({ ...hero, image: url })}
          className="h-52"
          label="imagem do hero"
        />
        <p className="mt-2 text-[12px] text-adm-muted">
          Aparece atrás do título na página inicial. Use uma foto horizontal de alta
          qualidade (JPG/PNG/WebP, até 8 MB).
        </p>
      </Card>

      <Card dashed className="mb-7">
        <SectionLabel>
          Slides do carrossel (use as setas para reordenar)
        </SectionLabel>
        <div className="flex flex-col">
          {hero.slides.map((sl, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 border-b border-[#eee] py-3 last:border-0 md:flex-row md:items-center md:gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    aria-label="Mover para cima"
                    className="px-1 text-[#aaa] hover:text-terracotta disabled:opacity-30"
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    aria-label="Mover para baixo"
                    className="px-1 text-[#aaa] hover:text-terracotta disabled:opacity-30"
                    disabled={i === hero.slides.length - 1}
                  >
                    ↓
                  </button>
                </div>
                <ImagePlaceholder className="h-14 w-24 flex-none rounded" />
              </div>
              <div className="flex-1">
                <FieldLabel>Texto de destaque</FieldLabel>
                <TextInput
                  value={sl.text}
                  onChange={(e) => setSlide(i, { text: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <FieldLabel>Botão (CTA)</FieldLabel>
                <TextInput
                  value={sl.cta}
                  onChange={(e) => setSlide(i, { cta: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-4 inline-block rounded border border-dashed border-[#999] px-4 py-2.5 text-[13px] text-[#666] hover:border-terracotta hover:text-terracotta"
        >
          + Adicionar slide
        </button>
      </Card>

      <Card dashed>
        <SectionLabel>Configurações gerais do carrossel</SectionLabel>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel>Transição</FieldLabel>
            <Select
              value={hero.transition}
              onChange={(e) => setHero({ ...hero, transition: e.target.value })}
            >
              <option>Fade suave</option>
              <option>Deslizar</option>
              <option>Zoom sutil</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Duração por slide (segundos)</FieldLabel>
            <TextInput
              type="number"
              min={2}
              max={30}
              value={hero.slideDurationSeconds}
              onChange={(e) =>
                setHero({
                  ...hero,
                  slideDurationSeconds: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Reduzir movimento (acessibilidade)</FieldLabel>
            <Select
              value={hero.reduceMotion ? "sim" : "nao"}
              onChange={(e) =>
                setHero({ ...hero, reduceMotion: e.target.value === "sim" })
              }
            >
              <option value="sim">Respeitar preferência do usuário</option>
              <option value="nao">Sempre animar</option>
            </Select>
          </div>
        </div>
      </Card>

      <SaveBar onSave={() => save({ hero }, "Atualizou o banner / hero")} />
    </>
  );
}

export default function BannerPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <BannerForm
      initial={content.hero}
      editionLabel={`${content.event.brandName} ${content.event.editionYear}`}
    />
  );
}
