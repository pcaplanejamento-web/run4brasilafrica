"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Sponsor, SponsorTier } from "@/lib/content/types";
import { sponsorTierColors } from "@/lib/content/theme";
import {
  AdmLoading,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  Select,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

const TIERS: SponsorTier[] = ["Ouro", "Prata", "Bronze"];

function PatrocinadoresForm({ initial }: { initial: Sponsor[] }) {
  const { save } = useContent();
  const [rows, setRows] = useState<Sponsor[]>(initial);

  function set(i: number, patch: Partial<Sponsor>) {
    setRows((r) => r.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((r) => [
      ...r,
      { name: "Novo patrocinador", tier: "Bronze", link: "" },
    ]);
  }

  return (
    <>
      <PageHeader
        title="Patrocinadores & apoiadores"
        aside={<PrimaryButton onClick={add}>+ Novo patrocinador</PrimaryButton>}
      />

      <div className="overflow-hidden rounded-lg border border-adm-border bg-adm-card">
        <div className="hidden grid-cols-[60px_1.4fr_1fr_1fr_120px] gap-3 border-b border-[#eee] px-5 py-3 text-[12px] font-bold text-adm-muted md:grid">
          <div>LOGO</div>
          <div>NOME</div>
          <div>CATEGORIA</div>
          <div>LINK</div>
          <div>AÇÕES</div>
        </div>

        {rows.map((sp, i) => {
          const c = sponsorTierColors[sp.tier];
          return (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 border-b border-adm-line px-5 py-4 md:grid-cols-[96px_1.4fr_1fr_1fr_120px] md:items-center md:gap-3"
            >
              <ImageUpload
                value={sp.logo}
                onChange={(url) => set(i, { logo: url })}
                className="h-16"
                label="logo"
              />
              <TextInput
                value={sp.name}
                onChange={(e) => set(i, { name: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Select
                  value={sp.tier}
                  onChange={(e) => set(i, { tier: e.target.value as SponsorTier })}
                >
                  {TIERS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
                <span
                  className="hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold lg:inline-block"
                  style={{ background: c.bg, color: c.color }}
                >
                  {sp.tier}
                </span>
              </div>
              <TextInput
                value={sp.link}
                onChange={(e) => set(i, { link: e.target.value })}
                placeholder="exemplo.com"
              />
              <div className="flex gap-2">
                <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
              </div>
            </div>
          );
        })}
      </div>

      <SaveBar onSave={() => save({ sponsors: rows }, "Atualizou patrocinadores")} />
    </>
  );
}

export default function PatrocinadoresPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <PatrocinadoresForm initial={content.sponsors} />;
}
