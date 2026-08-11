"use client";

import { useEffect, useState } from "react";
import type { Inscricao, Lote } from "@/lib/content/types";
import { loteStatus, sortLotes, validateLotes, type LoteStatus } from "@/lib/content/lotes";
import { uid } from "@/lib/uid";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  SectionLabel,
  TextInput,
} from "@/components/admin/ui";

const EMPTY_INSCRICAO: Inscricao = {
  title: "",
  subtitle: "",
  ctaLabel: "Inscreva-se",
  platform: "",
  url: "",
  raceDate: "",
};

/** Rótulo + cores do selo de status (igual ao público, para o ADM prever). */
const STATUS_UI: Record<LoteStatus, { label: string; bg: string; color: string }> = {
  open: { label: "Aberto", bg: "#e7f6ec", color: "#2f7a45" },
  upcoming: { label: "Em breve", bg: "#fdf2e3", color: "#9a6b12" },
  closed: { label: "Encerrado", bg: "#f0eeec", color: "#6b6a67" },
};

/**
 * Editor **controlado** de "Inscrições e Lotes", embutido no bloco `inscricao`
 * da aba: deriva de `value` a cada render (fonte única = o bloco no pai) e emite
 * via `onChange`, como os demais editores de seção. `raceDate` (dono: bloco "Dia
 * da Corrida") entra só para validar as datas.
 */
export function InscricaoLotesEditor({
  value,
  onChange,
  raceDate,
}: {
  value: { inscricao?: Inscricao; lotes?: Lote[] };
  onChange: (v: { inscricao: Inscricao; lotes: Lote[] }) => void;
  raceDate?: string;
}) {
  const inscricao = value.inscricao ?? EMPTY_INSCRICAO;
  const lotes = value.lotes ?? [];

  // "Agora" para o selo de status refletir a abertura/fechamento automáticos ao
  // vivo (atualiza a cada 30s — o status vem 100% das datas).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const emit = (nextInscricao: Inscricao, nextLotes: Lote[]) =>
    onChange({ inscricao: nextInscricao, lotes: nextLotes });
  const setInsc = (patch: Partial<Inscricao>) => emit({ ...inscricao, ...patch }, lotes);
  const setLote = (i: number, patch: Partial<Lote>) =>
    emit(inscricao, lotes.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => emit(inscricao, lotes.filter((_, idx) => idx !== i));
  const add = () =>
    emit(inscricao, [
      ...lotes,
      {
        id: `lote-${uid()}`,
        name: `Lote ${lotes.length + 1}`,
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

  // Ordena por DATA (cronológico: 1º a abrir no topo) — igual à tela inicial.
  const ordered = sortLotes(lotes).map((l) => ({ l, i: lotes.indexOf(l) }));
  const errors = validateLotes(lotes, raceDate);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionLabel>Inscrição (plataforma)</SectionLabel>
        <FieldLabel>Plataforma</FieldLabel>
        <div className="mb-3.5">
          <TextInput value={inscricao.platform} onChange={(e) => setInsc({ platform: e.target.value })} />
        </div>
        <FieldLabel>URL de inscrição padrão</FieldLabel>
        <TextInput value={inscricao.url} onChange={(e) => setInsc({ url: e.target.value })} />
        <p className="mt-2 text-[12px] text-adm-muted">
          O dia da corrida é definido no componente &ldquo;Dia da Corrida&rdquo;.
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Lotes de inscrição</SectionLabel>
          <PrimaryButton onClick={add} className="px-4 py-2 text-[13px]">
            + Novo lote
          </PrimaryButton>
        </div>
        <p className="mb-4 text-[12px] text-adm-muted">
          Cada lote <strong>abre e fecha sozinho</strong> pelas datas de{" "}
          <strong>abertura</strong> e <strong>encerramento</strong> (fuso de Brasília). O site
          ordena por data, destaca o que está aberto e mostra a contagem regressiva — não há
          botão de abrir/fechar manual. Os períodos não podem se sobrepor — um lote de cada vez.
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
          {ordered.map(({ l, i }) => {
            const st = loteStatus(l, now);
            const ui = STATUS_UI[st];
            return (
            <div
              key={l.id}
              className="rounded-lg border p-4"
              style={{
                borderColor: st === "open" ? "#4a9d5f" : "#e2e2dc",
                background: st === "open" ? "#f3faf4" : "#fff",
              }}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-adm-ink">{l.name}</span>
                  {/* Selo automático (vem das datas) — o ADM prevê o que o site mostra. */}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                    style={{ background: ui.bg, color: ui.color }}
                  >
                    {ui.label}
                  </span>
                </div>
                <GhostButton onClick={() => remove(i)} className="text-[#c0392b]">
                  Remover
                </GhostButton>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Nome</FieldLabel>
                  <TextInput value={l.name} onChange={(e) => setLote(i, { name: e.target.value })} />
                </div>
                <div className="hidden sm:block" />
                <div>
                  <FieldLabel>Abertura das inscrições</FieldLabel>
                  <TextInput type="datetime-local" value={l.openDate ?? ""} onChange={(e) => setLote(i, { openDate: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Encerramento das inscrições</FieldLabel>
                  <TextInput type="datetime-local" value={l.date} onChange={(e) => setLote(i, { date: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Texto base</FieldLabel>
                  <TextInput value={l.text} onChange={(e) => setLote(i, { text: e.target.value })} placeholder="ex.: A partir de R$ 129 · 5KM e 10KM · kit incluído" />
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
                    <input type="color" value={l.colorBg} onChange={(e) => setLote(i, { colorBg: e.target.value })} className="h-9 w-12 rounded border border-[#ccc]" />
                    <TextInput value={l.colorBg} onChange={(e) => setLote(i, { colorBg: e.target.value })} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Cor do texto</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input type="color" value={l.colorText} onChange={(e) => setLote(i, { colorText: e.target.value })} className="h-9 w-12 rounded border border-[#ccc]" />
                    <TextInput value={l.colorText} onChange={(e) => setLote(i, { colorText: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            );
          })}
          {lotes.length === 0 && (
            <div className="text-[13px] text-adm-muted">Nenhum lote. Clique em &ldquo;+ Novo lote&rdquo;.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
