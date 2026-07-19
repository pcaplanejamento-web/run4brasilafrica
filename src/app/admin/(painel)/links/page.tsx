"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { ContactLinks, Inscricao, Lote } from "@/lib/content/types";
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
  Select,
  TextInput,
} from "@/components/admin/ui";

function LinksForm({
  initialInscricao,
  initialContact,
  initialLotes,
}: {
  initialInscricao: Inscricao;
  initialContact: ContactLinks;
  initialLotes: Lote[];
}) {
  const { save } = useContent();
  const [inscricao, setInscricao] = useState(initialInscricao);
  const [contact, setContact] = useState(initialContact);
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
        <PageTitle>Links & inscrição</PageTitle>
      </div>

      <div className="flex max-w-[820px] flex-col gap-5">
        <Card>
          <SectionLabel>Inscrição (plataforma)</SectionLabel>
          <FieldLabel>Plataforma</FieldLabel>
          <div className="mb-3.5">
            <TextInput
              value={inscricao.platform}
              onChange={(e) => setInscricao({ ...inscricao, platform: e.target.value })}
            />
          </div>
          <FieldLabel>URL de inscrição padrão</FieldLabel>
          <div className="mb-3.5">
            <TextInput
              value={inscricao.url}
              onChange={(e) => setInscricao({ ...inscricao, url: e.target.value })}
            />
          </div>
          <FieldLabel>Dia da corrida</FieldLabel>
          <TextInput
            type="datetime-local"
            value={inscricao.raceDate ?? ""}
            onChange={(e) => setInscricao({ ...inscricao, raceDate: e.target.value })}
          />
          <p className="mt-2 text-[12px] text-adm-muted">
            Aparece na tela inicial como a faixa &ldquo;Dia da Corrida&rdquo; com contagem
            regressiva. Deve ser depois do encerramento do último lote.
          </p>
        </Card>

        {/* Lotes */}
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
            sobrepor — um lote de cada vez.
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

        <Card>
          <SectionLabel>Redes sociais</SectionLabel>
          {(
            [
              ["Instagram", "instagram"],
              ["WhatsApp", "whatsapp"],
              ["YouTube", "youtube"],
              ["E-mail de contato", "email"],
            ] as const
          ).map(([label, key]) => (
            <div
              key={key}
              className="mb-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr]"
            >
              <FieldLabel>{label}</FieldLabel>
              <TextInput
                value={contact[key]}
                onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="mt-1 grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr]">
            <FieldLabel>Botão flutuante do WhatsApp</FieldLabel>
            <Select
              value={contact.whatsappFloat ? "sim" : "nao"}
              onChange={(e) =>
                setContact({ ...contact, whatsappFloat: e.target.value === "sim" })
              }
            >
              <option value="nao">Desativado</option>
              <option value="sim">Ativado (canto inferior direito)</option>
            </Select>
          </div>
        </Card>

        <Card>
          <SectionLabel>Doações</SectionLabel>
          <TextInput
            value={contact.donationsUrl}
            onChange={(e) => setContact({ ...contact, donationsUrl: e.target.value })}
          />
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
          <SaveBar
            onSave={() =>
              save({ inscricao, contact, lotes }, "Atualizou links, lotes & inscrição")
            }
          />
        )}
      </div>
    </>
  );
}

export default function LinksPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <LinksForm
      initialInscricao={content.inscricao}
      initialContact={content.contact}
      initialLotes={content.lotes ?? []}
    />
  );
}
