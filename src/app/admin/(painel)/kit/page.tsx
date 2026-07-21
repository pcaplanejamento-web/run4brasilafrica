"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Kit do atleta" agora é uma aba — redireciona ao editor da aba. */
export default function KitPage() {
  return <SectionAbaRedirect id="sec-kit" kind="kit" title="Kit do atleta" />;
}
