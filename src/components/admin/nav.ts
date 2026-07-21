/** ADM navigation model — mirrors AdmSidebar.dc.html. */
export interface AdmNavItem {
  key: string;
  label: string;
  href: string;
}

export const ADM_NAV: AdmNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "banner", label: "Banner / Hero", href: "/admin/banner" },
  { key: "conteudo", label: "Textos do site", href: "/admin/conteudo" },
  // Quase todas as seções viraram abas (editadas via /admin/custom/sec-*). Ficam
  // páginas próprias só: Galeria (fotos/álbuns) e Links & inscrição (lotes+data),
  // que as abas-marcador de galeria/raceday/inscricao usam como conteúdo global;
  // e "Cadastros de parceiros" (o CRM de leads do "Seja um Parceiro").
  { key: "galeria", label: "Galeria (fotos)", href: "/admin/galeria" },
  { key: "links", label: "Links & inscrição", href: "/admin/links" },
  { key: "seja-parceiro", label: "Cadastros de parceiros", href: "/admin/seja-parceiro" },
  { key: "inscritos", label: "Avisos (e-mails)", href: "/admin/inscritos" },
  { key: "usuarios", label: "Usuários", href: "/admin/usuarios" },
  { key: "edicoes", label: "Edições", href: "/admin/edicoes" },
  { key: "log", label: "Log de alterações", href: "/admin/log" },
  { key: "backup", label: "Backup", href: "/admin/backup" },
  { key: "configuracoes", label: "Configurações", href: "/admin/configuracoes" },
];
