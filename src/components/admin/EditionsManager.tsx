"use client";

import Link from "next/link";
import { useContent } from "@/lib/content/store";
import type { Edition } from "@/lib/content/types";
import { editionStatusColors } from "@/lib/content/theme";
import { Badge, Card, GhostButton, PrimaryButton, SectionLabel } from "@/components/admin/ui";

/** Id determinístico a partir do ano (casa com `migrate.ts`). */
function makeId(year: string, taken: Set<string>): string {
  const base = `ed-${(year || "").trim() || "x"}`;
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** Config copiada para uma edição nova (para já nascer com um visual). */
function newConfig(src?: Edition): Pick<
  Edition,
  "branding" | "theme" | "cloudinary" | "analytics" | "contact" | "organizers" | "privacy"
> {
  return {
    branding: structuredClone(src?.branding ?? {}) as Edition["branding"],
    theme: structuredClone(src?.theme ?? {}) as Edition["theme"],
    cloudinary: structuredClone(src?.cloudinary ?? {}) as Edition["cloudinary"],
    analytics: structuredClone(src?.analytics ?? {}) as Edition["analytics"],
    contact: structuredClone(src?.contact ?? {}) as Edition["contact"],
    organizers: src?.organizers ? structuredClone(src.organizers) : undefined,
    privacy: src?.privacy ? structuredClone(src.privacy) : undefined,
  };
}

/**
 * Gestão da COLEÇÃO de edições (dentro de Configurações). Lista, escolhe qual
 * editar (dirige o `selectedEditionId` do store — todo o resto de Configurações
 * passa a editar essa edição), torna ativa, exclui, pré-visualiza, cria nova (em
 * branco de seções, herdando a config da ativa) e copia seções de outra. As
 * operações estruturais salvam a coleção inteira (`save({ editions })`) na hora.
 */
export default function EditionsManager() {
  const { content, selectedEditionId, selectEdition, save } = useContent();
  const editions = content.editions ?? [];
  const brand = editions[0]?.event.brandName ?? "";

  const persist = (next: Edition[], log: string) => save({ editions: next }, log);

  const nextYear = () =>
    String(Math.max(0, ...editions.map((e) => Number(e.event.editionYear) || 0)) + 1);

  const makeActive = (id: string) =>
    persist(
      editions.map((e) => ({ ...e, status: e.id === id ? "Ativa" : "Encerrada" })),
      "Tornou uma edição ativa",
    );

  const remove = (id: string) => {
    if (!window.confirm("Excluir esta edição? Esta ação não pode ser desfeita.")) return;
    const wasActive = editions.find((e) => e.id === id)?.status === "Ativa";
    let rest = editions.filter((e) => e.id !== id);
    if (wasActive && rest.length && !rest.some((e) => e.status === "Ativa")) {
      const newestYear = Math.max(...rest.map((e) => Number(e.event.editionYear) || 0));
      rest = rest.map((e) =>
        Number(e.event.editionYear) === newestYear ? { ...e, status: "Ativa" as const } : e,
      );
    }
    if (selectedEditionId === id && rest[0]) selectEdition(rest[0].id);
    persist(rest, "Excluiu uma edição");
  };

  // Nova edição: EM BRANCO de seções, herda a config + marca da ativa (item 3).
  const add = () => {
    const year = nextYear();
    const taken = new Set(editions.map((e) => e.id));
    const src = editions.find((e) => e.status === "Ativa") ?? editions[0];
    const id = makeId(year, taken);
    const fresh: Edition = {
      id,
      status: "Ativa",
      event: {
        brandName: src?.event.brandName ?? "",
        editionYear: year,
        dateLabel: "",
        city: src?.event.city ?? "",
        tagline: "",
      },
      ...newConfig(src),
      layout: [],
      customSections: [],
    };
    const next = [fresh, ...editions.map((e) => ({ ...e, status: "Encerrada" as const }))];
    selectEdition(id);
    persist(next, "Criou uma edição nova (em branco)");
  };

  const copySectionsFrom = (targetId: string, fromId: string) => {
    const src = editions.find((e) => e.id === fromId);
    if (!src) return;
    persist(
      editions.map((e) =>
        e.id === targetId
          ? {
              ...e,
              layout: structuredClone(src.layout),
              customSections: structuredClone(src.customSections),
            }
          : e,
      ),
      "Copiou as seções de outra edição",
    );
  };

  return (
    <Card>
      <SectionLabel>Edições do evento</SectionLabel>
      <p className="-mt-1 mb-3 text-[13px] text-adm-muted">
        Cada edição tem a <strong>sua própria configuração</strong> (marca, cores, contato,
        organizadores…) e as suas seções. Escolha abaixo qual edição editar — todos os cards
        seguintes passam a alterar essa edição. Só a <strong>ativa</strong> aparece no site; as
        demais ficam ocultas e podem ser pré-visualizadas.
      </p>

      <div className="mb-3 flex justify-end">
        <PrimaryButton onClick={add}>+ Nova edição</PrimaryButton>
      </div>

      <div className="flex flex-col gap-2.5">
        {editions.map((e) => {
          const selected = e.id === selectedEditionId;
          const c = editionStatusColors[e.status] ?? editionStatusColors.Ativa;
          const others = editions.filter((o) => o.id !== e.id);
          return (
            <div
              key={e.id}
              className="rounded-lg border p-3 transition-colors"
              style={{
                borderColor: selected ? "var(--color-terracotta)" : "var(--color-adm-border)",
                background: selected ? "rgba(192,90,58,0.05)" : "transparent",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="edition-sel"
                    checked={selected}
                    onChange={() => selectEdition(e.id)}
                    className="h-4 w-4 accent-terracotta"
                  />
                  <Badge bg={c.bg} color={c.color}>
                    {e.status}
                  </Badge>
                  <span className="text-[14px] font-bold text-adm-ink">
                    {e.event.brandName || brand || "—"} {e.event.editionYear || "—"}
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={`/preview?edicao=${encodeURIComponent(e.id)}`}
                    target="_blank"
                    className="rounded-lg border border-adm-border px-2.5 py-1.5 text-[12px] text-adm-ink transition-colors hover:border-terracotta"
                  >
                    Pré-visualizar
                  </Link>
                  {e.status !== "Ativa" && (
                    <GhostButton className="px-2.5 py-1.5 text-[12px]" onClick={() => makeActive(e.id)}>
                      Tornar ativa
                    </GhostButton>
                  )}
                  <GhostButton
                    className="px-2.5 py-1.5 text-[12px] text-[#c0392b]"
                    onClick={() => remove(e.id)}
                  >
                    Excluir
                  </GhostButton>
                </div>
              </div>

              {selected && others.length > 0 && (
                <div className="mt-2.5 border-t border-adm-border pt-2.5">
                  <span className="mr-2 text-[12px] text-adm-muted">Copiar seções de:</span>
                  <span className="inline-flex flex-wrap gap-1.5">
                    {others.map((o) => (
                      <GhostButton
                        key={o.id}
                        className="px-2.5 py-1 text-[12px]"
                        onClick={() => copySectionsFrom(e.id, o.id)}
                      >
                        {o.event.brandName || brand} {o.event.editionYear}
                      </GhostButton>
                    ))}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
