"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/lib/content/store";
import { AdmLoading } from "@/components/admin/ui";
import { customKey } from "@/lib/content/sections";
import { sectionDefaults } from "@/lib/content/sectionKinds";
import type { CustomSection, SectionKind } from "@/lib/content/types";

/**
 * A seção agora é uma **aba** (custom section). A página ADM legada redireciona
 * para o editor da aba — uma única fonte de verdade. Se a aba ainda não existe
 * (seção estava vazia, sem migração), cria uma vazia e abre. Assim nada quebra e
 * o organizador continua editando no mesmo lugar.
 */
export default function SectionAbaRedirect({
  id,
  kind,
  title,
}: {
  id: string;
  kind: SectionKind;
  title: string;
}) {
  const { hydrated, content, save } = useContent();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    const exists = (content.customSections ?? []).some((s) => s.id === id);
    if (!exists) {
      const aba: CustomSection = {
        id,
        title,
        blocks: [{ id: `${id}-b`, type: "secao", section: sectionDefaults(kind) }],
      };
      const list = content.customSections ?? [];
      const layout = [...(content.layout ?? []), { key: customKey(id), enabled: true }];
      save({ customSections: [...list, aba], layout }, `Criou a aba "${title}"`);
    }
    router.replace(`/admin/custom/${id}`);
  }, [hydrated, content, save, router, id, kind, title]);

  return <AdmLoading label="Abrindo o editor da aba…" />;
}
