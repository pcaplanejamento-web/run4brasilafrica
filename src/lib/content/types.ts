/**
 * Content model for Run4BrasilAfrica.
 *
 * Everything the public site renders is described here so the organizing team
 * can edit it from the ADM without touching code (Plano de Negócio §8:
 * "Todo conteúdo variável deve estar no ADM, nunca hardcoded").
 *
 * In production this shape is what the backend (e.g. Supabase) returns per
 * edition; for now it is seeded in `seed.ts` and editable in-browser via the
 * ADM store (`store.tsx`).
 */

export type SponsorTier = "Ouro" | "Prata" | "Bronze";
export type EditionStatus = "Ativa" | "Encerrada";

export interface EventInfo {
  brandName: string;
  editionYear: string;
  dateLabel: string; // "14 SET 2026 · RIO DE JANEIRO"
  city: string;
  tagline: string; // hero headline
}

export type MediaType = "image" | "video";

export interface HeroSlide {
  id: string;
  mediaType: MediaType;
  /** Uploaded image URL for DESKTOP (16:9), when mediaType === "image". */
  image?: string;
  /** Uploaded image URL for MOBILE (3:4). Falls back to `image` when empty. */
  imageMobile?: string;
  /** Focal point (object-position %, 0–100) — how the image is framed in its box.
   *  `focusX/Y` = desktop, `focusXm/Ym` = mobile. Default 50/50 (centered). */
  focusX?: number;
  focusY?: number;
  focusXm?: number;
  focusYm?: number;
  /** YouTube link (when mediaType === "video"). */
  videoUrl?: string;
  /** Whether the video should start with sound (on first interaction). */
  videoStartMuted: boolean;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaUrl: string;
  /** Whether the CTA button shows on this slide. Default true (undefined = shown). */
  ctaEnabled?: boolean;
  /** Which side of the banner the CTA button sits on. Default "left". */
  ctaAlign?: "left" | "right";
  /** CTA style: "solid" = filled gold (default), "transparent" = translucent
   *  gold over the media (same design language, lighter weight). */
  ctaVariant?: "solid" | "transparent";
  /** When the slide has NO button (ctaEnabled === false), an optional link that
   *  makes the whole banner clickable and sends the visitor to this URL. */
  slideLink?: string;
  /** Show the YouTube control bar (play/pause, fullscreen, share, logo). */
  videoControls?: boolean;
  /** Force closed captions on. */
  videoCaptions?: boolean;
  /** Legacy (old text-only carousel) — read as fallback for migration. */
  text?: string;
  cta?: string;
}

export interface Hero {
  slides: HeroSlide[];
  slideDurationSeconds: number;
  reduceMotion: boolean;
  /** Legacy fields — kept optional, no longer used (no global hero background). */
  badge?: string;
  title?: string;
  ctaLabel?: string;
  transition?: string;
  image?: string;
  video?: string;
  youtubeUrl?: string;
}

/**
 * A scheduled banner/hero carousel. Several may exist but only ONE is on air at
 * a time, chosen by date/time (`src/lib/content/carousels.ts`):
 *  - `startAt` — when it goes live (empty = eligible from the start);
 *  - `endAt` — when it leaves the air (empty = perpetual/no end);
 *  - `isDefault` — the perpetual fallback that ignores the schedule and is always
 *    eligible, so the banner is never empty. Exactly one carousel is the default.
 * It extends `Hero`, so the public `<Hero>` renders a carousel unchanged.
 */
export interface HeroCarousel extends Hero {
  id: string;
  name: string;
  startAt?: string; // datetime-local
  endAt?: string; // datetime-local
  isDefault?: boolean;
}

export interface Stat {
  value: string;
  label: string;
}

export interface AboutSection {
  eyebrow: string;
  title: string;
  body: string;
  linkLabel: string;
  /** Button destination (falls back to the #parceiros anchor when empty). */
  linkUrl?: string;
  mediaType?: MediaType;
  image?: string;
  videoUrl?: string;
  videoStartMuted?: boolean;
  /** Show a "Clique para começar o vídeo" overlay instead of autoplay. */
  clickToPlay?: boolean;
  /** CSS aspect-ratio for the media box (e.g. "16/9", "4/3", "1/1", "9/16"). */
  aspectRatio?: string;
  /** Show the YouTube control bar (play/pause, fullscreen, share, logo). */
  videoControls?: boolean;
  /** Force closed captions on. */
  videoCaptions?: boolean;
}

/**
 * Event playlist: Spotify and/or YouTube. Plays while the visitor browses the
 * (single-page) site; the audio bus mutes YouTube / pauses Spotify when a
 * banner/"A Causa" video has its sound on.
 */
export interface PlaylistSection {
  enabled?: boolean;
  title?: string;
  note?: string;
  /** Which player(s) appear when both links are set. */
  visible?: "youtube" | "spotify" | "both";
  youtubeUrl?: string;
  spotifyUrl?: string;
}

/** Gallery config: "buy photos" button + sliding-grid dimensions per breakpoint. */
export interface GalleryConfig {
  buyEnabled?: boolean;
  buyLabel?: string;
  buyUrl?: string;
  /** Sliding grid: columns/rows per page on desktop and mobile, and autoplay. */
  slideCols?: number;
  slideRows?: number;
  slideColsMobile?: number;
  slideRowsMobile?: number;
  slideSeconds?: number;
}

/** One course/route the visitor can select in the Percurso section. */
export interface PercursoRoute {
  id: string;
  /** Route title (e.g. "10 KM", "Percurso Kids"). */
  title: string;
  stravaRouteRef?: string;
  garminRouteRef?: string;
  /** Manual fallback shown when there's no embeddable map (uploaded image). */
  fallbackImage?: string;
  /** Optional caption for the fallback. */
  fallbackNote?: string;
  /** Complementary data. */
  distance?: string;
  elevation?: string;
  startFinish?: string;
}

export interface Percurso {
  eyebrow: string;
  title: string;
  /** Multiple routes the visitor can switch between. When empty, the legacy
   * single-route fields below are used (migrated on read). */
  routes?: PercursoRoute[];
  /** Legacy single-route fields (kept for back-compat / migration). */
  distance: string;
  elevation: string;
  startFinish: string;
  stravaRouteRef: string;
  garminRouteRef?: string;
  connected: boolean;
}

/** Visual identity managed in ADM > Configurações. */
export interface Branding {
  /** Site logo shown in the header/footer (replaces the text wordmark). */
  logo?: string;
  /** Browser-tab icon (favicon). */
  favicon?: string;
  /** Social share image (Open Graph / WhatsApp). Falls back to /og.png. */
  ogImage?: string;
}

/**
 * Site color overrides (theme). Each maps to CSS custom properties applied at
 * runtime; unset keys keep the default palette. Values are any CSS color (hex).
 */
export interface ThemeColors {
  background?: string;
  /** Header (top nav) background. Defaults to `background` when unset. */
  headerBg?: string;
  /** Footer background. Defaults to the deep-ink tone when unset. */
  footerBg?: string;
  accent?: string;
  accentText?: string;
  text?: string;
  /** Single "inner surface" color for all dark card/panel tones on the home
   *  (ink-panel, ink-card, ink-deep, ink-deeper). Overrides `cards`/`sections`. */
  surfaces?: string;
  /** @deprecated — kept for back-compat; superseded by `surfaces`. */
  sections?: string;
  /** @deprecated — kept for back-compat; superseded by `surfaces`. */
  cards?: string;
  heroRed?: string;
}

export interface Inscricao {
  title: string;
  subtitle: string;
  ctaLabel: string;
  platform: string;
  url: string;
  /** Race day (datetime-local / ISO) — powers the "Dia da Corrida" countdown. */
  raceDate?: string;
}

/** A registration batch ("lote"). Periods must not overlap (one at a time). */
export interface Lote {
  id: string;
  name: string;
  text: string;
  ctaLabel: string;
  url: string;
  /** When registrations OPEN (datetime-local / ISO). */
  openDate?: string;
  /** When registrations CLOSE (deadline/turnover). Used to order + count down. */
  date: string;
  colorBg: string;
  colorText: string;
  /** Legacy manual override — used only when a lote has no `openDate`. */
  open: boolean;
}

export interface Album {
  name: string;
  count: number;
  /** Public Google Photos album link — its photos are pulled into this section. */
  sourceUrl?: string;
}

export interface Sponsor {
  name: string;
  tier: SponsorTier;
  /** Single destination link. Interpreted per `linkKind` (site URL or social). */
  link: string;
  /** What `link` points to: a website ("site") or a social profile ("social"). */
  linkKind?: "site" | "social";
  /** Legacy — Instagram profile. Read as fallback when `linkKind` is unset. */
  instagram?: string;
  /** Instagram username/handle shown under the name (e.g. "@fulano"), like the
   *  organizers card. Display only; when empty the line keeps its height so all
   *  cards stay the same size. */
  username?: string;
  logo?: string;
}

/** One person in the "Organizadores" floating card. */
export interface Organizer {
  name: string;
  /** Instagram username/handle: shown under the name AND used to build the
   *  profile link the photo opens (e.g. "@fulano"). */
  username?: string;
  /** Legacy — old explicit Instagram link; read only as a fallback for `username`. */
  instagram?: string;
  photo?: string;
}

/** "Organizadores" section — a dedication + the people, shown in a floating card
 *  opened from the footer link (URL hash `#organizadores`). */
export interface OrganizersSection {
  /** Show the "Organizadores" footer link + modal. Default on (undefined = on). */
  enabled?: boolean;
  /** Dedication title. */
  title?: string;
  /** Dedication text (line breaks kept). */
  body?: string;
  people?: Organizer[];
}

export interface GalleryPhoto {
  url: string;
  album: string;
}

/** Cloudinary config for gallery uploads (unsigned). Set in ADM > Configurações. */
export interface Cloudinary {
  cloudName?: string;
  uploadPreset?: string;
}

/** Web analytics — Cloudflare Web Analytics beacon and/or Google Analytics 4. */
export interface Analytics {
  cfBeaconToken?: string;
  gaId?: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Optional photo of the person (avatar). */
  photo?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** One item included in the athlete kit. */
export interface KitItem {
  name: string;
  /** Optional icon key from the built-in library (see KitIcons). */
  icon?: string;
  /** Optional uploaded image (used when no icon is chosen). */
  image?: string;
}

/** Kit contents for a specific lote (when the kit varies per lote). */
export interface KitPerLote {
  loteId: string;
  items: KitItem[];
}

export interface KitSection {
  title: string;
  subtitle: string;
  regulamentoLabel: string;
  /** Regulation: a link to a file, or inline text. */
  regulamentoMode?: "link" | "text";
  regulamentoUrl?: string;
  regulamentoText?: string;
  /** Kit contents: one shared list, or a different list per lote. */
  kitMode?: "single" | "perLote";
  items?: KitItem[];
  perLote?: KitPerLote[];
}

export interface ContactLinks {
  instagram: string;
  whatsapp: string;
  youtube: string;
  email: string;
  donationsUrl: string;
  copyright: string;
  /** Show a floating WhatsApp button (uses `whatsapp`). */
  whatsappFloat?: boolean;
}

/** One podium position with its award. */
export interface PodiumPlace {
  /** Position label ("1º lugar", "Campeão", …). */
  place: string;
  /** Award for this position ("R$ 500 + troféu", "Medalha + kit", …). */
  prize: string;
  /** Podium bar/accent color (hex). Empty → default per rank (ouro/prata/bronze). */
  color?: string;
}

/**
 * Awards section: a podium with the prize per position + optional results link.
 * Visibility (show/hide) is controlled by the home layout in the Dashboard, not
 * a field here.
 */
export interface PremiacaoSection {
  eyebrow?: string;
  title?: string;
  note?: string;
  places: PodiumPlace[];
  /** Optional link to full results elsewhere. */
  resultsLabel?: string;
  resultsUrl?: string;
}

/** "Seja um Parceiro" section — editable heading/intro; the form is fixed. */
export interface SejaParceiroSection {
  title?: string;
  subtitle?: string;
  /** E-mail that receives a notification when a new lead is submitted (optional;
   * requires the RESEND_API_KEY secret to actually send). */
  notifyEmail?: string;
  /** Optional promotional YouTube video (same rules/config as "A Causa"). */
  videoEnabled?: boolean;
  videoUrl?: string;
  /** CSS aspect-ratio for the video box (e.g. "16/9", "4/3", "9/16"). */
  aspectRatio?: string;
  /** Start muted (sound on first interaction). Defaults to true. */
  videoStartMuted?: boolean;
  /** Show a "click to play" overlay instead of autoplay. */
  clickToPlay?: boolean;
  /** Show the YouTube control bar. */
  videoControls?: boolean;
  /** Force closed captions on. */
  videoCaptions?: boolean;
}

/** One "Seja um Parceiro" lead (stored in the D1 `partners` table, not content). */
export type PartnerKind = "fisica" | "juridica";
export interface PartnerLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  kind: PartnerKind;
  hasWhatsapp: boolean;
  created_at: string;
}

/**
 * Custom home "aba" (section) the ADM builds from reusable blocks. Its layout key
 * is `custom:<id>`. Each block reuses an existing site component.
 */
/**
 * Seções do site que são componentes de aba. Cada uma é um `CustomBlockType`
 * de primeira classe (não há mais o invólucro "seção pronta"): o bloco carrega
 * o próprio dado nos campos abaixo (`faq`, `stats`, …). `raceday`/`inscricao`/
 * `galeria` são **marcadores** (sem dado próprio) — renderizam do conteúdo
 * global (lotes/inscricao/fotos), fonte única, sem divergência.
 */
export type SectionKind =
  | "stats"
  | "playlist"
  | "percurso"
  | "location"
  | "raceday"
  | "inscricao"
  | "galeria"
  | "premiacao"
  | "parceiros"
  | "sejaParceiro"
  | "depoimentos"
  | "faq"
  | "kit"
  | "compartilhar";

/**
 * Tipo de um bloco de aba. Tudo é componente: blocos de conteúdo livre
 * (texto/imagem/vídeo/…) e cada seção do site (`SectionKind`).
 */
export type CustomBlockType =
  | "subtitulo"
  | "texto"
  | "imagem"
  | "video"
  | "botao"
  | "carrossel"
  | "formulario"
  | SectionKind;

/** Posição do bloco na seção: largura total, coluna esquerda ou direita
 *  (2 colunas no desktop; sempre empilhado no mobile). Ausente = "full". */
export type CustomBlockColumn = "full" | "left" | "right";

/** Alinhamento horizontal do bloco dentro da sua coluna/largura. Ausente = "left". */
export type CustomBlockAlign = "left" | "center" | "right";

export interface CustomBlock {
  id: string;
  type: CustomBlockType;
  /** Disposição do bloco (padrão "full"). */
  column?: CustomBlockColumn;
  /** Alinhamento horizontal dentro da coluna/largura (padrão "left"). */
  align?: CustomBlockAlign;
  /** subtítulo / texto. */
  text?: string;
  /** imagem (URL). */
  imageUrl?: string;
  /** Escala da imagem: largura em % do container (10–100). Ausente/100 = largura
   *  total. Ex.: um QR code fica bem menor com 30–40%. Centralizada quando < 100. */
  scale?: number;
  /** vídeo (YouTube). */
  videoUrl?: string;
  /** proporção do vídeo/imagem (ex.: "16/9"). */
  aspectRatio?: string;
  /** Vídeo: começa mudo (autoplay). Ausente = true. */
  videoStartMuted?: boolean;
  /** Vídeo: mostra overlay "clique para começar" em vez de autoplay. */
  clickToPlay?: boolean;
  /** Vídeo: mostra a barra de controles do YouTube. */
  videoControls?: boolean;
  /** Vídeo: força legendas. */
  videoCaptions?: boolean;
  /** botão. */
  buttonLabel?: string;
  buttonUrl?: string;
  /** carrossel/banner (lista de imagens). */
  images?: string[];
  /** formulário: qual formulário existente embutir. */
  formKind?: "email";

  /* Dados das seções do site (presentes conforme o `type` de seção). Marcadores
   * — raceday/inscricao/galeria — não carregam dado (leem do conteúdo global). */
  /** type "stats". */
  stats?: Stat[];
  /** type "faq". */
  faq?: FaqItem[];
  /** type "depoimentos". */
  testimonials?: Testimonial[];
  /** type "playlist". */
  playlist?: PlaylistSection;
  /** type "percurso". */
  percurso?: Percurso;
  /** type "location". */
  location?: LocationSection;
  /** type "premiacao". */
  premiacao?: PremiacaoSection;
  /** type "sejaParceiro". */
  sejaParceiro?: SejaParceiroSection;
  /** type "compartilhar". */
  share?: ShareSection;
  /** type "kit". */
  kit?: KitSection;
  /** type "parceiros". */
  sponsors?: Sponsor[];
  sponsorsShowTier?: boolean;
  sponsorsSubtitle?: string;
  sponsorsShowCta?: boolean;
  /** type "galeria" (config + seções/álbuns; as fotos são buscadas em runtime). */
  gallery?: GalleryConfig;
  albums?: Album[];
  /** type "inscricao" (plataforma/URL + lotes). */
  inscricao?: Inscricao;
  lotes?: Lote[];
  /** type "raceday" (dia da corrida). */
  raceDate?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  blocks: CustomBlock[];
}

/** "Compartilhe o evento" section — share buttons; message auto-built if empty. */
export interface ShareSection {
  title?: string;
  subtitle?: string;
  /** Custom share text; when empty, built from the event (name, tagline, date). */
  message?: string;
}

/** "Localização / como chegar" section. */
export interface LocationSection {
  title?: string;
  /** Venue / place name (e.g. "Parque Municipal"). */
  venueName?: string;
  /** Full address — powers the map + "como chegar" when no custom embed is set. */
  address?: string;
  /** Optional custom Google Maps embed URL (overrides the address-based map). */
  mapEmbedUrl?: string;
  note?: string;
}

/** Privacy notice (LGPD) — editable in ADM > Configurações, shown in a modal. */
export interface PrivacySection {
  title?: string;
  /** Full text; rendered with line breaks preserved (`whitespace-pre-line`). */
  body?: string;
}

export interface Edition {
  year: string;
  date: string;
  participants: string;
  status: EditionStatus;
}

export interface LogEntry {
  time: string;
  action: string;
  user: string;
}

/** Manually-edited event numbers (the computed ones live in the dashboard). */
export interface Metrics {
  registered: string;
  spotsLeft: string;
}

/** One homepage section in the ADM-controlled order + on/off state. */
export interface LayoutItem {
  key: string;
  enabled: boolean;
}

export interface SiteContent {
  event: EventInfo;
  branding: Branding;
  theme: ThemeColors;
  /** Homepage section order + on/off (ADM dashboard). */
  layout: LayoutItem[];
  hero: Hero;
  /** Multiple scheduled banner carousels (only one on air at a time). When
   *  absent/empty the single `hero` above is used as the sole default carousel
   *  (legacy). See `src/lib/content/carousels.ts`. */
  heroCarousels?: HeroCarousel[];
  stats: Stat[];
  about: AboutSection;
  playlist: PlaylistSection;
  percurso: Percurso;
  inscricao: Inscricao;
  lotes: Lote[];
  albums: Album[];
  galleryTiles: { album: string }[];
  galleryPhotos: GalleryPhoto[];
  gallery: GalleryConfig;
  cloudinary: Cloudinary;
  analytics: Analytics;
  sponsors: Sponsor[];
  /** Organizers shown in the footer's floating "Organizadores" card. */
  organizers?: OrganizersSection;
  /** Show the tier badge (Ouro/Prata/Bronze) on the public partners grid. */
  sponsorsShowTier?: boolean;
  /** Optional caption shown under the "Parceiros" section title. */
  sponsorsSubtitle?: string;
  /** Show a "Seja um parceiro" button in the Parceiros title row (scrolls to the
   * "Seja um Parceiro" section). Only effective when that section is enabled. */
  sponsorsShowCta?: boolean;
  testimonials: Testimonial[];
  faq: FaqItem[];
  kit: KitSection;
  contact: ContactLinks;
  premiacao: PremiacaoSection;
  sejaParceiro: SejaParceiroSection;
  location?: LocationSection;
  share?: ShareSection;
  /** Custom "abas" built in the ADM (rendered by `custom:<id>` keys in `layout`). */
  customSections?: CustomSection[];
  privacy?: PrivacySection;
  /* ADM-only content */
  editions: Edition[];
  metrics: Metrics;
  log: LogEntry[];
}
