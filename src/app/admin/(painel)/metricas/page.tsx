"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdmLoading, Card, GhostButton, PageHeader, PrimaryButton, TextInput } from "@/components/admin/ui";

interface AthleteRow {
  name: string;
  bib: string;
  category: string;
  count: number;
  last_at: number;
}
interface DailyRow {
  day: string;
  kind: string;
  count: number;
}
interface MetricsData {
  ok: boolean;
  code?: string;
  visits: number;
  downloads: number;
  athletes: AthleteRow[];
  daily: DailyRow[];
}

function fmtDateTime(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtDayLabel(day: string): string {
  const [, m, d] = day.split("-");
  return d && m ? `${d}/${m}` : day;
}
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MetricasPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/metrics", { cache: "no-store" });
      const d = (await r.json()) as MetricsData;
      if (d.code === "not_configured") setError("Métricas disponíveis apenas no site publicado.");
      else if (!d.ok) setError("Não foi possível carregar as métricas.");
      else setError(null);
      setData({
        ok: !!d.ok,
        visits: d.visits ?? 0,
        downloads: d.downloads ?? 0,
        athletes: d.athletes ?? [],
        daily: d.daily ?? [],
      });
    } catch {
      setError("Falha de conexão.");
      setData({ ok: false, visits: 0, downloads: 0, athletes: [], daily: [] });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Série dos últimos 14 dias (acessos + downloads por dia).
  const series = useMemo(() => {
    const map = new Map<string, { visit: number; download: number }>();
    for (const r of data?.daily ?? []) {
      const cur = map.get(r.day) ?? { visit: 0, download: 0 };
      if (r.kind === "visit") cur.visit = r.count;
      else if (r.kind === "download") cur.download = r.count;
      map.set(r.day, cur);
    }
    const days = [...map.keys()].sort().slice(-14);
    const rows = days.map((day) => ({ day, ...(map.get(day) ?? { visit: 0, download: 0 }) }));
    const max = Math.max(1, ...rows.map((r) => Math.max(r.visit, r.download)));
    return { rows, max };
  }, [data]);

  const today = todayUtc();
  const todayRow = series.rows.find((r) => r.day === today);

  const athletes = useMemo(() => {
    const f = q.trim().toLowerCase();
    const list = data?.athletes ?? [];
    if (!f) return list;
    return list.filter((a) => `${a.name} ${a.bib} ${a.category}`.toLowerCase().includes(f));
  }, [data, q]);

  function exportCsv() {
    const esc = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const lines = [
      "nome,numero,categoria,downloads,ultimo_download",
      ...(data?.athletes ?? []).map(
        (a) => [esc(a.name), esc(a.bib), esc(a.category), a.count, esc(fmtDateTime(a.last_at))].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run4brasilafrica-metricas-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (data === null) return <AdmLoading />;

  const stats = [
    { label: "Acessos ao site", value: data.visits, sub: todayRow ? `+${todayRow.visit} hoje` : "" },
    { label: "Fotos baixadas", value: data.downloads, sub: todayRow ? `+${todayRow.download} hoje` : "" },
    { label: "Atletas com download", value: data.athletes.length, sub: "" },
  ];

  return (
    <>
      <PageHeader
        title="Métricas"
        aside={
          <div className="flex gap-2">
            <GhostButton onClick={load} className="px-3 py-2">Atualizar</GhostButton>
            <PrimaryButton onClick={exportCsv} disabled={data.athletes.length === 0}>Exportar CSV</PrimaryButton>
          </div>
        }
      />
      <p className="mb-5 -mt-3 text-[13px] text-adm-muted">
        Acessos ao site (1 por sessão), fotos baixadas/compartilhadas e quais atletas tiveram as
        imagens baixadas. {error ? <span className="text-[#c0392b]">{error}</span> : null}
      </p>

      <div className="max-w-[960px]">
        {/* Resumo */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="py-4">
              <div className="text-[28px] font-bold leading-none text-adm-ink">{s.value.toLocaleString("pt-BR")}</div>
              <div className="mt-1 text-[12px] text-adm-muted">{s.label}</div>
              {s.sub && <div className="mt-0.5 text-[12px] font-semibold text-[#2f7a45]">{s.sub}</div>}
            </Card>
          ))}
        </div>

        {/* Tendência (últimos dias) */}
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-adm-muted">Últimos dias</div>
            <div className="flex items-center gap-3 text-[11px] text-adm-muted">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-terracotta" /> Acessos</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#c8ce2e]" /> Downloads</span>
            </div>
          </div>
          {series.rows.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-adm-muted">Ainda sem dados.</div>
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ minHeight: 130 }}>
              {series.rows.map((r) => (
                <div key={r.day} className="flex min-w-[34px] flex-1 flex-col items-center gap-1">
                  <div className="flex h-[96px] w-full items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t bg-terracotta"
                      style={{ height: `${Math.round((r.visit / series.max) * 96)}px` }}
                      title={`${r.visit} acessos`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-[#c8ce2e]"
                      style={{ height: `${Math.round((r.download / series.max) * 96)}px` }}
                      title={`${r.download} downloads`}
                    />
                  </div>
                  <div className="text-[10px] text-adm-muted">{fmtDayLabel(r.day)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Atletas que baixaram imagens */}
        <Card>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-adm-muted">
              Atletas com imagens baixadas ({data.athletes.length})
            </div>
            <div className="sm:w-[260px]">
              <TextInput
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, nº ou categoria…"
                aria-label="Buscar atleta"
              />
            </div>
          </div>

          {data.athletes.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-adm-muted">Nenhuma foto baixada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-adm-border text-left text-[11px] uppercase tracking-[0.04em] text-adm-muted">
                    <th className="py-2 pr-3 font-semibold">Atleta</th>
                    <th className="py-2 pr-3 font-semibold">Nº</th>
                    <th className="py-2 pr-3 font-semibold">Categoria</th>
                    <th className="py-2 pr-3 text-right font-semibold">Downloads</th>
                    <th className="py-2 font-semibold">Última vez</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((a, i) => (
                    <tr key={`${a.bib}-${a.name}-${i}`} className="border-b border-adm-line last:border-0">
                      <td className="py-2 pr-3 font-semibold text-adm-ink">{a.name || "—"}</td>
                      <td className="py-2 pr-3 text-adm-muted">{a.bib || "—"}</td>
                      <td className="py-2 pr-3 text-adm-muted">{a.category || "—"}</td>
                      <td className="py-2 pr-3 text-right font-bold text-adm-ink">{a.count}</td>
                      <td className="py-2 text-[12px] text-adm-muted">{fmtDateTime(a.last_at)}</td>
                    </tr>
                  ))}
                  {athletes.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-adm-muted">Nada encontrado para &ldquo;{q}&rdquo;.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
