"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Edition } from "@/lib/content/types";
import { editionStatusColors } from "@/lib/content/theme";
import {
  AdmLoading,
  Badge,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  TextInput,
} from "@/components/admin/ui";

function EdicoesForm({
  initial,
  brandName,
}: {
  initial: Edition[];
  brandName: string;
}) {
  const { save } = useContent();
  const [editions, setEditions] = useState<Edition[]>(initial);

  const nextYear = () =>
    String(Math.max(0, ...editions.map((e) => Number(e.year) || 0)) + 1);

  const setEdition = (i: number, patch: Partial<Edition>) =>
    setEditions((es) => es.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  // Só UMA edição ativa: tornar `i` ativa encerra as demais.
  const makeActive = (i: number) =>
    setEditions((es) =>
      es.map((e, idx) => ({ ...e, status: idx === i ? "Ativa" : "Encerrada" })),
    );

  const remove = (i: number) =>
    setEditions((es) => {
      const wasActive = es[i].status === "Ativa";
      const rest = es.filter((_, idx) => idx !== i);
      // Se removeu a ativa e sobram edições, ativa a de maior ano.
      if (wasActive && rest.length && !rest.some((e) => e.status === "Ativa")) {
        const newestYear = Math.max(...rest.map((e) => Number(e.year) || 0));
        return rest.map((e) =>
          Number(e.year) === newestYear ? { ...e, status: "Ativa" } : e,
        );
      }
      return rest;
    });

  const add = () => {
    const year = nextYear();
    setEditions((es) => [
      { year, date: `set ${year}`, participants: "0", status: "Ativa" },
      ...es.map((e) => ({ ...e, status: "Encerrada" as const })),
    ]);
  };

  const hasActive = editions.some((e) => e.status === "Ativa");

  return (
    <>
      <PageHeader
        title="Edições do evento"
        aside={<PrimaryButton onClick={add}>+ Nova edição</PrimaryButton>}
      />

      <div className="flex max-w-[820px] flex-col gap-3.5">
        {editions.length === 0 && (
          <Card>
            <p className="text-[13px] text-adm-muted">
              Nenhuma edição. Clique em &ldquo;+ Nova edição&rdquo;.
            </p>
          </Card>
        )}

        {editions.map((e, i) => {
          const active = e.status === "Ativa";
          const c = editionStatusColors[e.status] ?? editionStatusColors.Ativa;
          return (
            <Card key={i} className={active ? "border-l-4 border-l-terracotta" : undefined}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge bg={c.bg} color={c.color}>
                    {e.status}
                  </Badge>
                  <span className="text-[14px] font-bold text-adm-ink">
                    {brandName} {e.year || "—"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!active && (
                    <GhostButton className="px-3 py-1.5" onClick={() => makeActive(i)}>
                      Tornar ativa
                    </GhostButton>
                  )}
                  <GhostButton
                    className="px-3 py-1.5 text-[#c0392b]"
                    onClick={() => remove(i)}
                  >
                    Excluir
                  </GhostButton>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel>Ano</FieldLabel>
                  <TextInput
                    value={e.year}
                    onChange={(ev) => setEdition(i, { year: ev.target.value })}
                    placeholder="2026"
                  />
                </div>
                <div>
                  <FieldLabel>Data (rótulo)</FieldLabel>
                  <TextInput
                    value={e.date}
                    onChange={(ev) => setEdition(i, { date: ev.target.value })}
                    placeholder="14 set 2026"
                  />
                </div>
                <div>
                  <FieldLabel>Inscritos</FieldLabel>
                  <TextInput
                    value={e.participants}
                    onChange={(ev) => setEdition(i, { participants: ev.target.value })}
                    placeholder="1.840"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="max-w-[820px]">
        <p className="mt-4 text-[12px] text-adm-muted">
          A edição <strong>Ativa</strong> é a que aparece na tela inicial (rótulo, SEO) e no
          Dashboard/Banner. O ano dela define o ano da edição do evento.
        </p>
        <SaveBar
          onSave={() => save({ editions }, "Atualizou as edições do evento")}
          disabled={editions.length > 0 && !hasActive}
          blockedNote="Marque uma edição como Ativa para salvar."
        />
      </div>
    </>
  );
}

export default function EdicoesPage() {
  const { content, hydrated } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <EdicoesForm
      key={content.editions.length}
      initial={content.editions}
      brandName={content.event.brandName}
    />
  );
}
