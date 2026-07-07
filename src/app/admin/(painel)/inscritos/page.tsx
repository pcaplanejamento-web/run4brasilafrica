"use client";

import { useCallback, useEffect, useState } from "react";
import { AdmLoading, Card, GhostButton, PageHeader, PrimaryButton } from "@/components/admin/ui";

interface Sub {
  id: number;
  email: string;
  created_at: string;
}

function fmt(iso: string): string {
  const d = iso.slice(0, 10).split("-");
  const t = iso.slice(11, 16);
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}${t ? ` ${t}` : ""}` : iso;
}

export default function InscritosPage() {
  const [subs, setSubs] = useState<Sub[] | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/subscribe");
      const d = (await r.json()) as { ok: boolean; subscribers?: Sub[] };
      setSubs(d.ok && d.subscribers ? d.subscribers : []);
    } catch {
      setSubs([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function remove(id: number) {
    if (!window.confirm("Remover este e-mail da lista?")) return;
    await fetch(`/api/subscribe?id=${id}`, { method: "DELETE" });
    load();
  }

  function exportCsv() {
    const lines = ["email,data", ...(subs ?? []).map((s) => `${s.email},${s.created_at}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run4brasilafrica-avisos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (subs === null) return <AdmLoading />;

  return (
    <>
      <PageHeader
        title="Avisos por e-mail"
        aside={
          <PrimaryButton onClick={exportCsv} disabled={subs.length === 0}>
            Exportar CSV
          </PrimaryButton>
        }
      />
      <p className="mb-6 -mt-4 text-[12px] text-adm-muted">
        E-mails de quem pediu para ser avisado quando as inscrições abrirem (no site, quando um
        lote está &ldquo;em breve&rdquo;). {subs.length} no total.
      </p>

      <div className="max-w-[720px]">
        {subs.length === 0 ? (
          <Card>
            <div className="text-[13px] text-adm-muted">Nenhum e-mail cadastrado ainda.</div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col">
              {subs.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-adm-line py-2.5 text-[13px] last:border-0"
                >
                  <span className="min-w-0 flex-1 truncate text-adm-ink">{s.email}</span>
                  <span className="hidden text-[12px] text-[#999] sm:inline">{fmt(s.created_at)}</span>
                  <GhostButton onClick={() => remove(s.id)}>Remover</GhostButton>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
