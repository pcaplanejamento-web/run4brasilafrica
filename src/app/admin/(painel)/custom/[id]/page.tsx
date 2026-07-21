"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/lib/content/store";
import type {
  CustomBlock,
  CustomBlockAlign,
  CustomBlockColumn,
  CustomSection,
  SectionBlock,
  SectionKind,
} from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import { FaqEditor } from "@/components/admin/sections/FaqEditor";
import { StatsEditor } from "@/components/admin/sections/StatsEditor";
import { DepoimentosEditor } from "@/components/admin/sections/DepoimentosEditor";
import { PlaylistEditor } from "@/components/admin/sections/PlaylistEditor";
import { PercursoEditor } from "@/components/admin/sections/PercursoEditor";
import { LocationEditor } from "@/components/admin/sections/LocationEditor";
import { PremiacaoEditor } from "@/components/admin/sections/PremiacaoEditor";
import { ShareEditor } from "@/components/admin/sections/ShareEditor";
import { SejaParceiroEditor } from "@/components/admin/sections/SejaParceiroEditor";
import { ParceirosEditor } from "@/components/admin/sections/ParceirosEditor";
import { KitEditor } from "@/components/admin/sections/KitEditor";
import { SECTION_KIND_LABEL, sectionDefaults } from "@/lib/content/sectionKinds";
import {
  type BlockChoiceValue,
  blockFromChoice,
  blockLabel,
  CONTEUDO_CHOICES,
  SECAO_CHOICES,
  SECTION_KIND_ORDER,
} from "@/lib/content/blockChoices";
import { resolveLayout } from "@/lib/content/sections";
import type { Lote } from "@/lib/content/types";

/** Kinds "globais" — editados nas suas páginas próprias (o bloco é só marcador). */
const GLOBAL_KIND_HINT: Partial<Record<SectionKind, { label: string; href: string }>> = {
  galeria: { label: "Galeria (fotos e álbuns)", href: "/admin/galeria" },
  raceday: { label: "Configurações (dia da corrida)", href: "/admin/configuracoes" },
  inscricao: { label: "Lotes de inscrição", href: "/admin/links" },
};

/** Renders the editor for a `secao` block's chosen kind. */
function SectionFields({
  section,
  set,
  cloudinary,
  lotes,
  sejaAtiva,
}: {
  section?: SectionBlock;
  set: (section: SectionBlock) => void;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
  lotes: Lote[];
  sejaAtiva: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* O tipo é fixado ao adicionar o componente (cada seção é uma escolha
          direta no picker). Só blocos "secao" legados (sem tipo) mostram o
          seletor abaixo para se tornarem válidos. */}
      {!section?.kind && (
        <div className="w-[260px] max-w-full">
          <FieldLabel>Tipo de seção</FieldLabel>
          <Select
            value=""
            onChange={(e) => set(sectionDefaults(e.target.value as SectionKind))}
          >
            <option value="" disabled>
              Escolha…
            </option>
            {SECTION_KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {SECTION_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </div>
      )}
      {section?.kind === "faq" && (
        <FaqEditor value={section.faq} onChange={(faq) => set({ kind: "faq", faq })} />
      )}
      {section?.kind === "stats" && (
        <StatsEditor value={section.stats} onChange={(stats) => set({ kind: "stats", stats })} />
      )}
      {section?.kind === "depoimentos" && (
        <DepoimentosEditor
          value={section.testimonials}
          onChange={(testimonials) => set({ kind: "depoimentos", testimonials })}
          cloudinary={cloudinary}
        />
      )}
      {section?.kind === "playlist" && (
        <PlaylistEditor
          value={section.playlist}
          onChange={(playlist) => set({ kind: "playlist", playlist })}
        />
      )}
      {section?.kind === "percurso" && (
        <PercursoEditor
          value={section.percurso}
          onChange={(percurso) => set({ kind: "percurso", percurso })}
          cloudinary={cloudinary}
        />
      )}
      {section?.kind === "location" && (
        <LocationEditor
          value={section.location}
          onChange={(location) => set({ kind: "location", location })}
        />
      )}
      {section?.kind === "premiacao" && (
        <PremiacaoEditor
          value={section.premiacao}
          onChange={(premiacao) => set({ kind: "premiacao", premiacao })}
        />
      )}
      {section?.kind === "compartilhar" && (
        <ShareEditor
          value={section.share}
          onChange={(share) => set({ kind: "compartilhar", share })}
        />
      )}
      {section?.kind === "sejaParceiro" && (
        <SejaParceiroEditor
          value={section.sejaParceiro}
          onChange={(sejaParceiro) => set({ kind: "sejaParceiro", sejaParceiro })}
        />
      )}
      {section?.kind === "parceiros" && (
        <ParceirosEditor
          value={{
            sponsors: section.sponsors,
            sponsorsShowTier: section.sponsorsShowTier,
            sponsorsSubtitle: section.sponsorsSubtitle,
            sponsorsShowCta: section.sponsorsShowCta,
          }}
          onChange={(v) => set({ kind: "parceiros", ...v })}
          sejaAtiva={sejaAtiva}
          cloudinary={cloudinary}
        />
      )}
      {section?.kind === "kit" && (
        <KitEditor
          value={section.kit}
          onChange={(kit) => set({ kind: "kit", kit })}
          lotes={lotes}
          cloudinary={cloudinary}
        />
      )}
      {section && GLOBAL_KIND_HINT[section.kind] && (
        <div className="rounded-lg border border-adm-border bg-[#faf9f7] p-4 text-[13px] text-adm-muted">
          Esta seção usa o conteúdo global do site. Edite em{" "}
          <Link
            href={GLOBAL_KIND_HINT[section.kind]!.href}
            className="font-semibold text-terracotta underline"
          >
            {GLOBAL_KIND_HINT[section.kind]!.label}
          </Link>
          . Aqui você controla a <strong>posição</strong> e o <strong>ativo/oculto</strong> pela
          Dashboard.
        </div>
      )}
    </div>
  );
}

const ASPECTS = [
  { value: "16/9", label: "16:9" },
  { value: "4/3", label: "4:3" },
  { value: "1/1", label: "1:1" },
  { value: "3/4", label: "3:4" },
  { value: "9/16", label: "9:16" },
];

/** Image display scale (width as a % of the container). */
const SCALES = [100, 75, 60, 50, 40, 30, 25];

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

const COLUMN_OPTIONS: { value: CustomBlockColumn; label: string }[] = [
  { value: "full", label: "Largura total" },
  { value: "left", label: "Esquerda" },
  { value: "right", label: "Direita" },
];

/** Segmented control to place a block full-width or in the left/right column. */
function PositionPicker({
  value,
  onChange,
}: {
  value: CustomBlockColumn;
  onChange: (v: CustomBlockColumn) => void;
}) {
  return (
    <div className="mb-3">
      <FieldLabel>Posição</FieldLabel>
      <div className="inline-flex flex-wrap gap-1.5">
        {COLUMN_OPTIONS.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className="min-h-9 rounded-md border px-3 text-[12px] font-semibold transition-colors"
              style={{
                borderColor: on ? "#c8551f" : "var(--adm-border, #e2ddd2)",
                background: on ? "#fdeee6" : "transparent",
                color: on ? "#c8551f" : "#666",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-adm-muted">
        &ldquo;Esquerda&rdquo; e &ldquo;Direita&rdquo; ficam lado a lado no desktop e empilhados no
        celular. Ex.: vídeo à esquerda, textos e botões à direita.
      </p>
    </div>
  );
}

const ALIGN_OPTIONS: { value: CustomBlockAlign; label: string }[] = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
];

/** Segmented control to align a block left / center / right within its column. */
function AlignPicker({
  value,
  onChange,
}: {
  value: CustomBlockAlign;
  onChange: (v: CustomBlockAlign) => void;
}) {
  return (
    <div className="mb-3">
      <FieldLabel>Alinhamento</FieldLabel>
      <div className="inline-flex flex-wrap gap-1.5">
        {ALIGN_OPTIONS.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className="min-h-9 rounded-md border px-3 text-[12px] font-semibold transition-colors"
              style={{
                borderColor: on ? "#c8551f" : "var(--adm-border, #e2ddd2)",
                background: on ? "#fdeee6" : "transparent",
                color: on ? "#c8551f" : "#666",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-adm-muted">
        Alinha o componente na horizontal (útil ao reduzir a escala da imagem). Vale para a
        largura total e dentro da coluna Esquerda/Direita.
      </p>
    </div>
  );
}

function BlockFields({
  block,
  set,
  cloudinary,
  lotes,
  sejaAtiva,
}: {
  block: CustomBlock;
  set: (patch: Partial<CustomBlock>) => void;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
  lotes: Lote[];
  sejaAtiva: boolean;
}) {
  switch (block.type) {
    case "subtitulo":
      return (
        <TextInput value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} placeholder="Texto do subtítulo" />
      );
    case "texto":
      return (
        <TextArea value={block.text ?? ""} onChange={(e) => set({ text: e.target.value })} rows={4} placeholder="Parágrafo de texto" />
      );
    case "imagem":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_140px]">
          <ImageUpload value={block.imageUrl} onChange={(url) => set({ imageUrl: url })} className="h-40" label="imagem" cloudinary={cloudinary} />
          <div>
            <FieldLabel>Proporção</FieldLabel>
            <Select value={block.aspectRatio ?? ""} onChange={(e) => set({ aspectRatio: e.target.value })}>
              <option value="">Automática</option>
              {ASPECTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Escala (tamanho)</FieldLabel>
            <Select
              value={String(block.scale ?? 100)}
              onChange={(e) => set({ scale: Number(e.target.value) })}
            >
              {SCALES.map((s) => (
                <option key={s} value={s}>
                  {s === 100 ? "100% (largura total)" : `${s}%`}
                </option>
              ))}
            </Select>
          </div>
        </div>
      );
    case "video":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <FieldLabel>Link do YouTube</FieldLabel>
              <TextInput value={block.videoUrl ?? ""} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div>
              <FieldLabel>Proporção</FieldLabel>
              <Select value={block.aspectRatio ?? "16/9"} onChange={(e) => set({ aspectRatio: e.target.value })}>
                {ASPECTS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Exibição</FieldLabel>
              <Select
                value={block.clickToPlay ? "click" : "auto"}
                onChange={(e) => set({ clickToPlay: e.target.value === "click" })}
              >
                <option value="auto">Tocar automático (mudo)</option>
                <option value="click">Clique para começar</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Iniciar com som?</FieldLabel>
              <Select
                value={block.videoStartMuted === false ? "sim" : "nao"}
                onChange={(e) => set({ videoStartMuted: e.target.value !== "sim" })}
              >
                <option value="nao">Não — começa mudo</option>
                <option value="sim">Sim — começa com som</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Controles do YouTube</FieldLabel>
              <Select
                value={block.videoControls ? "sim" : "nao"}
                onChange={(e) => set({ videoControls: e.target.value === "sim" })}
              >
                <option value="nao">Ocultar (só o vídeo)</option>
                <option value="sim">Mostrar (play/pausa, tela cheia, compartilhar, logo)</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Legendas</FieldLabel>
              <Select
                value={block.videoCaptions ? "sim" : "nao"}
                onChange={(e) => set({ videoCaptions: e.target.value === "sim" })}
              >
                <option value="nao">Não mostrar</option>
                <option value="sim">Mostrar legendas</option>
              </Select>
            </div>
          </div>
        </div>
      );
    case "botao":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Texto do botão</FieldLabel>
            <TextInput value={block.buttonLabel ?? ""} onChange={(e) => set({ buttonLabel: e.target.value })} placeholder="Inscreva-se" />
          </div>
          <div>
            <FieldLabel>Link</FieldLabel>
            <TextInput value={block.buttonUrl ?? ""} onChange={(e) => set({ buttonUrl: e.target.value })} placeholder="https://..." />
          </div>
        </div>
      );
    case "carrossel": {
      const images = block.images ?? [];
      const setImg = (i: number, url: string) =>
        set({ images: images.map((im, idx) => (idx === i ? url : im)) });
      return (
        <div className="flex flex-col gap-3">
          {images.map((im, i) => (
            <div key={i} className="grid grid-cols-[1fr_96px] items-center gap-3">
              <ImageUpload value={im} onChange={(url) => setImg(i, url)} className="h-28" label="imagem" cloudinary={cloudinary} />
              <GhostButton onClick={() => set({ images: images.filter((_, idx) => idx !== i) })}>Remover</GhostButton>
            </div>
          ))}
          <div>
            <PrimaryButton onClick={() => set({ images: [...images, ""] })}>+ Adicionar imagem</PrimaryButton>
          </div>
        </div>
      );
    }
    case "formulario":
      return (
        <p className="text-[13px] text-adm-muted">
          Formulário de captura de e-mail (&ldquo;avise-me&rdquo;). Os e-mails aparecem em
          Avisos (e-mails). Sem configuração adicional.
        </p>
      );
    case "secao":
      return (
        <SectionFields
          section={block.section}
          set={(section) => set({ section })}
          cloudinary={cloudinary}
          lotes={lotes}
          sejaAtiva={sejaAtiva}
        />
      );
    default:
      return null;
  }
}

function CustomAbaForm({
  section,
  cloudinary,
}: {
  section: CustomSection;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}) {
  const { save, content } = useContent();
  const [title, setTitle] = useState(section.title);
  const [blocks, setBlocks] = useState<CustomBlock[]>(section.blocks ?? []);
  const [adding, setAdding] = useState<BlockChoiceValue>("texto");

  // Dados globais que alguns blocos `secao` precisam (Parceiros/Kit).
  const lotes = content.lotes ?? [];
  const sejaAtiva = resolveLayout(
    content.layout,
    (content.customSections ?? []).map((s) => s.id),
  ).some(
    (li) =>
      li.enabled && (li.key === "sejaParceiro" || li.key === "custom:sec-sejaParceiro"),
  );

  const setBlock = (i: number, patch: Partial<CustomBlock>) =>
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeBlock = (i: number) => setBlocks((bs) => bs.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const addBlock = () => setBlocks((bs) => [...bs, blockFromChoice(adding, uid())]);

  function onSave() {
    const list = content.customSections ?? [];
    const next = list.map((s) => (s.id === section.id ? { ...s, title, blocks } : s));
    return save({ customSections: next }, `Atualizou a aba "${title || "sem título"}"`);
  }

  return (
    <>
      <PageHeader
        title={`Aba: ${title || "sem título"}`}
        aside={
          <Link href="/admin/dashboard" className="text-[13px] font-semibold text-adm-muted hover:text-adm-ink">
            ← Dashboard
          </Link>
        }
      />

      <div className="flex max-w-[820px] flex-col gap-5">
        <Card>
          <FieldLabel>Título da aba (aparece na tela inicial)</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da seção" />
        </Card>

        {blocks.map((b, i) => (
          <Card key={b.id}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-adm-ink">
                {i + 1}. {blockLabel(b)}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveBlock(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir"
                  className="grid h-9 w-9 place-items-center rounded-md border border-adm-border disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(i, 1)}
                  disabled={i === blocks.length - 1}
                  aria-label="Descer"
                  className="grid h-9 w-9 place-items-center rounded-md border border-adm-border disabled:opacity-30"
                >
                  ↓
                </button>
                <GhostButton onClick={() => removeBlock(i)}>Remover</GhostButton>
              </div>
            </div>
            <PositionPicker
              value={b.column ?? "full"}
              onChange={(column) => setBlock(i, { column })}
            />
            <AlignPicker
              value={b.align ?? "left"}
              onChange={(align) => setBlock(i, { align })}
            />
            <BlockFields
              block={b}
              set={(patch) => setBlock(i, patch)}
              cloudinary={cloudinary}
              lotes={lotes}
              sejaAtiva={sejaAtiva}
            />
          </Card>
        ))}

        <Card>
          <FieldLabel>Adicionar componente</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[240px]">
              <Select value={adding} onChange={(e) => setAdding(e.target.value as BlockChoiceValue)}>
                <optgroup label="Conteúdo">
                  {CONTEUDO_CHOICES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Seções do site">
                  {SECAO_CHOICES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
              </Select>
            </div>
            <PrimaryButton onClick={addBlock}>+ Adicionar</PrimaryButton>
          </div>
          {blocks.length === 0 && (
            <p className="mt-2 text-[12px] text-adm-muted">Esta aba ainda não tem componentes.</p>
          )}
        </Card>
      </div>

      <div className="max-w-[820px]">
        <SaveBar onSave={onSave} />
      </div>
    </>
  );
}

export default function CustomAbaPage() {
  const params = useParams<{ id: string }>();
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  const section = (content.customSections ?? []).find((s) => s.id === params.id);
  if (!section) {
    return (
      <div className="text-[14px] text-adm-muted">
        Aba não encontrada. <Link href="/admin/dashboard" className="text-terracotta underline">Voltar ao Dashboard</Link>.
      </div>
    );
  }
  // Key by id so navigating between abas remounts the form with fresh state
  // (never carries one aba's unsaved edits into another).
  return <CustomAbaForm key={section.id} section={section} cloudinary={content.cloudinary} />;
}
