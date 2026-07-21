"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** A Galeria agora é uma aba (bloco `galeria`) — redireciona ao editor da aba. */
export default function GaleriaPage() {
  return <SectionAbaRedirect id="sec-galeria" kind="galeria" title="Galeria" />;
}
