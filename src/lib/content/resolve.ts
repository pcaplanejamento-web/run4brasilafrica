import type {
  AboutSection,
  Analytics,
  Branding,
  Cloudinary,
  ContactLinks,
  EventInfo,
  GalleryConfig,
  Hero,
  HeroCarousel,
  SejaParceiroSection,
  ShareSection,
  SiteContent,
  StoredContent,
  ThemeColors,
} from "./types";
import { editionById } from "./editions";
import { deriveView } from "./migrate";
import { sectionDefaults } from "./sectionKinds";

/** Evento vazio-mas-válido, quando não há edição (lista vazia). */
const EMPTY_EVENT: EventInfo = {
  brandName: "",
  editionYear: "",
  dateLabel: "",
  city: "",
  tagline: "",
};

/**
 * Valores-padrão dos campos-espelho por-edição de `SiteContent`. Uma edição em
 * branco resolve com estes (arrays/objetos vazios) — os campos-espelho de fato
 * exibidos (`inscricao`/`lotes`/`gallery`/`albums`/`hero`) são sobrescritos por
 * `deriveView` a partir dos blocos daquela edição. Os demais não são lidos do
 * topo (cada seção renderiza pelo seu bloco), então ficam vazios.
 */
const MIRROR_DEFAULTS: {
  hero: Hero;
  heroCarousels: HeroCarousel[];
  stats: SiteContent["stats"];
  about: AboutSection;
  playlist: SiteContent["playlist"];
  percurso: SiteContent["percurso"];
  inscricao: SiteContent["inscricao"];
  lotes: SiteContent["lotes"];
  albums: SiteContent["albums"];
  galleryTiles: SiteContent["galleryTiles"];
  galleryPhotos: SiteContent["galleryPhotos"];
  gallery: GalleryConfig;
  sponsors: SiteContent["sponsors"];
  testimonials: SiteContent["testimonials"];
  faq: SiteContent["faq"];
  kit: SiteContent["kit"];
  premiacao: SiteContent["premiacao"];
  sejaParceiro: SejaParceiroSection;
  share: ShareSection;
} = {
  hero: { slides: [], slideDurationSeconds: 6, reduceMotion: true },
  heroCarousels: [],
  stats: [],
  about: {} as AboutSection,
  playlist: sectionDefaults("playlist").playlist!,
  percurso: sectionDefaults("percurso").percurso!,
  inscricao: sectionDefaults("inscricao").inscricao!,
  lotes: [],
  albums: [],
  galleryTiles: [],
  galleryPhotos: [],
  gallery: {},
  sponsors: [],
  testimonials: [],
  faq: [],
  kit: sectionDefaults("kit").kit!,
  premiacao: sectionDefaults("premiacao").premiacao!,
  sejaParceiro: {},
  share: {},
};

/**
 * Camada de compatibilidade — resolve uma **edição** para um `SiteContent`
 * completo (a "view"), com a mesma forma do modelo single-tenant antigo:
 * globais do topo + `event`/`layout`/`customSections` da edição escolhida, e os
 * campos-espelho derivados dos blocos por `deriveView`. Assim todo o render
 * público e as telas do ADM continuam iguais. `editionId` ausente → edição ativa.
 */
export function resolveEdition(stored: StoredContent, editionId?: string): SiteContent {
  const ed = editionById(stored, editionId);
  const view: SiteContent = {
    ...MIRROR_DEFAULTS,
    // Config do SITE — agora vem da EDIÇÃO (marca/tema/contato/organizadores/
    // privacidade/integrações). Trocar a edição ativa muda o site por completo.
    branding: (ed?.branding ?? {}) as Branding,
    theme: (ed?.theme ?? {}) as ThemeColors,
    cloudinary: (ed?.cloudinary ?? {}) as Cloudinary,
    analytics: (ed?.analytics ?? {}) as Analytics,
    contact: (ed?.contact ?? {}) as ContactLinks,
    organizers: ed?.organizers,
    privacy: ed?.privacy,
    // Global (fora da edição).
    editions: stored.editions,
    log: stored.log,
    // Identidade + seções da edição.
    event: ed?.event ?? EMPTY_EVENT,
    layout: ed?.layout ?? [],
    customSections: ed?.customSections ?? [],
  };
  return deriveView(view);
}
