"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { ResultRow, ResultsSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

/** Parse pasted lines "pos, nome, categoria, tempo" (comma or tab separated). */
function parseRows(text: string): ResultRow[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const p = l.split(/\t|,|;/).map((x) => x.trim());
      return { pos: p[0] ?? "", name: p[1] ?? "", category: p[2] ?? "", time: p[3] ?? "" };
    });
}

function ResultsForm({ initial }: { initial: ResultsSection }) {
  const { save } = useContent();
  const [r, setR] = useState<ResultsSection>(initial);
  const [bulk, setBulk] = useState("");
  const rows = r.rows ?? [];
  const isTable = r.mode === "table";

  const setRow = (i: number, patch: Partial<ResultRow>) =>
    setR({ ...r, rows: rows.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });

  return (
    <>
      <div className="mb-7">
        <PageTitle>Resultados</PageTitle>
      </div>

      <div className="flex max-w-[900px] flex-col gap-5">
        <Card>
          <SectionLabel>Exibição</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Mostrar a seção no site?</FieldLabel>
              <Select
                value={r.enabled ? "sim" : "nao"}
                onChange={(e) => setR({ ...r, enabled: e.target.value === "sim" })}
              >
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Como mostrar os resultados</FieldLabel>
              <Select
                value={r.mode ?? "link"}
                onChange={(e) => setR({ ...r, mode: e.target.value as "link" | "table" })}
              >
                <option value="link">Link para sistema externo</option>
                <option value="table">Tabela no próprio site</option>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Título da seção</FieldLabel>
            <TextInput
              value={r.title ?? ""}
              onChange={(e) => setR({ ...r, title: e.target.value })}
              placeholder="Resultados"
            />
          </div>
        </Card>

        {isTable ? (
          <Card>
            <SectionLabel>Tabela de resultados</SectionLabel>
            <div className="mb-4">
              <FieldLabel>
                Colar em massa (uma linha por atleta: posição, nome, categoria, tempo —
                separados por vírgula ou tab)
              </FieldLabel>
              <TextArea
                rows={5}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"1, Maria Silva, 10K F, 00:42:15\n2, João Souza, 10K M, 00:43:02"}
              />
              <div className="mt-2 flex gap-2">
                <GhostButton
                  onClick={() => {
                    const parsed = parseRows(bulk);
                    if (parsed.length) {
                      setR({ ...r, rows: parsed });
                      setBulk("");
                    }
                  }}
                >
                  Substituir tabela pelo texto colado
                </GhostButton>
                <GhostButton onClick={() => setR({ ...r, rows: [...rows, { pos: "", name: "" }] })}>
                  + Linha manual
                </GhostButton>
              </div>
            </div>

            <div className="text-[12px] text-adm-muted">{rows.length} atleta(s) na tabela.</div>
            <div className="mt-2 flex max-h-[420px] flex-col gap-2 overflow-y-auto">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[54px_1fr_1fr_90px_auto] items-center gap-2">
                  <TextInput value={row.pos} onChange={(e) => setRow(i, { pos: e.target.value })} placeholder="#" />
                  <TextInput value={row.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Nome" />
                  <TextInput value={row.category ?? ""} onChange={(e) => setRow(i, { category: e.target.value })} placeholder="Categoria" />
                  <TextInput value={row.time ?? ""} onChange={(e) => setRow(i, { time: e.target.value })} placeholder="Tempo" />
                  <GhostButton onClick={() => setR({ ...r, rows: rows.filter((_, idx) => idx !== i) })}>
                    ✕
                  </GhostButton>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <SectionLabel>Link externo</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Texto do botão</FieldLabel>
                <TextInput
                  value={r.linkLabel ?? ""}
                  onChange={(e) => setR({ ...r, linkLabel: e.target.value })}
                  placeholder="Ver resultados"
                />
              </div>
              <div>
                <FieldLabel>Link (sistema de cronometragem, planilha, etc.)</FieldLabel>
                <TextInput
                  value={r.url ?? ""}
                  onChange={(e) => setR({ ...r, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="max-w-[900px]">
        <SaveBar onSave={() => save({ results: r }, "Atualizou os resultados")} />
      </div>
    </>
  );
}

export default function ResultadosPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <ResultsForm initial={content.results ?? { enabled: false, mode: "link" }} />;
}
