"use client";

import { useContent } from "@/lib/content/store";
import { AdmLoading, PageTitle } from "@/components/admin/ui";

export default function LogPage() {
  const { content, hydrated } = useContent();

  if (!hydrated) return <AdmLoading />;

  return (
    <>
      <div className="mb-7">
        <PageTitle>Log de alterações</PageTitle>
      </div>

      <div className="overflow-hidden rounded-lg border border-adm-border bg-adm-card">
        <div className="hidden grid-cols-[140px_1fr_160px] gap-3 border-b border-[#eee] px-5 py-3 text-[12px] font-bold text-adm-muted md:grid">
          <div>DATA/HORA</div>
          <div>AÇÃO</div>
          <div>USUÁRIO</div>
        </div>
        {content.log.map((l, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-1 border-b border-adm-line px-5 py-3 text-[13px] last:border-0 md:grid-cols-[140px_1fr_160px] md:gap-3"
          >
            <div className="text-[#999]">{l.time}</div>
            <div className="text-adm-ink">{l.action}</div>
            <div className="text-[#777]">{l.user}</div>
          </div>
        ))}
      </div>
    </>
  );
}
