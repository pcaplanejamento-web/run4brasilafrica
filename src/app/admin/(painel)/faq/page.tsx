"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Perguntas frequentes" agora é uma aba — redireciona ao editor da aba. */
export default function FaqPage() {
  return <SectionAbaRedirect id="sec-faq" kind="faq" title="Perguntas frequentes" />;
}
