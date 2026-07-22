"use client";

import { useState } from "react";
import Link from "next/link";
import { useContent } from "@/lib/content/store";
import type { Edition, EventInfo } from "@/lib/content/types";
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

/** Id determinístico a partir do ano (casa com `migrate.ts`). */
const makeId = (year: string, taken: Set<string>): string => {
  const base = `ed-${(year || "").trim() || "x"}`;
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
};

function EdicoesForm({ initial }: { initial: Edition[] }) {
  const { save } = useContent();
  const [editions, setEditions] = useState<Edition[]>(initial);

  const brand = editions[0]?.event.brandName ?? "";

  const nextYear = () =>
    String(Math.max(0, ...editions.map((e) => Number(e.event.editionYear) || 0)) + 1);

  const setEvent = (i: number, patch: Partial<EventInfo>) =>
    setEditions((es) =>
      es.map((e, idx) => (idx === i ? { ...e, event: { ...e.event, ...patch } } : e)),
    );

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
        const newestYear = Math.max(...rest.map((e) => Number(e.event.editionYear) || 0));
        return rest.map((e) =>
          Number(e.event.editionYear) === newestYear ? { ...e, status: "Ativa" } : e,
        );
      }
      return rest;
    });

  // Nova edição começa EM BRANCO (sem seções) — o ADM a configura individualmente.
  const add = () => {
    const year = nextYear();
    setEditions((es) => {
      const taken = new Set(es.map((e) => e.id));
      const fresh: Edition = {
        id: makeId(year, taken),
        status: "Ativa",
        event: {
          brandName: es[0]?.event.brandName ?? "",
          editionYear: year,
          dateLabel: "",
          city: es[0]?.event.city ?? "",
          tagline: "",
        },
        layout: [],
        customSections: [],
      };
      return [fresh, ...es.map((e) => ({ ...e, status: "Encerrada" as const }))];
    });
  };

  // Copia TODAS as seções (layout + customSections) de outra edição para a `i`.
  const copyFrom = (i: number, fromId: string) =>
    setEditions((es) => {
      const src = es.find((e) => e.id === fromId);
      if (!src) return es;
      return es.map((e, idx) =>
        idx === i
          ? {
              ...e,
              layout: structuredClone(src.layout),
              customSections: structuredClone(src.customSections),
            }
          : e,
      );
    });

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
          const others = editions.filter((o) => o.id !== e.id);
          return (
            <Card key={e.id} className={active ? "border-l-4 border-l-terracotta" : undefined}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge bg={c.bg} color={c.color}>
                    {e.status}
                  </Badge>
                  <span className="text-[14px] font-bold text-adm-ink">
                    {e.event.brandName || brand || "—"} {e.event.editionYear || "—"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/preview?edicao=${encodeURIComponent(e.id)}`}
                    target="_blank"
                    className="rounded-lg border border-adm-border px-3 py-1.5 text-[13px] text-adm-ink transition-colors hover:border-terracotta"
                  >
                    Pré-visualizar
                  </Link>
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

              {/* Identidade do evento — cada edição tem a sua, reflete em todo o site. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Nome do evento</FieldLabel>
                  <TextInput
                    value={e.event.brandName}
                    onChange={(ev) => setEvent(i, { brandName: ev.target.value })}
                    placeholder="Run4BrasilAfrica"
                  />
                </div>
                <div>
                  <FieldLabel>Ano</FieldLabel>
                  <TextInput
                    value={e.event.editionYear}
                    onChange={(ev) => setEvent(i, { editionYear: ev.target.value })}
                    placeholder="2026"
                  />
                </div>
                <div>
                  <FieldLabel>Data / local (rótulo do banner)</FieldLabel>
                  <TextInput
                    value={e.event.dateLabel}
                    onChange={(ev) => setEvent(i, { dateLabel: ev.target.value })}
                    placeholder="14 SET 2026 · RIO DE JANEIRO"
                  />
                </div>
                <div>
                  <FieldLabel>Cidade</FieldLabel>
                  <TextInput
                    value={e.event.city}
                    onChange={(ev) => setEvent(i, { city: ev.target.value })}
                    placeholder="Rio de Janeiro"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Chamada (headline do hero)</FieldLabel>
                  <TextInput
                    value={e.event.tagline}
                    onChange={(ev) => setEvent(i, { tagline: ev.target.value })}
                    placeholder="Corra por uma causa"
                  />
                </div>
              </div>

              {others.length > 0 && (
                <div className="mt-3 border-t border-adm-border pt-3">
                  <FieldLabel>Copiar todas as seções de…</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {others.map((o) => (
                      <GhostButton
                        key={o.id}
                        className="px-3 py-1.5"
                        onClick={() => copyFrom(i, o.id)}
                      >
                        {o.event.brandName || brand} {o.event.editionYear}
                      </GhostButton>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] text-adm-muted">
                    Substitui as seções desta edição pelas da edição escolhida.
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="max-w-[820px]">
        <p className="mt-4 text-[12px] text-adm-muted">
          A edição <strong>Ativa</strong> é a que aparece na tela inicial para todos. As demais
          ficam ocultas e podem ser editadas/pré-visualizadas. Cada edição tem a sua identidade e
          as suas seções.
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
  return <EdicoesForm key={content.editions.length} initial={content.editions} />;
}
