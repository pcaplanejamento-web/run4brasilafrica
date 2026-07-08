"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useContent } from "@/lib/content/store";
import type { PartnerLead, PartnerKind, SejaParceiroSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

const ASPECT_OPTIONS = [
  { value: "16/9", label: "16:9 (widescreen)" },
  { value: "4/3", label: "4:3 (paisagem)" },
  { value: "1/1", label: "1:1 (quadrado)" },
  { value: "3/4", label: "3:4 (retrato)" },
  { value: "9/16", label: "9:16 (Reels)" },
  { value: "21/9", label: "21:9 (cinema)" },
];

function fmt(iso: string): string {
  const d = iso.slice(0, 10).split("-");
  const t = iso.slice(11, 16);
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}${t ? ` ${t}` : ""}` : iso;
}

const KIND_LABEL: Record<PartnerKind, string> = {
  fisica: "Pessoa física",
  juridica: "Pessoa jurídica",
};

/** Build a wa.me link; assumes Brazil (+55) when no country code is present. */
function waLink(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}`;
}

function SejaParceiroPanel({ initial }: { initial: SejaParceiroSection }) {
  const { save } = useContent();

  const [cfg, setCfg] = useState<SejaParceiroSection>(initial);
  const set = (patch: Partial<SejaParceiroSection>) => setCfg((c) => ({ ...c, ...patch }));

  const [leads, setLeads] = useState<PartnerLead[] | null>(null);
  const [filter, setFilter] = useState<"todos" | PartnerKind>("todos");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/partners");
      const d = (await r.json()) as { ok: boolean; partners?: PartnerLead[] };
      setLeads(d.ok && d.partners ? d.partners : []);
    } catch {
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const shown = useMemo(
    () => (leads ?? []).filter((l) => filter === "todos" || l.kind === filter),
    [leads, filter],
  );

  async function remove(id: number) {
    if (!window.confirm("Remover este cadastro?")) return;
    await fetch(`/api/partners?id=${id}`, { method: "DELETE" });
    load();
  }

  function exportCsv() {
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      "nome,email,telefone,tipo,whatsapp,mensagem,data",
      ...shown.map((l) =>
        [
          esc(l.name),
          esc(l.email),
          esc(l.phone),
          KIND_LABEL[l.kind],
          l.hasWhatsapp ? "sim" : "nao",
          esc(l.message),
          l.created_at,
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run4brasilafrica-parceiros-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = leads?.length ?? 0;

  return (
    <>
      <PageHeader title="Seja um Parceiro" />

      <Card>
        <SectionLabel>Texto da seção no site</SectionLabel>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <FieldLabel>Título</FieldLabel>
            <TextInput value={cfg.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Legenda / chamada</FieldLabel>
            <TextArea
              value={cfg.subtitle ?? ""}
              onChange={(e) => set({ subtitle: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionLabel>Vídeo promocional</SectionLabel>
              <div className="mt-1 text-[12px] text-adm-muted">
                Cadastre o vídeo abaixo a qualquer momento; o botão só define se ele aparece no
                site. Ativado: à esquerda do formulário (desktop) / acima dele (mobile).
              </div>
            </div>
            <div className="w-[150px]">
              <Select
                value={cfg.videoEnabled ? "sim" : "nao"}
                onChange={(e) => set({ videoEnabled: e.target.value === "sim" })}
              >
                <option value="nao">Desativado</option>
                <option value="sim">Ativado</option>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-adm-line pt-4">
              <div>
                <FieldLabel>Link do vídeo no YouTube</FieldLabel>
                <TextInput
                  value={cfg.videoUrl ?? ""}
                  onChange={(e) => set({ videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Proporção</FieldLabel>
                  <Select
                    value={cfg.aspectRatio ?? "16/9"}
                    onChange={(e) => set({ aspectRatio: e.target.value })}
                  >
                    {ASPECT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Exibição</FieldLabel>
                  <Select
                    value={cfg.clickToPlay ? "click" : "auto"}
                    onChange={(e) => set({ clickToPlay: e.target.value === "click" })}
                  >
                    <option value="auto">Tocar automático (mudo)</option>
                    <option value="click">Clique para começar</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Iniciar com som?</FieldLabel>
                  <Select
                    value={cfg.videoStartMuted === false ? "sim" : "nao"}
                    onChange={(e) => set({ videoStartMuted: e.target.value !== "sim" })}
                  >
                    <option value="nao">Não — começa mudo</option>
                    <option value="sim">Sim — som ao interagir</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Controles do YouTube</FieldLabel>
                  <Select
                    value={cfg.videoControls ? "sim" : "nao"}
                    onChange={(e) => set({ videoControls: e.target.value === "sim" })}
                  >
                    <option value="nao">Ocultar (só o vídeo)</option>
                    <option value="sim">Mostrar (play/pausa, tela cheia, compartilhar, logo)</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Legendas</FieldLabel>
                  <Select
                    value={cfg.videoCaptions ? "sim" : "nao"}
                    onChange={(e) => set({ videoCaptions: e.target.value === "sim" })}
                  >
                    <option value="nao">Não mostrar</option>
                    <option value="sim">Mostrar legendas</option>
                  </Select>
                </div>
              </div>
            </div>
        </Card>
      </div>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold text-adm-ink">Cadastros recebidos</h2>
          <span className="text-[12px] text-adm-muted">
            {total} no total{filter !== "todos" ? ` · ${shown.length} filtrados` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[190px]">
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="todos">Todos os tipos</option>
              <option value="fisica">Pessoa física</option>
              <option value="juridica">Pessoa jurídica</option>
            </Select>
          </div>
          <PrimaryButton onClick={exportCsv} disabled={shown.length === 0}>
            Exportar CSV
          </PrimaryButton>
        </div>
      </div>

      {leads === null ? (
        <AdmLoading />
      ) : shown.length === 0 ? (
        <Card>
          <div className="text-[13px] text-adm-muted">
            {total === 0
              ? "Nenhum cadastro recebido ainda."
              : "Nenhum cadastro para este filtro."}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((l) => {
            const wa = l.hasWhatsapp ? waLink(l.phone) : null;
            return (
              <div key={l.id} className="rounded-lg border border-adm-border bg-adm-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-adm-ink">{l.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          l.kind === "juridica"
                            ? "bg-[#e7eef7] text-[#245]"
                            : "bg-[#eef3e7] text-[#375]"
                        }`}
                      >
                        {KIND_LABEL[l.kind]}
                      </span>
                    </div>
                    <div className="mt-1 text-[13px] text-adm-muted">{fmt(l.created_at)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-lg bg-[#25D366] px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                      >
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-[12px] text-adm-muted">Sem WhatsApp</span>
                    )}
                    <GhostButton onClick={() => remove(l.id)}>Remover</GhostButton>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="text-[13px]">
                    <span className="text-adm-muted">E-mail: </span>
                    <a href={`mailto:${l.email}`} className="text-adm-ink underline">
                      {l.email}
                    </a>
                  </div>
                  <div className="text-[13px]">
                    <span className="text-adm-muted">Telefone: </span>
                    <span className="text-adm-ink">{l.phone}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-md bg-[#faf9f7] p-3 text-[13px] leading-[1.6] text-[#444]">
                  <span className="font-semibold text-adm-ink">O que pode ajudar: </span>
                  {l.message}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SaveBar
        onSave={() =>
          save(
            {
              sejaParceiro: {
                ...cfg,
                title: (cfg.title ?? "").trim(),
                subtitle: (cfg.subtitle ?? "").trim(),
                videoUrl: (cfg.videoUrl ?? "").trim(),
              },
            },
            "Atualizou Seja um Parceiro",
          )
        }
      />
    </>
  );
}

export default function SejaParceiroPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <SejaParceiroPanel initial={content.sejaParceiro ?? {}} />;
}
