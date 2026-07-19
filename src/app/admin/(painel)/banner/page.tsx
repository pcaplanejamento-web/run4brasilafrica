"use client";

import { useRef, useState } from "react";
import { useContent } from "@/lib/content/store";
import type { AboutSection, Hero, HeroSlide, MediaType } from "@/lib/content/types";
import HeroMedia from "@/components/site/HeroMedia";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

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
    ctaAlign: s.ctaAlign === "right" ? "right" : "left",
    ctaVariant: s.ctaVariant === "transparent" ? "transparent" : "solid",
    videoControls: s.videoControls,
    videoCaptions: s.videoCaptions,
  };
}

/**
 * Interactive framing preview: shows the slide's image in the target ratio
 * (desktop 16:9 / mobile 3:4) exactly like the public banner, and clicking sets
 * the focal point (object-position) — the same value the live site uses.
 */
function FocusPicker({
  slide,
  variant,
  ratioClass,
  label,
  onPick,
}: {
  slide: HeroSlide;
  variant: "desktop" | "mobile";
  ratioClass: string;
  label: string;
  onPick: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fx = variant === "desktop" ? slide.focusX ?? 50 : slide.focusXm ?? 50;
  const fy = variant === "desktop" ? slide.focusY ?? 50 : slide.focusYm ?? 50;
  const pick = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100)));
    onPick(x, y);
  };
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`${label} — clique para definir o ponto de foco`}
        onClick={(e) => pick(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) pick(t.clientX, t.clientY);
        }}
        className={`relative ${ratioClass} w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg border border-adm-border bg-[#1a1400]`}
      >
        <HeroMedia slide={slide} variant={variant} />
        <span
          className="pointer-events-none absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.5)]"
          style={{ left: `${fx}%`, top: `${fy}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-adm-muted">
        Toque/clique para escolher o que fica centralizado ({fx}% · {fy}%).
      </p>
    </div>
  );
}

const ASPECT_OPTIONS = [
  { value: "4/3", label: "4:3 (paisagem)" },
  { value: "16/9", label: "16:9 (widescreen)" },
  { value: "1/1", label: "1:1 (quadrado)" },
  { value: "3/4", label: "3:4 (retrato)" },
  { value: "9/16", label: "9:16 (Reels)" },
  { value: "21/9", label: "21:9 (cinema)" },
];

function BannerForm({
  initialHero,
  initialAbout,
  editionLabel,
  cloudinary,
}: {
  initialHero: Hero;
  initialAbout: AboutSection;
  editionLabel: string;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}) {
  const { save } = useContent();
  const [hero, setHero] = useState<Hero>({
    ...initialHero,
    slides: (initialHero.slides ?? []).map(normalizeSlide),
  });
  const [about, setAbout] = useState<AboutSection>(initialAbout);

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
      slides: [
        ...h.slides,
        {
          id: `slide-${Date.now()}`,
          mediaType: "image",
          videoStartMuted: true,
          title: "Novo slide",
          subtitle: "",
          ctaLabel: "Inscreva-se",
          ctaUrl: "#inscricao",
        },
      ],
    }));
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Gestão do Banner / Hero</PageTitle>
        <span className="text-[13px] text-[#777]">Edição: {editionLabel}</span>
      </div>

      <Card dashed className="mb-7">
        <SectionLabel>Slides do carrossel (use as setas para reordenar)</SectionLabel>
        <p className="-mt-2 mb-4 text-[12px] text-adm-muted">
          Só os slides criados aqui aparecem no site. Cada slide tem sua própria
          mídia (foto ou vídeo do YouTube), textos e botão. Sem slides, o banner
          não é exibido.
        </p>

        <div className="flex flex-col gap-4">
          {hero.slides.map((sl, i) => (
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
                    disabled={i === hero.slides.length - 1}
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
                    <div className="mt-3 flex flex-col gap-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Foto desktop (16:9)</FieldLabel>
                          <ImageUpload
                            value={sl.image}
                            onChange={(url) => setSlide(i, { image: url })}
                            className="h-32"
                            label="foto desktop"
                            cloudinary={cloudinary}
                          />
                          <p className="mt-1.5 text-[12px] text-adm-muted">
                            Horizontal, alta qualidade (ideal 2400×1350).
                          </p>
                        </div>
                        <div>
                          <FieldLabel>Foto mobile (3:4)</FieldLabel>
                          <ImageUpload
                            value={sl.imageMobile}
                            onChange={(url) => setSlide(i, { imageMobile: url })}
                            className="h-32"
                            label="foto mobile"
                            cloudinary={cloudinary}
                          />
                          <p className="mt-1.5 text-[12px] text-adm-muted">
                            Vertical (ideal 1080×1440). Vazio = usa a de desktop.
                          </p>
                        </div>
                      </div>

                      <div>
                        <SectionLabel>Pré-visualização e enquadramento</SectionLabel>
                        <p className="-mt-2 mb-3 text-[12px] text-adm-muted">
                          É exatamente como aparece na tela inicial. Toque/clique na imagem
                          para escolher o ponto que fica centralizado em cada tela.
                        </p>
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="min-w-[240px] flex-1">
                            <FocusPicker
                              slide={sl}
                              variant="desktop"
                              ratioClass="aspect-video"
                              label="Desktop (16:9)"
                              onPick={(x, y) => setSlide(i, { focusX: x, focusY: y })}
                            />
                          </div>
                          <div className="w-[150px] flex-none">
                            <FocusPicker
                              slide={sl}
                              variant="mobile"
                              ratioClass="aspect-[3/4]"
                              label="Mobile (3:4)"
                              onPick={(x, y) => setSlide(i, { focusXm: x, focusYm: y })}
                            />
                          </div>
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

      {/* ---- A Causa (Sobre) ---- */}
      <Card dashed>
        <SectionLabel>Seção &quot;A Causa&quot;</SectionLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Text column */}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Linha superior (selo)</FieldLabel>
              <TextInput
                value={about.eyebrow}
                onChange={(e) => setAbout({ ...about, eyebrow: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Título</FieldLabel>
              <TextInput
                value={about.title}
                onChange={(e) => setAbout({ ...about, title: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Texto</FieldLabel>
              <TextArea
                rows={4}
                value={about.body}
                onChange={(e) => setAbout({ ...about, body: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Texto do botão</FieldLabel>
                <TextInput
                  value={about.linkLabel}
                  onChange={(e) =>
                    setAbout({ ...about, linkLabel: e.target.value })
                  }
                />
              </div>
              <div>
                <FieldLabel>Destino do botão</FieldLabel>
                <TextInput
                  value={about.linkUrl ?? ""}
                  onChange={(e) => setAbout({ ...about, linkUrl: e.target.value })}
                  placeholder="#parceiros"
                />
              </div>
            </div>
          </div>

          {/* Media column */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Tipo de mídia</FieldLabel>
                <Select
                  value={about.mediaType ?? "image"}
                  onChange={(e) =>
                    setAbout({ ...about, mediaType: e.target.value as MediaType })
                  }
                >
                  <option value="image">Foto</option>
                  <option value="video">Vídeo (YouTube)</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Proporção</FieldLabel>
                <Select
                  value={about.aspectRatio ?? "4/3"}
                  onChange={(e) =>
                    setAbout({ ...about, aspectRatio: e.target.value })
                  }
                >
                  {ASPECT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {about.mediaType === "video" ? (
              <>
                <div>
                  <FieldLabel>Link do vídeo no YouTube</FieldLabel>
                  <TextInput
                    value={about.videoUrl ?? ""}
                    onChange={(e) =>
                      setAbout({ ...about, videoUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Exibição</FieldLabel>
                    <Select
                      value={about.clickToPlay ? "click" : "auto"}
                      onChange={(e) =>
                        setAbout({
                          ...about,
                          clickToPlay: e.target.value === "click",
                        })
                      }
                    >
                      <option value="auto">Tocar automático (mudo)</option>
                      <option value="click">Clique para começar</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Iniciar com som?</FieldLabel>
                    <Select
                      value={about.videoStartMuted === false ? "sim" : "nao"}
                      onChange={(e) =>
                        setAbout({
                          ...about,
                          videoStartMuted: e.target.value !== "sim",
                        })
                      }
                    >
                      <option value="nao">Não — começa mudo</option>
                      <option value="sim">Sim — som ao interagir</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Controles do YouTube</FieldLabel>
                    <Select
                      value={about.videoControls ? "sim" : "nao"}
                      onChange={(e) =>
                        setAbout({
                          ...about,
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
                      value={about.videoCaptions ? "sim" : "nao"}
                      onChange={(e) =>
                        setAbout({
                          ...about,
                          videoCaptions: e.target.value === "sim",
                        })
                      }
                    >
                      <option value="nao">Não mostrar</option>
                      <option value="sim">Mostrar legendas</option>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <FieldLabel>Foto</FieldLabel>
                <ImageUpload
                  value={about.image}
                  onChange={(url) => setAbout({ ...about, image: url })}
                  className="h-44"
                  label="foto da causa"
                  cloudinary={cloudinary}
                />
                <p className="mt-1.5 text-[12px] text-adm-muted">
                  A imagem se adapta à proporção escolhida (preenche cobrindo).
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <SaveBar
        onSave={() => save({ hero, about }, "Atualizou o banner / hero e a seção A Causa")}
      />
    </>
  );
}

export default function BannerPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <BannerForm
      initialHero={content.hero}
      initialAbout={content.about}
      editionLabel={`${content.event.brandName} ${content.event.editionYear}`}
      cloudinary={content.cloudinary}
    />
  );
}
