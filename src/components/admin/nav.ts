/** ADM navigation model — mirrors AdmSidebar.dc.html. */
export interface AdmNavItem {
  key: string;
  label: string;
  href: string;
}

export const ADM_NAV: AdmNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "banner", label: "Banner / Hero", href: "/admin/banner" },
  // "Textos do site" foi removida: os textos são editados nas respectivas abas
  // ("A Causa", "Perguntas frequentes") e na config geral (contato/rodapé em
  // "Links & inscrição"). Cada texto tem uma única fonte de verdade.
  // TODAS as seções (inclusive galeria, inscrição/lotes e dia da corrida) são
  // abas autocontidas, editadas em /admin/custom/sec-*. Sobra aqui só o CRM de
  // leads do "Seja um Parceiro" (cadastros).
  { key: "seja-parceiro", label: "Cadastros de parceiros", href: "/admin/seja-parceiro" },
  { key: "inscritos", label: "Avisos (e-mails)", href: "/admin/inscritos" },
  { key: "usuarios", label: "Usuários", href: "/admin/usuarios" },
  { key: "edicoes", label: "Edições", href: "/admin/edicoes" },
  { key: "log", label: "Log de alterações", href: "/admin/log" },
  { key: "backup", label: "Backup", href: "/admin/backup" },
  { key: "configuracoes", label: "Configurações", href: "/admin/configuracoes" },
];
