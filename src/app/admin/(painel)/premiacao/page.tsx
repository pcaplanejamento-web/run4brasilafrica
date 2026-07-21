"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Premiação" agora é uma aba — redireciona ao editor da aba. */
export default function PremiacaoPage() {
  return <SectionAbaRedirect id="sec-premiacao" kind="premiacao" title="Premiação" />;
}
