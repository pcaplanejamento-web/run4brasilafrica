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
  /** Uploaded image URL (when mediaType === "image"). */
  image?: string;
  /** YouTube link (when mediaType === "video"). */
  videoUrl?: string;
  /** Whether the video should start with sound (on first interaction). */
  videoStartMuted: boolean;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaUrl: string;
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
  accent?: string;
  accentText?: string;
  text?: string;
  sections?: string;
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
  logo?: string;
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
  kitLabel: string;
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

export interface ContentSection {
  title: string;
  body: string;
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
  /** Show the tier badge (Ouro/Prata/Bronze) on the public partners grid. */
  sponsorsShowTier?: boolean;
  /** Optional caption shown under the "Parceiros" section title. */
  sponsorsSubtitle?: string;
  testimonials: Testimonial[];
  faq: FaqItem[];
  kit: KitSection;
  contact: ContactLinks;
  premiacao: PremiacaoSection;
  /* ADM-only content */
  contentSections: ContentSection[];
  editions: Edition[];
  metrics: Metrics;
  log: LogEntry[];
}
