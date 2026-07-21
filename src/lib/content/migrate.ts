import type {
  AboutSection,
  CustomBlock,
  CustomSection,
  FaqItem,
  KitSection,
  LayoutItem,
  LocationSection,
  Percurso,
  PlaylistSection,
  PremiacaoSection,
  SectionKind,
  SejaParceiroSection,
  ShareSection,
  SiteContent,
  Sponsor,
  Stat,
  Testimonial,
} from "./types";
import { customKey } from "./sections";

/**
 * Legacy nested "seção pronta" shape (pre-flatten: `{ type:"secao", section }`).
 * Kept only to read blocks stored by earlier deploys and flatten them in place.
 */
type LegacySectionBlock =
  | { kind: "stats"; stats: Stat[] }
  | { kind: "faq"; faq: FaqItem[] }
  | { kind: "depoimentos"; testimonials: Testimonial[] }
  | { kind: "playlist"; playlist: PlaylistSection }
  | { kind: "percurso"; percurso: Percurso }
  | { kind: "location"; location: LocationSection }
  | { kind: "premiacao"; premiacao: PremiacaoSection }
  | { kind: "sejaParceiro"; sejaParceiro: SejaParceiroSection }
  | { kind: "compartilhar"; share: ShareSection }
  | { kind: "kit"; kit: KitSection }
  | {
      kind: "parceiros";
      sponsors: Sponsor[];
      sponsorsShowTier?: boolean;
      sponsorsSubtitle?: string;
      sponsorsShowCta?: boolean;
    }
  | { kind: "raceday" }
  | { kind: "inscricao" }
  | { kind: "galeria" };

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
 * bloco do tipo `kind` (componente de seção). Determinística e idempotente.
 */
interface SectionMigration {
  /** Chave da seção no layout (ex.: "faq"). */
  key: string;
  /** Id determinístico da aba (ex.: "sec-faq"). */
  id: string;
  /** Tipo do bloco de seção (= CustomBlockType). */
  kind: SectionKind;
  title: (c: SiteContent) => string;
  /** Só cria a aba quando há conteúdo (evita aba vazia). */
  hasContent: (c: SiteContent) => boolean;
  /** Dados da seção mesclados no bloco (flat). Marcadores retornam {}. */
  build: (c: SiteContent) => Partial<CustomBlock>;
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
    kind: "faq",
    title: () => "Perguntas frequentes",
    hasContent: (c) => (c.faq ?? []).length > 0,
    build: (c) => ({ faq: c.faq ?? [] }),
    fallbackAfter: "kit",
  },
  {
    key: "depoimentos",
    id: "sec-depoimentos",
    kind: "depoimentos",
    title: () => "Quem já correu",
    hasContent: (c) => (c.testimonials ?? []).length > 0,
    build: (c) => ({ testimonials: c.testimonials ?? [] }),
    fallbackAfter: "galeria",
  },
  {
    key: "stats",
    id: "sec-stats",
    kind: "stats",
    title: () => "Números em destaque",
    hasContent: (c) => (c.stats ?? []).length > 0,
    build: (c) => ({ stats: c.stats ?? [] }),
    fallbackAfter: "hero",
  },
  {
    key: "playlist",
    id: "sec-playlist",
    kind: "playlist",
    title: (c) => c.playlist?.title?.trim() || "Playlist do evento",
    hasContent: (c) =>
      !!(
        c.playlist?.title?.trim() ||
        c.playlist?.note?.trim() ||
        c.playlist?.youtubeUrl?.trim() ||
        c.playlist?.spotifyUrl?.trim()
      ),
    build: (c) => ({ playlist: c.playlist ?? {} }),
    fallbackAfter: "hero",
  },
  {
    key: "percurso",
    id: "sec-percurso",
    kind: "percurso",
    title: () => "O Percurso",
    hasContent: (c) =>
      !!(c.percurso?.title?.trim() || (c.percurso?.routes ?? []).length || c.percurso?.stravaRouteRef?.trim()),
    build: (c) => ({ percurso: c.percurso }),
    fallbackAfter: "playlist",
  },
  {
    key: "location",
    id: "sec-location",
    kind: "location",
    title: (c) => c.location?.title?.trim() || "Localização",
    hasContent: (c) => !!(c.location?.address?.trim() || c.location?.venueName?.trim()),
    build: (c) => ({ location: c.location ?? {} }),
    fallbackAfter: "percurso",
  },
  {
    key: "premiacao",
    id: "sec-premiacao",
    kind: "premiacao",
    title: (c) => c.premiacao?.title?.trim() || "Premiação",
    hasContent: (c) => (c.premiacao?.places ?? []).length > 0,
    build: (c) => ({ premiacao: c.premiacao }),
    fallbackAfter: "galeria",
  },
  {
    key: "sejaParceiro",
    id: "sec-sejaParceiro",
    kind: "sejaParceiro",
    title: (c) => c.sejaParceiro?.title?.trim() || "Seja um Parceiro",
    hasContent: () => true,
    build: (c) => ({ sejaParceiro: c.sejaParceiro ?? {} }),
    fallbackAfter: "parceiros",
  },
  {
    key: "compartilhar",
    id: "sec-compartilhar",
    kind: "compartilhar",
    title: (c) => c.share?.title?.trim() || "Compartilhar",
    hasContent: () => true,
    build: (c) => ({ share: c.share ?? {} }),
    fallbackAfter: "kit",
  },
  {
    key: "parceiros",
    id: "sec-parceiros",
    kind: "parceiros",
    title: () => "Parceiros",
    hasContent: (c) => (c.sponsors ?? []).length > 0,
    build: (c) => ({
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
    kind: "kit",
    title: (c) => c.kit?.title?.trim() || "Kit do atleta",
    hasContent: () => true,
    build: (c) => ({ kit: c.kit }),
    fallbackAfter: "compartilhar",
  },
  {
    key: "galeria",
    id: "sec-galeria",
    kind: "galeria",
    title: () => "Galeria",
    hasContent: (c) => (c.galleryPhotos ?? []).length > 0 || (c.albums ?? []).length > 0,
    build: (c) => ({ gallery: c.gallery ?? {}, albums: c.albums ?? [] }),
    fallbackAfter: "inscricao",
  },
  {
    key: "raceday",
    id: "sec-raceday",
    kind: "raceday",
    title: () => "Dia da Corrida",
    hasContent: (c) => !!c.inscricao?.raceDate,
    build: (c) => ({ raceDate: c.inscricao?.raceDate ?? "" }),
    fallbackAfter: "inscricao",
  },
  {
    key: "inscricao",
    id: "sec-inscricao",
    kind: "inscricao",
    title: () => "Inscrições e Lotes",
    hasContent: () => true,
    build: (c) => ({ inscricao: c.inscricao, lotes: c.lotes ?? [] }),
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

  const block: CustomBlock = { id: `${m.id}-b`, type: m.kind, ...m.build(c) };
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

/** Achata um bloco `secao` legado (`{type,section:{kind,...}}`) no novo formato
 *  flat (`{type: kind, ...dados}`). Marcadores não têm dado. */
function flattenLegacyBlock(block: CustomBlock): CustomBlock | null {
  const legacy = block as CustomBlock & { section?: LegacySectionBlock };
  const sb = legacy.section;
  if (!sb) return null; // secao sem seção (nunca renderizou) → descarta
  // Mantém id/column/align e adiciona os dados da seção sob o tipo `kind`.
  const base: CustomBlock = {
    id: block.id,
    type: sb.kind,
    column: block.column,
    align: block.align,
  };
  switch (sb.kind) {
    case "stats":
      return { ...base, stats: sb.stats };
    case "faq":
      return { ...base, faq: sb.faq };
    case "depoimentos":
      return { ...base, testimonials: sb.testimonials };
    case "playlist":
      return { ...base, playlist: sb.playlist };
    case "percurso":
      return { ...base, percurso: sb.percurso };
    case "location":
      return { ...base, location: sb.location };
    case "premiacao":
      return { ...base, premiacao: sb.premiacao };
    case "sejaParceiro":
      return { ...base, sejaParceiro: sb.sejaParceiro };
    case "compartilhar":
      return { ...base, share: sb.share };
    case "kit":
      return { ...base, kit: sb.kit };
    case "parceiros":
      return {
        ...base,
        sponsors: sb.sponsors,
        sponsorsShowTier: sb.sponsorsShowTier,
        sponsorsSubtitle: sb.sponsorsSubtitle,
        sponsorsShowCta: sb.sponsorsShowCta,
      };
    case "raceday":
    case "inscricao":
    case "galeria":
      return base;
  }
}

/**
 * Converte blocos `secao` já gravados no D1 (deploys anteriores) para o formato
 * flat (cada seção é um `CustomBlockType`). Idempotente: blocos já flat não têm
 * `type === "secao"`, então viram no-op. Nada se perde — os dados da seção são
 * preservados no bloco.
 */
function flattenLegacySecao(c: SiteContent): SiteContent {
  const secs = c.customSections;
  if (!secs?.length) return c;
  let changed = false;
  const next = secs.map((s) => {
    const blocks = (s.blocks ?? []).flatMap((b) => {
      if ((b.type as string) !== "secao") return [b];
      changed = true;
      const flat = flattenLegacyBlock(b);
      return flat ? [flat] : [];
    });
    return changed ? { ...s, blocks } : s;
  });
  return changed ? { ...c, customSections: next } : c;
}

/**
 * Preenche os dados dos blocos de seção **autocontida global** (galeria /
 * inscricao / raceday) a partir do conteúdo global, quando o bloco ainda não os
 * tem (marcadores criados por deploys anteriores). Idempotente: só preenche
 * campos ausentes (`undefined`), então uma vez preenchidos vira no-op — o bloco
 * passa a ser a fonte de verdade.
 */
function backfillSectionData(c: SiteContent): SiteContent {
  const secs = c.customSections;
  if (!secs?.length) return c;
  let changed = false;
  const next = secs.map((s) => {
    const blocks = (s.blocks ?? []).map((b) => {
      if (b.type === "galeria" && b.albums === undefined && b.gallery === undefined) {
        changed = true;
        return { ...b, gallery: c.gallery ?? {}, albums: c.albums ?? [] };
      }
      if (b.type === "inscricao" && b.inscricao === undefined && b.lotes === undefined) {
        changed = true;
        return { ...b, inscricao: c.inscricao, lotes: c.lotes ?? [] };
      }
      if (b.type === "raceday" && b.raceDate === undefined) {
        changed = true;
        return { ...b, raceDate: c.inscricao?.raceDate ?? "" };
      }
      return b;
    });
    return blocks === s.blocks ? s : { ...s, blocks };
  });
  return changed ? { ...c, customSections: next } : c;
}

/**
 * Espelha os dados dos blocos autocontidos globais de volta para os campos
 * top-level (`content.inscricao`, `content.lotes`, `content.gallery`,
 * `content.albums`). O **bloco é a fonte**; o global é uma cópia derivada para os
 * consumidores legados que leem o topo — `RaceCountdownBar`, `EventJsonLd`,
 * `/api/agenda` e o `SectionRenderCtx` — seguirem corretos sem alteração. Usa o
 * primeiro bloco de cada tipo encontrado nas abas.
 */
function syncGlobalsFromBlocks(c: SiteContent): SiteContent {
  const blocks = (c.customSections ?? []).flatMap((s) => s.blocks ?? []);
  const insc = blocks.find((b) => b.type === "inscricao");
  const race = blocks.find((b) => b.type === "raceday");
  const gal = blocks.find((b) => b.type === "galeria");
  if (!insc && !race && !gal) return c;

  let inscricao = c.inscricao;
  let lotes = c.lotes;
  if (insc?.inscricao) inscricao = insc.inscricao;
  if (insc?.lotes) lotes = insc.lotes;
  // A "Dia da Corrida" é a dona da data exibida (banner + barra fixa + SEO).
  if (race && race.raceDate !== undefined) {
    inscricao = { ...inscricao, raceDate: race.raceDate };
  }
  return {
    ...c,
    inscricao,
    lotes,
    ...(gal?.gallery !== undefined ? { gallery: gal.gallery } : {}),
    ...(gal?.albums !== undefined ? { albums: gal.albums } : {}),
  };
}

/**
 * Normalização idempotente aplicada a cada leitura (db.ts): converte seções
 * built-in em abas editáveis, achata blocos `secao` legados, preenche os blocos
 * autocontidos globais e espelha-os de volta ao topo. Pura (retorna novo objeto,
 * nunca muta).
 */
export function normalizeContent(c: SiteContent): SiteContent {
  let out = applyAbout(c);
  for (const m of SECTION_MIGRATIONS) out = applyMigration(out, m);
  out = flattenLegacySecao(out);
  out = backfillSectionData(out);
  out = syncGlobalsFromBlocks(out);
  return out;
}
