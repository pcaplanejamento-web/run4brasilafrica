"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Localização" agora é uma aba — redireciona ao editor da aba. */
export default function LocalizacaoPage() {
  return <SectionAbaRedirect id="sec-location" kind="location" title="Localização" />;
}
