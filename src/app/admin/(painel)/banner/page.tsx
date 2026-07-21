"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { HeroCarousel, HeroSlide, MediaType } from "@/lib/content/types";
import { carouselsOf, defaultCarousel, heroOf } from "@/lib/content/carousels";
import HeroImageField from "@/components/admin/HeroImageField";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextInput,
} from "@/components/admin/ui";

/** Bring a slide (possibly from the old text-only carousel) to the new shape. */
function normalizeSlide(s: HeroSlide, i: number): HeroSlide {
  return {
    id: s.id ?? `slide-${i + 1}`,
    mediaType: s.mediaType ?? "image",
    image: s.image,
    imageMobile: s.imageMobile,
    focusX: s.focusX,
    focusY: s.focusY,
    focusXm: s.focusXm,
    focusYm: s.focusYm,
    videoUrl: s.videoUrl,
    videoStartMuted: s.videoStartMuted ?? true,
    title: s.title || s.text || "",
    subtitle: s.subtitle ?? "",
    ctaLabel: s.ctaLabel || s.cta || "Inscreva-se",
    ctaUrl: s.ctaUrl || "#inscricao",
    ctaEnabled: s.ctaEnabled !== false,
    slideLink: s.slideLink,
    ctaAlign: s.ctaAlign === "right" ? "right" : "left",
    ctaVariant: s.ctaVariant === "transparent" ? "transparent" : "solid",
    videoControls: s.videoControls,
    videoCaptions: s.videoCaptions,
  };
}

function newSlide(): HeroSlide {
  return {
    id: `slide-${Date.now()}`,
    mediaType: "image",
    videoStartMuted: true,
    title: "Novo slide",
    subtitle: "",
    ctaLabel: "Inscreva-se",
    ctaUrl: "#inscricao",
  };
}

function BannerForm({
  initialCarousels,
  editionLabel,
  cloudinary,
}: {
  initialCarousels: HeroCarousel[];
  editionLabel: string;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}) {
  const { save } = useContent();
  const [carousels, setCarousels] = useState<HeroCarousel[]>(() =>
    initialCarousels.map((c) => ({
      ...c,
      slides: (c.slides ?? []).map(normalizeSlide),
    })),
  );
  const [selId, setSelId] = useState<string>(
    () => (initialCarousels.find((c) => c.isDefault) ?? initialCarousels[0])?.id,
  );

  const sel = carousels.find((c) => c.id === selId) ?? carousels[0];

  function patchSel(patch: Partial<HeroCarousel>) {
    setCarousels((cs) => cs.map((c) => (c.id === sel.id ? { ...c, ...patch } : c)));
  }

  // ---- Slides of the SELECTED carousel ----
  function setSlide(i: number, patch: Partial<HeroSlide>) {
    patchSel({ slides: sel.slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  }
  function move(i: number, dir: -1 | 1) {
    const next = [...sel.slides];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    patchSel({ slides: next });
  }
  function remove(i: number) {
    patchSel({ slides: sel.slides.filter((_, idx) => idx !== i) });
  }
  function add() {
    patchSel({ slides: [...sel.slides, newSlide()] });
  }

  // ---- Carousels (only one on air at a time; one perpetual default) ----
  function addCarousel() {
    const id = `carousel-${Date.now()}`;
    const nc: HeroCarousel = {
      id,
      name: `Carrossel ${carousels.length + 1}`,
      isDefault: false,
      startAt: "",
      endAt: "",
      slides: [newSlide()],
      slideDurationSeconds: 6,
      reduceMotion: true,
    };
    setCarousels((cs) => [...cs, nc]);
    setSelId(id);
  }
  function removeCarousel(id: string) {
    const target = carousels.find((c) => c.id === id);
    if (!target || target.isDefault || carousels.length <= 1) return;
    setCarousels((cs) => cs.filter((c) => c.id !== id));
    if (selId === id) {
      setSelId((defaultCarousel(carousels) ?? carousels[0]).id);
    }
  }
  function makeDefault(id: string) {
    // Exactly one default; the default is perpetual (no schedule).
    setCarousels((cs) =>
      cs.map((c) =>
        c.id === id
          ? { ...c, isDefault: true, startAt: "", endAt: "" }
          : { ...c, isDefault: false },
      ),
    );
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Gestão do Banner / Hero</PageTitle>
        <span className="text-[13px] text-[#777]">Edição: {editionLabel}</span>
      </div>

      <Card dashed className="mb-7">
        <SectionLabel>Carrosséis do banner</SectionLabel>
        <p className="-mt-2 mb-4 text-[12px] text-adm-muted">
          Só um carrossel aparece por vez. O <strong>padrão</strong> é perpétuo
          (fica sempre no ar como base — nunca deixa o banner vazio). Os
          <strong> agendados</strong> entram no ar no dia/horário marcado e
          substituem o que estava; ao sair (ou sem data de saída = perpétuo),
          volta o padrão (ou outro agendado ativo).
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <FieldLabel>Carrossel em edição</FieldLabel>
            <Select value={sel.id} onChange={(e) => setSelId(e.target.value)}>
              {carousels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isDefault ? " · padrão (perpétuo)" : ""}
                </option>
              ))}
            </Select>
          </div>
          <GhostButton onClick={addCarousel}>+ Novo carrossel</GhostButton>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border border-adm-border bg-[#fbfbfa] p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel>Nome do carrossel</FieldLabel>
            <TextInput
              value={sel.name}
              onChange={(e) => patchSel({ name: e.target.value })}
              placeholder="Ex.: Campanha de lançamento"
            />
          </div>

          {sel.isDefault ? (
            <div className="sm:col-span-2 rounded border border-[#cfe3d4] bg-[#f3faf4] px-3 py-2.5 text-[12px] text-[#2f7a45]">
              Este é o <strong>carrossel padrão (perpétuo)</strong>: fica no ar
              sempre que nenhum agendado estiver ativo. Não tem datas e não pode
              ser removido.
            </div>
          ) : (
            <>
              <div>
                <FieldLabel>Entra no ar em</FieldLabel>
                <TextInput
                  type="datetime-local"
                  value={sel.startAt ?? ""}
                  onChange={(e) => patchSel({ startAt: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-adm-muted">
                  Obrigatório: sem data de entrada, o carrossel não vai ao ar.
                </p>
              </div>
              <div>
                <FieldLabel>Sai do ar em</FieldLabel>
                <TextInput
                  type="datetime-local"
                  value={sel.endAt ?? ""}
                  onChange={(e) => patchSel({ endAt: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-adm-muted">
                  Vazio = fica no ar por tempo indeterminado (perpétuo).
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <GhostButton onClick={() => makeDefault(sel.id)}>
                  Tornar padrão (perpétuo)
                </GhostButton>
                <GhostButton onClick={() => removeCarousel(sel.id)}>
                  Remover carrossel
                </GhostButton>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card dashed className="mb-7">
        <SectionLabel>
          Slides do carrossel «{sel.name}» (use as setas para reordenar)
        </SectionLabel>
        <p className="-mt-2 mb-4 text-[12px] text-adm-muted">
          Estes slides são do carrossel selecionado acima. Só os slides criados
          aqui aparecem no site. Cada slide tem sua própria mídia (foto ou vídeo
          do YouTube), textos e botão. Sem slides, o carrossel não é exibido.
        </p>

        <div className="flex flex-col gap-4">
          {sel.slides.map((sl, i) => (
            <div
              key={sl.id}
              className="rounded-lg border border-[#e2e2dc] bg-[#fbfbfa] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase text-adm-muted">
                  Slide {i + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <GhostButton onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑
                  </GhostButton>
                  <GhostButton
                    onClick={() => move(i, 1)}
                    disabled={i === sel.slides.length - 1}
                  >
                    ↓
                  </GhostButton>
                  <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Media column */}
                <div>
                  <FieldLabel>Tipo de mídia</FieldLabel>
                  <Select
                    value={sl.mediaType}
                    onChange={(e) =>
                      setSlide(i, { mediaType: e.target.value as MediaType })
                    }
                  >
                    <option value="image">Foto</option>
                    <option value="video">Vídeo (YouTube)</option>
                  </Select>

                  {sl.mediaType === "image" ? (
                    <div className="mt-3">
                      <p className="mb-3 text-[12px] text-adm-muted">
                        Envie a foto de <strong>desktop (16:9)</strong> e a de{" "}
                        <strong>mobile (3:4)</strong>. Cada caixa é exatamente
                        como aparece na tela inicial; <strong>toque/clique na
                        imagem</strong> para escolher o ponto que fica
                        centralizado, e use os botões no canto para trocar ou
                        remover a foto.
                      </p>
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="min-w-[240px] flex-1">
                          <HeroImageField
                            slide={sl}
                            variant="desktop"
                            ratioClass="aspect-video"
                            label="Foto desktop (16:9)"
                            value={sl.image}
                            onChange={(url) => setSlide(i, { image: url })}
                            onFocus={(x, y) => setSlide(i, { focusX: x, focusY: y })}
                            hint="Horizontal, alta qualidade (ideal 2400×1350)."
                            cloudinary={cloudinary}
                          />
                        </div>
                        <div className="w-[170px] flex-none">
                          <HeroImageField
                            slide={sl}
                            variant="mobile"
                            ratioClass="aspect-[3/4]"
                            label="Foto mobile (3:4)"
                            value={sl.imageMobile}
                            onChange={(url) => setSlide(i, { imageMobile: url })}
                            onFocus={(x, y) =>
                              setSlide(i, { focusXm: x, focusYm: y })
                            }
                            hint="Vertical (ideal 1080×1440). Vazio = usa a de desktop."
                            cloudinary={cloudinary}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <FieldLabel>Link do vídeo no YouTube</FieldLabel>
                      <TextInput
                        value={sl.videoUrl ?? ""}
                        onChange={(e) => setSlide(i, { videoUrl: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                      />
                      <div className="mt-3">
                        <FieldLabel>Iniciar com som?</FieldLabel>
                        <Select
                          value={sl.videoStartMuted ? "nao" : "sim"}
                          onChange={(e) =>
                            setSlide(i, {
                              videoStartMuted: e.target.value !== "sim",
                            })
                          }
                        >
                          <option value="nao">Não — começa mudo (recomendado)</option>
                          <option value="sim">Sim — som na 1ª interação</option>
                        </Select>
                        <p className="mt-1.5 text-[12px] text-adm-muted">
                          Navegadores só permitem som após um clique. Há sempre um
                          botão de som sobre o vídeo.
                        </p>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Controles do YouTube</FieldLabel>
                          <Select
                            value={sl.videoControls ? "sim" : "nao"}
                            onChange={(e) =>
                              setSlide(i, {
                                videoControls: e.target.value === "sim",
                              })
                            }
                          >
                            <option value="nao">Ocultar (só o vídeo)</option>
                            <option value="sim">Mostrar (play/pausa, tela cheia, compartilhar, logo)</option>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Legendas</FieldLabel>
                          <Select
                            value={sl.videoCaptions ? "sim" : "nao"}
                            onChange={(e) =>
                              setSlide(i, {
                                videoCaptions: e.target.value === "sim",
                              })
                            }
                          >
                            <option value="nao">Não mostrar</option>
                            <option value="sim">Mostrar legendas</option>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text column */}
                <div className="flex flex-col gap-3">
                  <div>
                    <FieldLabel>Selo (linha superior)</FieldLabel>
                    <TextInput
                      value={sl.subtitle ?? ""}
                      onChange={(e) => setSlide(i, { subtitle: e.target.value })}
                      placeholder="14 SET 2026 · RIO DE JANEIRO"
                    />
                  </div>
                  <div>
                    <FieldLabel>Título de destaque</FieldLabel>
                    <TextInput
                      value={sl.title}
                      onChange={(e) => setSlide(i, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Exibir botão no slide?</FieldLabel>
                    <Select
                      value={sl.ctaEnabled === false ? "nao" : "sim"}
                      onChange={(e) =>
                        setSlide(i, { ctaEnabled: e.target.value === "sim" })
                      }
                    >
                      <option value="sim">Sim, mostrar botão</option>
                      <option value="nao">Não, sem botão</option>
                    </Select>
                  </div>
                  {sl.ctaEnabled !== false && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Texto do botão</FieldLabel>
                        <TextInput
                          value={sl.ctaLabel}
                          onChange={(e) => setSlide(i, { ctaLabel: e.target.value })}
                        />
                      </div>
                      <div>
                        <FieldLabel>Destino do botão</FieldLabel>
                        <TextInput
                          value={sl.ctaUrl}
                          onChange={(e) => setSlide(i, { ctaUrl: e.target.value })}
                          placeholder="#inscricao"
                        />
                      </div>
                      <div>
                        <FieldLabel>Posição do botão</FieldLabel>
                        <Select
                          value={sl.ctaAlign === "right" ? "right" : "left"}
                          onChange={(e) =>
                            setSlide(i, {
                              ctaAlign: e.target.value as "left" | "right",
                            })
                          }
                        >
                          <option value="left">Esquerda</option>
                          <option value="right">Direita</option>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Estilo do botão</FieldLabel>
                        <Select
                          value={sl.ctaVariant === "transparent" ? "transparent" : "solid"}
                          onChange={(e) =>
                            setSlide(i, {
                              ctaVariant: e.target.value as "solid" | "transparent",
                            })
                          }
                        >
                          <option value="solid">Colorido (dourado sólido)</option>
                          <option value="transparent">Transparente (dourado translúcido)</option>
                        </Select>
                      </div>
                    </div>
                  )}
                  {sl.ctaEnabled === false && (
                    <div>
                      <FieldLabel>Link ao clicar no banner (opcional)</FieldLabel>
                      <TextInput
                        value={sl.slideLink ?? ""}
                        onChange={(e) => setSlide(i, { slideLink: e.target.value })}
                        placeholder="https://... ou #inscricao (vazio = banner sem clique)"
                      />
                    </div>
                  )}
                </div>
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

      <Card dashed className="mb-7">
        <SectionLabel>Configurações gerais do carrossel</SectionLabel>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel>Duração por slide (segundos)</FieldLabel>
            <TextInput
              type="number"
              min={2}
              max={30}
              value={sel.slideDurationSeconds}
              onChange={(e) =>
                patchSel({ slideDurationSeconds: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <FieldLabel>Reduzir movimento (acessibilidade)</FieldLabel>
            <Select
              value={sel.reduceMotion ? "sim" : "nao"}
              onChange={(e) => patchSel({ reduceMotion: e.target.value === "sim" })}
            >
              <option value="sim">Respeitar preferência do usuário</option>
              <option value="nao">Sempre animar</option>
            </Select>
          </div>
        </div>
      </Card>


      <SaveBar
        onSave={() =>
          save(
            {
              heroCarousels: carousels,
              // Mirror the default carousel into `hero` for the image preload and
              // legacy readers.
              hero: heroOf(defaultCarousel(carousels)),
            },
            "Atualizou os carrosséis do banner",
          )
        }
      />
    </>
  );
}

export default function BannerPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <BannerForm
      initialCarousels={carouselsOf(content)}
      editionLabel={`${content.event.brandName} ${content.event.editionYear}`}
      cloudinary={content.cloudinary}
    />
  );
}
