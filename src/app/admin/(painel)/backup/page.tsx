"use client";

import { useRef, useState } from "react";
import { useContent } from "@/lib/content/store";
import { AdmLoading, Card, GhostButton, PageTitle, PrimaryButton, SectionLabel } from "@/components/admin/ui";

export default function BackupPage() {
  const { content, hydrated, save, status } = useContent();
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!hydrated) return <AdmLoading />;

  function exportJson() {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `run4brasilafrica-backup-${day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    setMsg(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setMsg("Arquivo inválido — não é um JSON.");
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      setMsg("Arquivo inválido — não parece um backup do site.");
      return;
    }
    // Validate the shape so a malformed backup can't crash the public site
    // (it does .map/.length on these). Arrays must be arrays; objects objects.
    const p = parsed as Record<string, unknown>;
    const arrays = ["stats", "lotes", "sponsors", "testimonials", "faq", "editions", "galleryPhotos"];
    const objects = ["event", "hero", "about", "contact", "inscricao"];
    const badArr = arrays.find((k) => k in p && !Array.isArray(p[k]));
    const badObj = objects.find(
      (k) => k in p && (typeof p[k] !== "object" || p[k] === null || Array.isArray(p[k])),
    );
    if (!("event" in p) || badArr || badObj) {
      setMsg(
        `Backup inválido${badArr ? ` — "${badArr}" deveria ser uma lista` : badObj ? ` — "${badObj}" está corrompido` : ""}.`,
      );
      return;
    }
    const ok = window.confirm(
      "Isto vai SUBSTITUIR todo o conteúdo do site pelo backup enviado. Deseja continuar?",
    );
    if (!ok) return;
    const done = await save(parsed as Record<string, unknown>, "Restaurou um backup do conteúdo");
    setMsg(done ? "Backup importado com sucesso." : "Falha ao importar o backup.");
  }

  return (
    <>
      <div className="mb-7">
        <PageTitle>Backup do conteúdo</PageTitle>
      </div>

      <div className="flex max-w-[720px] flex-col gap-5">
        <Card>
          <SectionLabel>Exportar</SectionLabel>
          <p className="mb-4 text-[13px] text-adm-muted">
            Baixe um arquivo com <strong>todo o conteúdo do site</strong> (textos, lotes,
            galeria, kit, layout, etc.). Guarde em local seguro — serve para restaurar tudo
            caso algo dê errado.
          </p>
          <PrimaryButton onClick={exportJson}>Baixar backup (.json)</PrimaryButton>
        </Card>

        <Card>
          <SectionLabel>Importar / restaurar</SectionLabel>
          <p className="mb-4 text-[13px] text-adm-muted">
            Envie um arquivo de backup para <strong>substituir</strong> o conteúdo atual.
            Confirme com cuidado — a ação sobrescreve tudo.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-3">
            <GhostButton onClick={() => inputRef.current?.click()} disabled={status === "saving"}>
              Escolher arquivo de backup…
            </GhostButton>
            {msg && <span className="text-[13px] text-adm-ink">{msg}</span>}
          </div>
        </Card>

        <Card>
          <SectionLabel>Backup automático (Cloudflare)</SectionLabel>
          <p className="text-[13px] text-adm-muted">
            Além destes backups manuais, o banco (Cloudflare D1) mantém{" "}
            <strong>restauração automática</strong> de qualquer ponto dos últimos <strong>30
            dias</strong> (Time Travel) — dá para voltar o site a como estava minutos atrás,
            se necessário.
          </p>
        </Card>
      </div>
    </>
  );
}
