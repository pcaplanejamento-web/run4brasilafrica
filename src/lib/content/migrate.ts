import type {
  AboutSection,
  CustomBlock,
  CustomSection,
  LayoutItem,
  SectionBlock,
  SiteContent,
} from "./types";
import { customKey } from "./sections";

/**
 * Fixed id of the "A Causa" section once it becomes a custom "aba". Deterministic
 * so the migration is idempotent (re-deriving it every read yields the same aba).
 */
export const A_CAUSA_ID = "a-causa";

function aboutHasContent(a?: AboutSection): boolean {
  if (!a) return false;
  return !!(
    a.eyebrow?.trim() ||
    a.title?.trim() ||
    a.body?.trim() ||
    a.image?.trim() ||
    a.videoUrl?.trim()
  );
}

/**
 * Build the "A Causa" aba from the legacy `about` section, mirroring the original
 * `Sobre` layout: media on the LEFT column, text (title + body + button) on the
 * RIGHT — media first in the added order so it stacks first on mobile (as `Sobre`
 * did). All video controls are carried over 1:1.
 */
function aboutToAba(a: AboutSection): CustomSection {
  const blocks: CustomBlock[] = [];
  const isVideo = a.mediaType === "video" && !!a.videoUrl?.trim();
  const isImage = a.mediaType !== "video" && !!a.image?.trim();

  if (isVideo) {
    blocks.push({
      id: `${A_CAUSA_ID}-media`,
      type: "video",
      column: "left",
      align: "center",
      videoUrl: a.videoUrl,
      aspectRatio: a.aspectRatio,
      videoStartMuted: a.videoStartMuted,
      clickToPlay: a.clickToPlay,
      videoControls: a.videoControls,
      videoCaptions: a.videoCaptions,
    });
  } else if (isImage) {
    blocks.push({
      id: `${A_CAUSA_ID}-media`,
      type: "imagem",
      column: "left",
      align: "center",
      imageUrl: a.image,
      aspectRatio: a.aspectRatio,
    });
  }
  if (a.title?.trim())
    blocks.push({ id: `${A_CAUSA_ID}-title`, type: "subtitulo", column: "right", text: a.title });
  if (a.body?.trim())
    blocks.push({ id: `${A_CAUSA_ID}-body`, type: "texto", column: "right", text: a.body });
  if (a.linkLabel?.trim())
    blocks.push({
      id: `${A_CAUSA_ID}-btn`,
      type: "botao",
      column: "right",
      buttonLabel: a.linkLabel,
      buttonUrl: a.linkUrl || "#parceiros",
    });

  return { id: A_CAUSA_ID, title: a.eyebrow || "A Causa", blocks };
}

/**
 * One-time, idempotent migration: turns the built-in "A Causa" (`about`) into a
 * custom **aba** with the full block/alignment/video-control toolset. Runs on
 * every content read (pure — returns a new object, never mutates):
 *  - if a `${A_CAUSA_ID}` aba already exists, nothing changes;
 *  - otherwise the `about` content is converted to an aba and inserted into the
 *    layout **where `about` was** (or right after `stats`), keeping its position.
 * The legacy `about` field is left untouched (ignored once the aba exists), so
 * nothing is ever lost.
 */
function applyAbout(c: SiteContent): SiteContent {
  const secs = c.customSections ?? [];
  if (secs.some((s) => s.id === A_CAUSA_ID)) return c;
  if (!aboutHasContent(c.about)) return c;

  const aba = aboutToAba(c.about!);
  const key = customKey(A_CAUSA_ID);
  const layout: LayoutItem[] = (c.layout ?? []).slice();
  const aboutIdx = layout.findIndex((li) => li.key === "about");
  if (aboutIdx >= 0) {
    layout.splice(aboutIdx, 1, { key, enabled: layout[aboutIdx].enabled });
  } else {
    const statsIdx = layout.findIndex((li) => li.key === "stats");
    layout.splice(statsIdx >= 0 ? statsIdx + 1 : layout.length, 0, { key, enabled: true });
  }

  return { ...c, customSections: [aba, ...secs], layout };
}

/**
 * Uma seção built-in que vira aba: chave de layout `key` → aba `id` com um único
 * bloco `secao`. Determinística e idempotente (mesmo `id` a cada leitura).
 */
interface SectionMigration {
  /** Chave da seção no layout (ex.: "faq"). */
  key: string;
  /** Id determinístico da aba (ex.: "sec-faq"). */
  id: string;
  title: (c: SiteContent) => string;
  /** Só cria a aba quando há conteúdo (evita aba vazia). */
  hasContent: (c: SiteContent) => boolean;
  /** Payload do bloco `secao`. */
  build: (c: SiteContent) => SectionBlock;
  /** Posição natural quando a chave não está no layout (seed sem a chave). */
  fallbackAfter?: string;
}

/**
 * Registro das seções convertidas em abas. Adicionar uma entrada aqui + remover a
 * chave de `SECTIONS` (sections.ts) + remover a entrada do mapa `rendered`
 * (SiteContent.tsx) — as três juntas, no mesmo deploy, para não renderizar duas
 * vezes. Campos top-level (`c.faq`, `c.stats`, ...) ficam intactos: nada se perde.
 */
const SECTION_MIGRATIONS: SectionMigration[] = [
  {
    key: "faq",
    id: "sec-faq",
    title: () => "Perguntas frequentes",
    hasContent: (c) => (c.faq ?? []).length > 0,
    build: (c) => ({ kind: "faq", faq: c.faq ?? [] }),
    fallbackAfter: "kit",
  },
  {
    key: "depoimentos",
    id: "sec-depoimentos",
    title: () => "Quem já correu",
    hasContent: (c) => (c.testimonials ?? []).length > 0,
    build: (c) => ({ kind: "depoimentos", testimonials: c.testimonials ?? [] }),
    fallbackAfter: "galeria",
  },
  {
    key: "stats",
    id: "sec-stats",
    title: () => "Números em destaque",
    hasContent: (c) => (c.stats ?? []).length > 0,
    build: (c) => ({ kind: "stats", stats: c.stats ?? [] }),
    fallbackAfter: "hero",
  },
  {
    key: "playlist",
    id: "sec-playlist",
    title: (c) => c.playlist?.title?.trim() || "Playlist do evento",
    hasContent: (c) =>
      !!(
        c.playlist?.title?.trim() ||
        c.playlist?.note?.trim() ||
        c.playlist?.youtubeUrl?.trim() ||
        c.playlist?.spotifyUrl?.trim()
      ),
    build: (c) => ({ kind: "playlist", playlist: c.playlist ?? {} }),
    fallbackAfter: "hero",
  },
  {
    key: "percurso",
    id: "sec-percurso",
    title: () => "O Percurso",
    hasContent: (c) =>
      !!(c.percurso?.title?.trim() || (c.percurso?.routes ?? []).length || c.percurso?.stravaRouteRef?.trim()),
    build: (c) => ({ kind: "percurso", percurso: c.percurso }),
    fallbackAfter: "playlist",
  },
  {
    key: "location",
    id: "sec-location",
    title: (c) => c.location?.title?.trim() || "Localização",
    hasContent: (c) => !!(c.location?.address?.trim() || c.location?.venueName?.trim()),
    build: (c) => ({ kind: "location", location: c.location ?? {} }),
    fallbackAfter: "percurso",
  },
  {
    key: "premiacao",
    id: "sec-premiacao",
    title: (c) => c.premiacao?.title?.trim() || "Premiação",
    hasContent: (c) => (c.premiacao?.places ?? []).length > 0,
    build: (c) => ({ kind: "premiacao", premiacao: c.premiacao }),
    fallbackAfter: "galeria",
  },
  {
    key: "sejaParceiro",
    id: "sec-sejaParceiro",
    title: (c) => c.sejaParceiro?.title?.trim() || "Seja um Parceiro",
    hasContent: () => true,
    build: (c) => ({ kind: "sejaParceiro", sejaParceiro: c.sejaParceiro ?? {} }),
    fallbackAfter: "parceiros",
  },
  {
    key: "compartilhar",
    id: "sec-compartilhar",
    title: (c) => c.share?.title?.trim() || "Compartilhar",
    hasContent: () => true,
    build: (c) => ({ kind: "compartilhar", share: c.share ?? {} }),
    fallbackAfter: "kit",
  },
  {
    key: "parceiros",
    id: "sec-parceiros",
    title: () => "Parceiros",
    hasContent: (c) => (c.sponsors ?? []).length > 0,
    build: (c) => ({
      kind: "parceiros",
      sponsors: c.sponsors ?? [],
      sponsorsShowTier: c.sponsorsShowTier,
      sponsorsSubtitle: c.sponsorsSubtitle,
      sponsorsShowCta: c.sponsorsShowCta,
    }),
    fallbackAfter: "galeria",
  },
  {
    key: "kit",
    id: "sec-kit",
    title: (c) => c.kit?.title?.trim() || "Kit do atleta",
    hasContent: () => true,
    build: (c) => ({ kind: "kit", kit: c.kit }),
    fallbackAfter: "compartilhar",
  },
  {
    key: "galeria",
    id: "sec-galeria",
    title: () => "Galeria",
    hasContent: (c) => (c.galleryPhotos ?? []).length > 0 || (c.albums ?? []).length > 0,
    build: () => ({ kind: "galeria" }),
    fallbackAfter: "inscricao",
  },
  {
    key: "raceday",
    id: "sec-raceday",
    title: () => "Dia da Corrida",
    hasContent: (c) => !!c.inscricao?.raceDate,
    build: () => ({ kind: "raceday" }),
    fallbackAfter: "inscricao",
  },
  {
    key: "inscricao",
    id: "sec-inscricao",
    title: (c) => c.inscricao?.title?.trim() || "Inscrição",
    hasContent: () => true,
    build: () => ({ kind: "inscricao" }),
    fallbackAfter: "galeria",
  },
];

function applyMigration(c: SiteContent, m: SectionMigration): SiteContent {
  const secs = c.customSections ?? [];
  if (secs.some((s) => s.id === m.id)) return c; // já migrada → no-op

  const layout: LayoutItem[] = (c.layout ?? []).slice();
  const idx = layout.findIndex((li) => li.key === m.key);
  // Migra se a chave já está no layout (preserva posição + enabled) OU se há
  // conteúdo (para instalações onde a chave não está no layout). Assim nunca se
  // perde um slot existente nem se cria aba vazia numa instalação nova.
  if (idx < 0 && !m.hasContent(c)) return c;

  const block: CustomBlock = { id: `${m.id}-b`, type: "secao", section: m.build(c) };
  const aba: CustomSection = { id: m.id, title: m.title(c), blocks: [block] };
  const key = customKey(m.id);
  if (idx >= 0) {
    layout.splice(idx, 1, { key, enabled: layout[idx].enabled }); // troca in-place, preserva enabled
  } else {
    const afterIdx = m.fallbackAfter ? layout.findIndex((li) => li.key === m.fallbackAfter) : -1;
    layout.splice(afterIdx >= 0 ? afterIdx + 1 : layout.length, 0, { key, enabled: true });
  }
  return { ...c, customSections: [...secs, aba], layout };
}

/**
 * Normalização idempotente aplicada a cada leitura (db.ts): converte seções
 * built-in em abas editáveis. Pura (retorna novo objeto, nunca muta). Ordem:
 * "A Causa" primeiro (histórico), depois o registro `SECTION_MIGRATIONS`.
 */
export function normalizeContent(c: SiteContent): SiteContent {
  let out = applyAbout(c);
  for (const m of SECTION_MIGRATIONS) out = applyMigration(out, m);
  return out;
}
