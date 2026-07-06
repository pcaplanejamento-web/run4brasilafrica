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
  connected: boolean;
}

export interface Inscricao {
  title: string;
  subtitle: string;
  ctaLabel: string;
  platform: string;
  url: string;
}

export interface Album {
  name: string;
  count: number;
}

export interface Sponsor {
  name: string;
  tier: SponsorTier;
  link: string;
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

export interface DashboardKpi {
  label: string;
  value: string;
}

export interface SiteContent {
  event: EventInfo;
  hero: Hero;
  stats: Stat[];
  about: AboutSection;
  percurso: Percurso;
  inscricao: Inscricao;
  albums: Album[];
  galleryTiles: { album: string }[];
  sponsors: Sponsor[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  kit: KitSection;
  contact: ContactLinks;
  /* ADM-only content */
  contentSections: ContentSection[];
  editions: Edition[];
  dashboardKpis: DashboardKpi[];
  log: LogEntry[];
}
