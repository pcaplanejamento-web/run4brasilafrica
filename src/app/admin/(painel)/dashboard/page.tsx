"use client";

import Link from "next/link";
import { useContent } from "@/lib/content/store";
import { AdmLoading, Card, PageTitle } from "@/components/admin/ui";

const QUICK_LINKS = [
  { label: "Editar banner", href: "/admin/banner" },
  { label: "Gerenciar galeria", href: "/admin/galeria" },
  { label: "Editar textos", href: "/admin/conteudo" },
  { label: "Config. Strava", href: "/admin/strava" },
  { label: "Patrocinadores", href: "/admin/patrocinadores" },
  { label: "Links & inscrição", href: "/admin/links" },
  { label: "Usuários", href: "/admin/usuarios" },
  { label: "Nova edição", href: "/admin/edicoes" },
];

export default function DashboardPage() {
  const { content, hydrated } = useContent();

  if (!hydrated) return <AdmLoading />;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Visão geral</PageTitle>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-[#777]">
            Edição ativa: {content.event.brandName} {content.event.editionYear}
          </span>
          <span className="inline-block h-[34px] w-[34px] rounded-full bg-[#ccc]" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {content.dashboardKpis.map((k) => (
          <div
            key={k.label}
            className="rounded-[10px] border border-adm-border bg-adm-card p-5"
          >
            <div className="text-[13px] text-adm-muted">{k.label}</div>
            <div className="mt-1.5 font-display text-[26px] font-bold text-terracotta md:text-[30px]">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[14px] font-bold">Acesso rápido</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-2.5 rounded-lg border border-adm-border p-4 text-[13px] font-semibold text-adm-ink transition-colors hover:border-terracotta"
              >
                <span className="h-3.5 w-3.5 flex-none rounded-[3px] bg-terracotta" />
                {q.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 text-[14px] font-bold">Últimas alterações</div>
          {content.log.slice(0, 4).map((l, i) => (
            <div
              key={i}
              className="border-b border-adm-line py-2.5 text-[13px] last:border-0"
            >
              <div className="text-adm-ink">{l.action}</div>
              <div className="mt-0.5 text-[#999]">
                {l.time} · {l.user}
              </div>
            </div>
          ))}
          <Link
            href="/admin/log"
            className="mt-3.5 inline-block text-[12px] font-semibold text-terracotta"
          >
            Ver log completo →
          </Link>
        </Card>
      </div>
    </>
  );
}
