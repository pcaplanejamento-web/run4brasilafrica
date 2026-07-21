"use client";

import { useState } from "react";
import Link from "next/link";
import { useContent } from "@/lib/content/store";
import type { Inscricao, Lote } from "@/lib/content/types";
import { sortLotesDesc, validateLotes } from "@/lib/content/lotes";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  PrimaryButton,
  SaveBar,
  SectionLabel,
  TextInput,
} from "@/components/admin/ui";

/**
 * "Lotes de inscrição" — CRUD dos lotes (conteúdo global usado pela seção
 * "Inscrições e Lotes" e pela barra fixa de contagem). Plataforma/URL/dia da
 * corrida e redes sociais/doações agora ficam em Configurações; aqui só os
 * lotes. `inscricao` é lido (não editado) para validar as datas e sugerir a URL
 * padrão de um novo lote.
 */
function LotesForm({
  inscricao,
  initialLotes,
}: {
  inscricao: Inscricao;
  initialLotes: Lote[];
}) {
  const { save } = useContent();
  const [lotes, setLotes] = useState<Lote[]>(initialLotes);

  function setLote(i: number, patch: Partial<Lote>) {
    setLotes((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  // Only one lote open at a time.
  function openOnly(i: number) {
    setLotes((ls) => ls.map((l, idx) => ({ ...l, open: idx === i })));
  }
  function remove(i: number) {
    setLotes((ls) => ls.filter((_, idx) => idx !== i));
  }
  function add() {
    setLotes((ls) => [
      ...ls,
      {
        id: `lote-${ls.length + 1}-${Math.floor(Date.now() / 1000)}`,
        name: `Lote ${ls.length + 1}`,
        text: "",
        ctaLabel: "Inscreva-se",
        url: inscricao.url,
        openDate: "",
        date: "",
        colorBg: "#c8ce2e",
        colorText: "#1a1400",
        open: false,
      },
    ]);
  }

  // Display regressively (Lote N…1), the same order the public site uses below
  // the highlight. `i` keeps pointing at the real index in `lotes` for edits.
  const ordered = sortLotesDesc(lotes).map((l) => ({ l, i: lotes.indexOf(l) }));

  const errors = validateLotes(lotes, inscricao.raceDate);

  return (
    <>
      <div className="mb-7">
        <PageTitle>Lotes de inscrição</PageTitle>
      </div>

      <div className="flex max-w-[820px] flex-col gap-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Lotes de inscrição</SectionLabel>
            <PrimaryButton onClick={add} className="px-4 py-2 text-[13px]">
              + Novo lote
            </PrimaryButton>
          </div>
          <p className="mb-4 text-[12px] text-adm-muted">
            Cada lote tem <strong>abertura</strong> e <strong>encerramento</strong>. O site
            decide sozinho qual está aberto pelas datas e mostra a contagem regressiva{" "}
            <strong>para a abertura</strong> (se ainda não abriu) ou{" "}
            <strong>para o encerramento</strong> (se já abriu). Os períodos não podem se
            sobrepor — um lote de cada vez. A plataforma, a URL padrão e o dia da corrida ficam
            em{" "}
            <Link href="/admin/configuracoes" className="font-semibold text-terracotta underline">
              Configurações
            </Link>
            .
          </p>

          {errors.length > 0 && (
            <div className="mb-4 rounded-lg bg-[#fdecea] px-4 py-3 text-[12px] text-[#c0392b]">
              <strong>Corrija antes de salvar:</strong>
              <ul className="mt-1 list-disc pl-5">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {ordered.map(({ l, i }) => (
              <div
                key={l.id}
                className="rounded-lg border p-4"
                style={{ borderColor: l.open ? "#4a9d5f" : "#e2e2dc", background: l.open ? "#f3faf4" : "#fff" }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-adm-ink">
                    {l.name}
                  </span>
                  <div className="flex gap-2">
                    {l.open ? (
                      <GhostButton onClick={() => setLote(i, { open: false })}>
                        Fechar lote
                      </GhostButton>
                    ) : (
                      <GhostButton onClick={() => openOnly(i)}>Abrir lote</GhostButton>
                    )}
                    <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Nome</FieldLabel>
                    <TextInput value={l.name} onChange={(e) => setLote(i, { name: e.target.value })} />
                  </div>
                  <div className="hidden sm:block" />
                  <div>
                    <FieldLabel>Abertura das inscrições</FieldLabel>
                    <TextInput
                      type="datetime-local"
                      value={l.openDate ?? ""}
                      onChange={(e) => setLote(i, { openDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Encerramento das inscrições</FieldLabel>
                    <TextInput
                      type="datetime-local"
                      value={l.date}
                      onChange={(e) => setLote(i, { date: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Texto base</FieldLabel>
                    <TextInput
                      value={l.text}
                      onChange={(e) => setLote(i, { text: e.target.value })}
                      placeholder="ex.: A partir de R$ 129 · 5KM e 10KM · kit incluído"
                    />
                  </div>
                  <div>
                    <FieldLabel>Texto do botão</FieldLabel>
                    <TextInput value={l.ctaLabel} onChange={(e) => setLote(i, { ctaLabel: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>URL de inscrição</FieldLabel>
                    <TextInput value={l.url} onChange={(e) => setLote(i, { url: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>Cor de fundo</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={l.colorBg}
                        onChange={(e) => setLote(i, { colorBg: e.target.value })}
                        className="h-9 w-12 rounded border border-[#ccc]"
                      />
                      <TextInput value={l.colorBg} onChange={(e) => setLote(i, { colorBg: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Cor do texto</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={l.colorText}
                        onChange={(e) => setLote(i, { colorText: e.target.value })}
                        className="h-9 w-12 rounded border border-[#ccc]"
                      />
                      <TextInput value={l.colorText} onChange={(e) => setLote(i, { colorText: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {lotes.length === 0 && (
              <div className="text-[13px] text-adm-muted">
                Nenhum lote. Clique em &ldquo;+ Novo lote&rdquo;.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="max-w-[820px]">
        {errors.length > 0 ? (
          <div className="mt-6 flex items-center justify-end gap-3">
            <span className="text-[13px] font-semibold text-[#c0392b]">
              Corrija as datas dos lotes / dia da corrida para salvar.
            </span>
            <PrimaryButton disabled>Salvar alterações</PrimaryButton>
          </div>
        ) : (
          <SaveBar onSave={() => save({ lotes }, "Atualizou lotes de inscrição")} />
        )}
      </div>
    </>
  );
}

export default function LotesPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <LotesForm inscricao={content.inscricao} initialLotes={content.lotes ?? []} />;
}
