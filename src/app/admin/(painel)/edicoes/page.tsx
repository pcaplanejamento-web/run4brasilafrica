"use client";

import { useContent } from "@/lib/content/store";
import type { Edition } from "@/lib/content/types";
import { editionStatusColors } from "@/lib/content/theme";
import {
  AdmLoading,
  Badge,
  GhostButton,
  PageHeader,
  PrimaryButton,
} from "@/components/admin/ui";

export default function EdicoesPage() {
  const { content, hydrated, save } = useContent();

  if (!hydrated) return <AdmLoading />;

  const nextYear = () =>
    String(Math.max(...content.editions.map((e) => Number(e.year) || 0)) + 1);

  // New edition becomes active; any previously active edition is closed.
  function withNewActive(edition: Edition): Edition[] {
    return [
      edition,
      ...content.editions.map((e) =>
        e.status === "Ativa" ? { ...e, status: "Encerrada" as const } : e,
      ),
    ];
  }

  function addEdition() {
    const year = nextYear();
    save(
      { editions: withNewActive({ year, date: `set ${year}`, participants: "0", status: "Ativa" }) },
      `Criou edição ${content.event.brandName} ${year}`,
    );
  }

  function duplicate(base: Edition) {
    const year = nextYear();
    save(
      {
        editions: withNewActive({
          year,
          date: `set ${year}`,
          participants: "0",
          status: "Ativa",
        }),
      },
      `Duplicou a edição ${base.year} como base para ${year}`,
    );
  }

  return (
    <>
      <PageHeader
        title="Edições do evento"
        aside={<PrimaryButton onClick={addEdition}>+ Nova edição</PrimaryButton>}
      />

      <div className="flex flex-col gap-3.5">
        {content.editions.map((e, i) => {
          const c = editionStatusColors[e.status];
          return (
            <div
              key={`${e.year}-${i}`}
              className="flex flex-col gap-4 rounded-lg border border-adm-border bg-adm-card p-5 sm:flex-row sm:items-center sm:justify-between md:px-6"
            >
              <div className="flex items-center gap-4">
                <Badge bg={c.bg} color={c.color}>
                  {e.status}
                </Badge>
                <div>
                  <div className="text-[15px] font-bold">
                    {content.event.brandName} {e.year}
                  </div>
                  <div className="text-[13px] text-adm-muted">
                    {e.date} · {e.participants} inscritos
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <GhostButton className="px-3.5 py-2">Ver dados</GhostButton>
                <GhostButton className="px-3.5 py-2" onClick={() => duplicate(e)}>
                  Duplicar como base
                </GhostButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-7 max-w-[640px] rounded-lg border border-dashed border-[#b8b8b0] bg-adm-card p-5 md:p-[22px]">
        <div className="mb-2.5 text-[13px] font-bold uppercase text-adm-muted">
          Modo configuração de nova edição
        </div>
        <p className="text-[13px] leading-[1.6] text-[#555]">
          Um checklist guiado ajuda a organização a atualizar data, percurso,
          patrocinadores e fotos a cada ano, sem apagar o histórico de edições
          anteriores.
        </p>
      </div>
    </>
  );
}
