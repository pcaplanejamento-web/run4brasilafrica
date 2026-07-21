"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Parceiros" agora é uma aba — redireciona ao editor da aba. */
export default function PatrocinadoresPage() {
  return <SectionAbaRedirect id="sec-parceiros" kind="parceiros" title="Parceiros" />;
}
