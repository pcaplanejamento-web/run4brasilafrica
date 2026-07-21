import type { CSSProperties, ReactNode } from "react";
import type {
  Album,
  CustomBlock,
  CustomSection,
  EventInfo,
  GalleryConfig,
  GalleryPhoto,
  Inscricao,
  Lote,
} from "@/lib/content/types";
import { isSectionKind, sectionDefaults } from "@/lib/content/sectionKinds";
import SectionEyebrow from "./SectionEyebrow";
import CtaButton from "./CtaButton";
import YouTubePlayer from "./YouTubePlayer";
import { youtubeId, isVerticalYouTube } from "@/lib/youtube";
import NotifyForm from "./NotifyForm";
import CustomCarousel from "./CustomCarousel";
// Section components reused verbatim by `secao` blocks (zero regression).
import StatsBar from "./StatsBar";
import Playlist from "./Playlist";
import Percurso from "./Percurso";
import Localizacao from "./Localizacao";
import RaceDay from "./RaceDay";
import InscricaoCTA from "./InscricaoCTA";
import Galeria from "./Galeria";
import Parceiros from "./Parceiros";
import SejaParceiro from "./SejaParceiro";
import Depoimentos from "./Depoimentos";
import Faq from "./Faq";
import KitAtleta from "./KitAtleta";
import Premiacao from "./Premiacao";
import ShareEvent from "./ShareEvent";

const MEDIA_MAX_VH = 70;

/**
 * Global content a `secao` block may need at render time. Built once in
 * `SiteContent` and passed down. Global-backed kinds (raceday/inscricao/galeria)
 * read straight from here so there's a single source of truth (no duplication).
 */
export interface SectionRenderCtx {
  lotes: Lote[];
  inscricao: Inscricao;
  event: EventInfo;
  gallery?: GalleryConfig;
  albums: Album[];
  galleryTiles: { album: string }[];
  galleryPhotos: GalleryPhoto[];
  /** "Seja um parceiro" CTA só funciona quando aquela seção está ativa. */
  sejaParceiroEnabled: boolean;
  /** "Agora" do servidor (época ms) para o 1º paint dos lotes — o mesmo valor é
   *  reidratado no cliente (sem hydration mismatch) e o SSR já traz o link do
   *  lote aberto (SEO / sem-JS). O cliente refina ao vivo no efeito. */
  nowMs: number;
}

/** Renders a section block (each `SectionKind` is a `CustomBlockType`) by
 *  delegating to its existing site component. Global-backed types read from
 *  `ctx` (single source of truth); the rest use the block's inline data.
 *  `title` (o "Título da aba") é o tópico exibido nas seções que o usam
 *  (raceday/inscricao) — mesma lógica das abas multi-bloco. */
function renderSection(
  block: CustomBlock,
  ctx: SectionRenderCtx,
  title?: string,
): ReactNode {
  switch (block.type) {
    case "stats":
      return <StatsBar stats={block.stats ?? []} />;
    case "faq":
      return <Faq items={block.faq ?? []} />;
    case "depoimentos":
      return <Depoimentos testimonials={block.testimonials ?? []} />;
    case "playlist":
      return <Playlist playlist={block.playlist} />;
    case "percurso":
      return <Percurso percurso={block.percurso ?? sectionDefaults("percurso").percurso!} />;
    case "location":
      return <Localizacao location={block.location} />;
    case "premiacao":
      return <Premiacao premiacao={block.premiacao} />;
    case "sejaParceiro":
      return <SejaParceiro config={block.sejaParceiro ?? {}} />;
    case "compartilhar":
      return <ShareEvent share={block.share} event={ctx.event} />;
    case "kit":
      return <KitAtleta kit={block.kit ?? sectionDefaults("kit").kit!} lotes={ctx.lotes} />;
    case "parceiros":
      return (
        <Parceiros
          sponsors={block.sponsors ?? []}
          showTier={block.sponsorsShowTier}
          subtitle={block.sponsorsSubtitle}
          showCta={(block.sponsorsShowCta ?? false) && ctx.sejaParceiroEnabled}
        />
      );
    case "raceday":
      return (
        <RaceDay
          inscricao={{ ...ctx.inscricao, raceDate: block.raceDate ?? ctx.inscricao.raceDate }}
          title={title}
        />
      );
    case "inscricao":
      return (
        <InscricaoCTA
          inscricao={block.inscricao ?? ctx.inscricao}
          lotes={block.lotes ?? ctx.lotes}
          title={title}
          initialNow={ctx.nowMs}
        />
      );
    case "galeria":
      return (
        <Galeria
          albums={block.albums ?? ctx.albums}
          tiles={ctx.galleryTiles}
          photos={ctx.galleryPhotos}
          gallery={block.gallery ?? ctx.gallery}
        />
      );
    default:
      return null;
  }
}

/** Horizontal alignment of a block within its column: cross-axis for the flex
 *  wrapper (positions the box) + text-align (aligns text lines to match). */
function alignItemsClass(a?: string): string {
  return a === "center" ? "items-center" : a === "right" ? "items-end" : "items-start";
}
function alignTextClass(a?: string): string {
  return a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";
}

/** True when a block has something worth rendering (used to hide empty blocks). */
function hasContent(b: CustomBlock): boolean {
  // Section blocks always "have content" (the component self-hides if empty,
  // e.g. Playlist/Localizacao/RaceDay return null) — same as the old behavior.
  if (isSectionKind(b.type)) return true;
  switch (b.type) {
    case "subtitulo":
    case "texto":
      return !!b.text?.trim();
    case "imagem":
      return !!b.imageUrl?.trim();
    case "video":
      return !!youtubeId(b.videoUrl);
    case "botao":
      return !!(
        b.buttonLabel?.trim() &&
        (b.buttonTarget === "section" ? b.buttonSection : b.buttonUrl?.trim())
      );
    case "carrossel":
      return !!b.images?.some(Boolean);
    case "formulario":
      return true;
    default:
      return false;
  }
}

function Block({ block, ctx }: { block: CustomBlock; ctx: SectionRenderCtx }) {
  // Section components (faq, parceiros, …) delegate to renderSection.
  if (isSectionKind(block.type)) return renderSection(block, ctx);
  switch (block.type) {
    case "subtitulo":
      return (
        <h3 className={`font-display text-[22px] font-bold uppercase leading-tight text-cream md:text-[28px] ${alignTextClass(block.align)}`}>
          {block.text}
        </h3>
      );
    case "texto":
      return (
        <p className={`max-w-2xl whitespace-pre-line text-[15px] leading-[1.7] text-muted-strong md:text-[16px] ${alignTextClass(block.align)}`}>
          {block.text}
        </p>
      );
    case "imagem": {
      // Scale = width as a % of the container (10–100). Below 100 the image is
      // centered. When an aspect ratio is set it's cropped to fit (object-cover);
      // "Automática" keeps the image's natural ratio (never cropped) — ideal for
      // QR codes and logos scaled down.
      const scale = Math.min(100, Math.max(10, Math.round(block.scale ?? 100)));
      return (
        // width (not max-width) so the alignment wrapper can position the box.
        <div className="max-w-full" style={{ width: `${scale}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.imageUrl}
            alt=""
            loading="lazy"
            className="w-full rounded-xl"
            style={{ aspectRatio: block.aspectRatio || undefined, objectFit: "cover" }}
          />
        </div>
      );
    }
    case "video": {
      const id = youtubeId(block.videoUrl)!;
      const aspect = block.aspectRatio || "16/9";
      const [w, h] = aspect.split("/").map((s) => parseFloat(s));
      const portrait = w > 0 && h > 0 && h > w;
      const box: CSSProperties = { aspectRatio: aspect };
      if (portrait) {
        box.maxHeight = `${MEDIA_MAX_VH}vh`;
        box.maxWidth = `calc(${MEDIA_MAX_VH}vh * ${w} / ${h})`;
      }
      return (
        <div className="relative w-full max-w-[820px] overflow-hidden rounded-xl bg-ink-panel" style={box}>
          <YouTubePlayer
            videoId={id}
            vertical={isVerticalYouTube(block.videoUrl)}
            startMuted={block.videoStartMuted !== false}
            clickToPlay={!!block.clickToPlay}
            showControls={!!block.videoControls}
            showCaptions={!!block.videoCaptions}
          />
        </div>
      );
    }
    case "botao": {
      const href =
        block.buttonTarget === "section" && block.buttonSection
          ? `#${block.buttonSection}`
          : block.buttonUrl || "#";
      return (
        <div>
          <CtaButton href={href} size="lg">
            {block.buttonLabel}
          </CtaButton>
        </div>
      );
    }
    case "carrossel":
      return <CustomCarousel images={block.images ?? []} />;
    case "formulario":
      return (
        <div className="max-w-[520px]">
          <NotifyForm />
        </div>
      );
    default:
      return null;
  }
}

/**
 * Wraps a block so it can be aligned horizontally within its column (via the
 * flex cross-axis) and, in a two-column pair, ordered by its position in the
 * ORIGINAL (added) sequence on mobile. `order` reflects the added index; on
 * mobile the columns become `display:contents` so every block is a direct flex
 * item of the row and `order` sorts them into the added order — on desktop the
 * columns are real flex stacks (independent heights, no grid row-locking).
 */
function AlignedBlock({
  block,
  ctx,
  order,
}: {
  block: CustomBlock;
  ctx: SectionRenderCtx;
  order?: number;
}) {
  return (
    <div
      className={`flex flex-col ${alignItemsClass(block.align)}`}
      style={order !== undefined ? { order } : undefined}
    >
      <Block block={block} ctx={ctx} />
    </div>
  );
}

type Segment =
  | { kind: "full"; block: CustomBlock }
  | { kind: "pair"; left: CustomBlock[]; right: CustomBlock[]; all: CustomBlock[] };

/**
 * Group blocks into layout segments: "full" blocks span the whole width; runs of
 * consecutive left/right blocks become a two-column row (left blocks stacked in
 * the left cell, right blocks in the right cell). A full block breaks the run.
 * On mobile every segment collapses to a single stacked column, in reading order.
 */
function layoutSegments(blocks: CustomBlock[]): Segment[] {
  const segs: Segment[] = [];
  let buf: CustomBlock[] = [];
  const flush = () => {
    if (buf.length === 0) return;
    segs.push({
      kind: "pair",
      left: buf.filter((b) => (b.column ?? "full") === "left"),
      right: buf.filter((b) => (b.column ?? "full") === "right"),
      all: buf,
    });
    buf = [];
  };
  for (const b of blocks) {
    if ((b.column ?? "full") === "full") {
      flush();
      segs.push({ kind: "full", block: b });
    } else {
      buf.push(b);
    }
  }
  flush();
  return segs;
}

/**
 * Renders a custom "aba" (section) built in the ADM: the title + its blocks, in
 * order, honoring each block's column (full / left / right). Each block reuses an
 * existing site component. Self-hides when empty.
 */
export default function CustomSectionView({
  section,
  ctx,
}: {
  section: CustomSection;
  ctx: SectionRenderCtx;
}) {
  const blocks = (section.blocks ?? []).filter(hasContent);
  if (!section.title?.trim() && blocks.length === 0) return null;

  // Aba com um único bloco de seção: delega direto ao componente original (sem o
  // wrapper `<section id="aba-…">` nem eyebrow), preservando o markup, o padding
  // e o anchor (#faq, #parceiros, …) idênticos aos de hoje.
  if (blocks.length === 1 && isSectionKind(blocks[0].type)) {
    // Passa o "Título da aba" como tópico (usado por raceday/inscricao) — mesma
    // lógica do eyebrow das abas multi-bloco.
    return <>{renderSection(blocks[0], ctx, section.title)}</>;
  }

  return (
    <section
      id={`aba-${section.id}`}
      className="bg-ink px-5 py-16 sm:px-8 md:px-14 md:py-20"
    >
      {section.title?.trim() && <SectionEyebrow as="h2">{section.title}</SectionEyebrow>}
      {blocks.length > 0 && (
        <div className="mt-8 flex flex-col gap-8">
          {layoutSegments(blocks).map((seg) => {
            if (seg.kind === "full")
              return <AlignedBlock key={seg.block.id} block={seg.block} ctx={ctx} />;
            const bothSides = seg.left.length > 0 && seg.right.length > 0;
            const key = (seg.left[0] ?? seg.right[0]).id;
            if (!bothSides) {
              // One side only → a single column in the added order.
              return (
                <div key={key} className="flex flex-col gap-6">
                  {seg.all.map((b) => (
                    <AlignedBlock key={b.id} block={b} ctx={ctx} />
                  ))}
                </div>
              );
            }
            // Two columns on desktop; on mobile the columns collapse (`contents`)
            // and every block is ordered by its ADDED index so the stack keeps the
            // order they were added, not "all-left-then-all-right".
            return (
              <div
                key={key}
                className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start"
              >
                <div className="contents md:flex md:flex-col md:gap-6">
                  {seg.left.map((b) => (
                    <AlignedBlock key={b.id} block={b} ctx={ctx} order={seg.all.indexOf(b)} />
                  ))}
                </div>
                <div className="contents md:flex md:flex-col md:gap-6">
                  {seg.right.map((b) => (
                    <AlignedBlock key={b.id} block={b} ctx={ctx} order={seg.all.indexOf(b)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
