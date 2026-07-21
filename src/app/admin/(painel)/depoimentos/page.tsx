"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Quem já correu" agora é uma aba — redireciona ao editor da aba. */
export default function DepoimentosPage() {
  return (
    <SectionAbaRedirect id="sec-depoimentos" kind="depoimentos" title="Quem já correu" />
  );
}
