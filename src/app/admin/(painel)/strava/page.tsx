"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "O Percurso" agora é uma aba — redireciona ao editor da aba. */
export default function StravaPage() {
  return <SectionAbaRedirect id="sec-percurso" kind="percurso" title="O Percurso" />;
}
