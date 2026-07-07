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

export interface HeroSlide {
  text: string;
  cta: string;
}

export interface Hero {
  badge: string;
  title: string;
  ctaLabel: string;
  slides: HeroSlide[];
  transition: string;
  slideDurationSeconds: number;
  reduceMotion: boolean;
  /** Background image URL (replaces the placeholder texture when set). */
  image?: string;
  /** Background video URL (takes priority over the image when set). */
  video?: string;
  /** YouTube link for a background video (takes priority over image/video). */
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
  hero: Hero;
  stats: Stat[];
  about: AboutSection;
  percurso: Percurso;
  inscricao: Inscricao;
  lotes: Lote[];
  albums: Album[];
  galleryTiles: { album: string }[];
  galleryPhotos: GalleryPhoto[];
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
