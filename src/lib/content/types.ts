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

/** Gallery "buy photos" button shown next to the section title. */
export interface GalleryConfig {
  buyEnabled?: boolean;
  buyLabel?: string;
  buyUrl?: string;
}

export interface Percurso {
  eyebrow: string;
  title: string;
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
}

/** A registration batch ("lote"). Only one should be open at a time. */
export interface Lote {
  id: string;
  name: string;
  text: string;
  ctaLabel: string;
  url: string;
  /** Deadline/turnover date (datetime-local / ISO) — used to order + count down. */
  date: string;
  colorBg: string;
  colorText: string;
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
  link: string;
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

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface KitSection {
  title: string;
  subtitle: string;
  regulamentoLabel: string;
  kitLabel: string;
}

export interface ContactLinks {
  instagram: string;
  whatsapp: string;
  youtube: string;
  email: string;
  donationsUrl: string;
  copyright: string;
}

export interface ContentSection {
  title: string;
  body: string;
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

export interface SiteContent {
  event: EventInfo;
  branding: Branding;
  theme: ThemeColors;
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
  sponsors: Sponsor[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  kit: KitSection;
  contact: ContactLinks;
  /* ADM-only content */
  contentSections: ContentSection[];
  editions: Edition[];
  metrics: Metrics;
  log: LogEntry[];
}
