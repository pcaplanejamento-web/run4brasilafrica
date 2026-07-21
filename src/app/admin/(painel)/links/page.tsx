"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Inscrições e Lotes" agora é uma aba (bloco `inscricao`) — redireciona ao editor. */
export default function LinksPage() {
  return <SectionAbaRedirect id="sec-inscricao" kind="inscricao" title="Inscrição" />;
}
