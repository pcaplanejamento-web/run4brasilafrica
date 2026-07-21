"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Números em destaque" agora é uma aba — redireciona ao editor da aba. */
export default function NumerosPage() {
  return <SectionAbaRedirect id="sec-stats" kind="stats" title="Números em destaque" />;
}
