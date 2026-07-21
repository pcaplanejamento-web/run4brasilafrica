"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Compartilhar" agora é uma aba — redireciona ao editor da aba. */
export default function CompartilharPage() {
  return <SectionAbaRedirect id="sec-compartilhar" kind="compartilhar" title="Compartilhar" />;
}
