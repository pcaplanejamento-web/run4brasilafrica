"use client";

import Link from "next/link";
import { useContent } from "@/lib/content/store";
import { activeEdition, editionLabel } from "@/lib/content/editions";
import { editionStatusColors } from "@/lib/content/theme";

/**
 * Marcador padronizado da **edição ativa** do evento — o MESMO componente no
 * Dashboard e no Banner/Hero. Deriva da lista de Edições (`activeEdition`), então
 * reflete na hora ao trocar a edição ativa. Clica para gerenciar em Edições.
 */
export default function EditionBadge({ href = "/admin/edicoes" }: { href?: string }) {
  const { content, hydrated } = useContent();
  if (!hydrated) return null;

  const active = activeEdition(content);
  if (!active) return null;

  const label = editionLabel(content);
  const c = editionStatusColors[active.status] ?? editionStatusColors.Ativa;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-adm-border bg-adm-card px-3 py-1.5 text-[13px] text-adm-ink transition-colors hover:border-terracotta"
      title="Gerenciar edições"
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ background: c.color }}
        aria-hidden="true"
      />
      <span className="text-adm-muted">Edição ativa:</span>
      <span className="font-semibold">{label}</span>
    </Link>
  );
}
