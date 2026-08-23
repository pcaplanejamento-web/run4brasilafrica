"use client";

import { useRef, useState } from "react";
import type { AgeBracket, ClassificacaoDisplay, ClassificacaoSection, ResultCategory } from "@/lib/content/types";
import { uid } from "@/lib/uid";
import { STANDARD_BRACKETS } from "@/lib/results/brackets";
import { deleteResults, readResultsFile, saveResults } from "@/lib/results/client";
import {
  Card,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  SectionLabel,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

/** Campos que o ADM pode ligar/desligar no pódio e na tabela compacta. */
const DISPLAY_FIELDS: { key: keyof ClassificacaoDisplay; label: string }[] = [
  { key: "netTime", label: "Tempo líquido" },
  { key: "grossTime", label: "Tempo bruto" },
  { key: "team", label: "Equipe" },
  { key: "bib", label: "Número (peito)" },
  { key: "age", label: "Idade" },
  { key: "ageGroup", label: "Faixa etária" },
  { key: "ageGroupPos", label: "Colocação na faixa" },
];

/** Formata "atualizado em" de forma curta (pt-BR), tolerante a valor ausente. */
function fmtUpdated(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Editor **controlado** da seção "Classificação" (resultados). As LINHAS de cada
 * categoria não ficam aqui — são enviadas ao servidor (KV) via `saveResults` e
 * buscadas em runtime pelo site. Aqui editamos só a config + a lista de
 * categorias (rótulo, contagem, ordem) e disparamos o upload/replace/remove.
 */
export function ClassificacaoEditor({
  value,
  onChange,
}: {
  value: ClassificacaoSection;
  onChange: (next: ClassificacaoSection) => void;
}) {
  const cats = value.categories ?? [];
  const display = value.display ?? {};
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<number | null>(null); // categoria que recebe o arquivo
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  const set = (patch: Partial<ClassificacaoSection>) => onChange({ ...value, ...patch });
  const setDisplay = (k: keyof ClassificacaoDisplay, on: boolean) =>
    set({ display: { ...display, [k]: on } });
  const setCat = (i: number, patch: Partial<ResultCategory>) =>
    set({ categories: cats.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });

  // --- Faixas etárias por categoria (viram filtro no site) ---
  const brackets = (i: number): AgeBracket[] => cats[i]?.ageBrackets ?? [];
  const setBrackets = (i: number, next: AgeBracket[]) => setCat(i, { ageBrackets: next });
  const addStandardBrackets = (i: number) =>
    setBrackets(i, STANDARD_BRACKETS.map((b) => ({ ...b, id: uid() })));
  const addBracket = (i: number) =>
    setBrackets(i, [...brackets(i), { id: uid(), label: "", min: undefined, max: undefined }]);
  const setBracket = (i: number, j: number, patch: Partial<AgeBracket>) =>
    setBrackets(i, brackets(i).map((b, k) => (k === j ? { ...b, ...patch } : b)));
  const removeBracket = (i: number, j: number) =>
    setBrackets(i, brackets(i).filter((_, k) => k !== j));
  const moveBracket = (i: number, j: number, dir: -1 | 1) => {
    const list = brackets(i);
    const k = j + dir;
    if (k < 0 || k >= list.length) return;
    const next = [...list];
    [next[j], next[k]] = [next[k], next[j]];
    setBrackets(i, next);
  };
  /** Idade do input (número) → valor ou undefined (campo vazio = sem piso/teto). */
  const ageNum = (v: string): number | undefined => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };
  const addCat = () =>
    set({ categories: [...cats, { id: uid(), label: `Categoria ${cats.length + 1}` }] });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const list = [...cats];
    [list[i], list[j]] = [list[j], list[i]];
    set({ categories: list });
  };
  const removeCat = async (i: number) => {
    const c = cats[i];
    set({ categories: cats.filter((_, idx) => idx !== i) });
    if (c?.id) await deleteResults(c.id); // remove também o blob no KV
  };

  // Upload do CSV para a categoria `target`.
  const onFile = async (file: File) => {
    if (target === null) return;
    const c = cats[target];
    if (!c) return;
    setBusy((b) => ({ ...b, [c.id]: true }));
    setMsg((m) => ({ ...m, [c.id]: "" }));
    try {
      const rows = await readResultsFile(file);
      if (rows.length === 0) {
        setMsg((m) => ({ ...m, [c.id]: "Nenhuma linha reconhecida na planilha." }));
      } else {
        const r = await saveResults(c.id, rows);
        if (r.ok) {
          setCat(target, { count: r.count ?? rows.length, updatedAt: new Date().toISOString() });
          setMsg((m) => ({ ...m, [c.id]: `${r.count ?? rows.length} corredores enviados.` }));
        } else if (r.code === "not_configured") {
          setMsg((m) => ({ ...m, [c.id]: "Envio disponível apenas no site publicado." }));
        } else {
          setMsg((m) => ({ ...m, [c.id]: r.error ?? "Falha ao enviar." }));
        }
      }
    } catch {
      setMsg((m) => ({ ...m, [c.id]: "Falha ao ler o arquivo." }));
    } finally {
      setBusy((b) => ({ ...b, [c.id]: false }));
      setTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Único input de arquivo, reaproveitado pela categoria em foco. */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      <Card>
        <SectionLabel>Título da seção</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Eyebrow (linha pequena acima)</FieldLabel>
            <TextInput
              value={value.eyebrow ?? ""}
              onChange={(e) => set({ eyebrow: e.target.value })}
              placeholder="CLASSIFICAÇÃO"
            />
          </div>
          <div>
            <FieldLabel>Título grande</FieldLabel>
            <TextInput
              value={value.title ?? ""}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Resultados"
            />
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Nota (opcional)</FieldLabel>
          <TextArea
            value={value.note ?? ""}
            onChange={(e) => set({ note: e.target.value })}
            rows={2}
            placeholder="Ex.: Resultados oficiais da prova."
          />
        </div>
        <div className="mt-4 max-w-[220px]">
          <FieldLabel>Quantos aparecem na tabela inicial</FieldLabel>
          <TextInput
            type="number"
            min={3}
            max={100}
            value={value.initialCount ?? 10}
            onChange={(e) => set({ initialCount: Math.max(3, Number(e.target.value) || 10) })}
          />
          <div className="mt-1 text-[12px] text-adm-muted">
            O restante aparece em &ldquo;Ver classificação geral&rdquo;.
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Informações exibidas (pódio e tabela)</SectionLabel>
        <p className="-mt-2 mb-3 text-[12px] text-adm-muted">
          Colocação e Nome aparecem sempre. Marque o que mais deseja mostrar (no detalhe do
          corredor aparecem todos os dados de qualquer forma).
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {DISPLAY_FIELDS.map((f) => {
            const on = display[f.key] ?? false;
            return (
              <label
                key={f.key}
                className="flex cursor-pointer items-center gap-2 rounded border border-adm-border bg-white px-3 py-2 text-[13px] text-adm-ink"
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setDisplay(f.key, e.target.checked)}
                  className="h-4 w-4 accent-terracotta"
                />
                {f.label}
              </label>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="mb-2 text-[13px] font-bold uppercase text-adm-muted">
          Categorias (viram abas no site)
        </div>
        <p className="mb-4 text-[12px] text-adm-muted">
          Uma categoria por planilha (ex.: 5KM Masculino, 5KM Feminino, 10KM…). Envie o arquivo
          <strong> .CSV</strong> exportado da cronometragem — a <strong>ordem manda</strong> (a 1ª
          abre primeiro). As listas ficam guardadas fora do conteúdo do site.
        </p>

        {cats.map((c, i) => (
          <Card key={c.id} className="mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-adm-ink">
                {c.label?.trim() || `Categoria ${i + 1}`}
                {i === 0 && (
                  <span className="ml-2 rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#2f7a45]">
                    Abre primeiro
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <GhostButton onClick={() => move(i, -1)} className="px-3 py-1.5 text-[12px]">↑</GhostButton>
                <GhostButton onClick={() => move(i, 1)} className="px-3 py-1.5 text-[12px]">↓</GhostButton>
                <GhostButton onClick={() => removeCat(i)} className="px-3 py-1.5 text-[12px] text-[#c0392b]">
                  Remover
                </GhostButton>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Nome da categoria (rótulo da aba)</FieldLabel>
                <TextInput
                  value={c.label}
                  onChange={(e) => setCat(i, { label: e.target.value })}
                  placeholder="Ex.: 5KM Masculino"
                />
                <p className="mt-1 text-[11px] text-adm-muted">
                  Este nome é a categoria usada no certificado (&ldquo;a prova de …&rdquo;).
                </p>
              </div>
              <div>
                <FieldLabel>Planilha de resultados (.CSV)</FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <GhostButton
                    onClick={() => {
                      setTarget(i);
                      fileRef.current?.click();
                    }}
                    disabled={busy[c.id]}
                    className="min-h-11 px-4"
                  >
                    {busy[c.id] ? "Enviando…" : c.count ? "Substituir planilha" : "Enviar planilha"}
                  </GhostButton>
                  {typeof c.count === "number" && (
                    <span className="text-[12px] text-adm-muted">
                      {c.count} corredores
                      {c.updatedAt ? ` · ${fmtUpdated(c.updatedAt)}` : ""}
                    </span>
                  )}
                </div>
                {msg[c.id] && <div className="mt-1.5 text-[12px] text-adm-muted">{msg[c.id]}</div>}
              </div>
            </div>

            {/* Faixas etárias — viram um filtro por idade dentro da categoria no site. */}
            <div className="mt-4 border-t border-adm-border pt-4">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <FieldLabel>Faixas etárias (filtro no site)</FieldLabel>
                <div className="flex gap-2">
                  {brackets(i).length === 0 && (
                    <GhostButton onClick={() => addStandardBrackets(i)} className="px-3 py-1.5 text-[12px]">
                      Usar faixas padrão
                    </GhostButton>
                  )}
                  <GhostButton onClick={() => addBracket(i)} className="px-3 py-1.5 text-[12px]">
                    + Faixa
                  </GhostButton>
                </div>
              </div>
              <p className="mb-2 text-[11px] text-adm-muted">
                Cada faixa vira um filtro por <strong>idade</strong> nesta categoria. Deixe a idade máxima
                vazia para &ldquo;ou mais&rdquo;. Sem faixas, a categoria mostra a lista completa.
              </p>
              {brackets(i).length > 0 && (
                <div className="flex flex-col gap-2">
                  {brackets(i).map((b, j) => (
                    <div key={b.id} className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1">
                        <GhostButton
                          onClick={() => moveBracket(i, j, -1)}
                          disabled={j === 0}
                          aria-label="Subir faixa"
                          className="px-2.5 py-1.5 text-[12px]"
                        >
                          ↑
                        </GhostButton>
                        <GhostButton
                          onClick={() => moveBracket(i, j, 1)}
                          disabled={j === brackets(i).length - 1}
                          aria-label="Descer faixa"
                          className="px-2.5 py-1.5 text-[12px]"
                        >
                          ↓
                        </GhostButton>
                      </div>
                      <div className="min-w-[150px] flex-1">
                        <TextInput
                          value={b.label}
                          onChange={(e) => setBracket(i, j, { label: e.target.value })}
                          placeholder="Ex.: 30 a 39 anos"
                        />
                      </div>
                      <div className="w-16">
                        <TextInput
                          type="number"
                          inputMode="numeric"
                          value={b.min ?? ""}
                          onChange={(e) => setBracket(i, j, { min: ageNum(e.target.value) })}
                          placeholder="mín"
                          aria-label="Idade mínima"
                        />
                      </div>
                      <span className="text-[12px] text-adm-muted">a</span>
                      <div className="w-16">
                        <TextInput
                          type="number"
                          inputMode="numeric"
                          value={b.max ?? ""}
                          onChange={(e) => setBracket(i, j, { max: ageNum(e.target.value) })}
                          placeholder="máx"
                          aria-label="Idade máxima"
                        />
                      </div>
                      <GhostButton
                        onClick={() => removeBracket(i, j)}
                        className="px-3 py-1.5 text-[12px] text-[#c0392b]"
                      >
                        Remover
                      </GhostButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}

        {cats.length === 0 && (
          <p className="mb-4 text-[13px] text-adm-muted">Nenhuma categoria ainda.</p>
        )}

        {/* Adicionar ABAIXO da última categoria. */}
        <PrimaryButton onClick={addCat} className="px-4 py-2 text-[13px]">
          + Nova categoria
        </PrimaryButton>
      </div>
    </div>
  );
}
