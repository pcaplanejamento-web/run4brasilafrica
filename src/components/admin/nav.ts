/** ADM navigation model — mirrors AdmSidebar.dc.html. */
export interface AdmNavItem {
  key: string;
  label: string;
  href: string;
}

export const ADM_NAV: AdmNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "banner", label: "Banner / Hero", href: "/admin/banner" },
  { key: "playlist", label: "Playlist", href: "/admin/playlist" },
  { key: "galeria", label: "Galeria", href: "/admin/galeria" },
  { key: "conteudo", label: "Textos do site", href: "/admin/conteudo" },
  { key: "depoimentos", label: "Depoimentos", href: "/admin/depoimentos" },
  { key: "faq", label: "FAQ", href: "/admin/faq" },
  { key: "kit", label: "Kit do atleta", href: "/admin/kit" },
  { key: "strava", label: "Percurso (Strava)", href: "/admin/strava" },
  { key: "patrocinadores", label: "Patrocinadores", href: "/admin/patrocinadores" },
  { key: "links", label: "Links & inscrição", href: "/admin/links" },
  { key: "usuarios", label: "Usuários", href: "/admin/usuarios" },
  { key: "edicoes", label: "Edições", href: "/admin/edicoes" },
  { key: "log", label: "Log de alterações", href: "/admin/log" },
  { key: "configuracoes", label: "Configurações", href: "/admin/configuracoes" },
];
