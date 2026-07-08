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

/**
 * Normalize a sponsor to the single-link model: one `link` + `linkKind`.
 * Legacy rows (with `instagram` set and no `linkKind`) become social links.
 */
function migrate(sp: Sponsor): Sponsor {
  if (sp.linkKind) return sp;
  if (sp.instagram) {
    return { ...sp, link: sp.instagram, linkKind: "social", instagram: undefined };
  }
  return { ...sp, linkKind: "site" };
}

function PatrocinadoresForm({
  initial,
  initialShowTier,
}: {
  initial: Sponsor[];
  initialShowTier: boolean;
}) {
  const { save } = useContent();
  const [rows, setRows] = useState<Sponsor[]>(() => initial.map(migrate));
  const [showTier, setShowTier] = useState(initialShowTier);

  function set(i: number, patch: Partial<Sponsor>) {
    setRows((r) => r.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((r) => [
      ...r,
      { name: "Novo parceiro", tier: "Bronze", link: "", linkKind: "site" },
    ]);
  }

  return (
    <>
      <PageHeader
        title="Parceiros"
        aside={<PrimaryButton onClick={add}>+ Novo parceiro</PrimaryButton>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-adm-border bg-adm-card px-5 py-4">
        <div>
          <div className="text-[13px] font-bold text-adm-ink">Mostrar a categoria no site</div>
          <div className="text-[12px] text-adm-muted">
            Exibe a etiqueta Ouro/Prata/Bronze abaixo de cada parceiro na tela inicial.
          </div>
        </div>
        <div className="w-[120px]">
          <Select
            value={showTier ? "sim" : "nao"}
            onChange={(e) => setShowTier(e.target.value === "sim")}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-adm-border bg-adm-card">
        <div className="hidden grid-cols-[96px_1.1fr_0.8fr_0.8fr_1.1fr_88px] gap-3 border-b border-[#eee] px-5 py-3 text-[12px] font-bold text-adm-muted md:grid">
          <div>LOGO</div>
          <div>NOME</div>
          <div>CATEGORIA</div>
          <div>TIPO DE LINK</div>
          <div>LINK</div>
          <div>AÇÕES</div>
        </div>

        {rows.map((sp, i) => {
          const c = sponsorTierColors[sp.tier];
          const social = sp.linkKind === "social";
          return (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 border-b border-adm-line px-5 py-4 md:grid-cols-[96px_1.1fr_0.8fr_0.8fr_1.1fr_88px] md:items-center md:gap-3"
            >
              <ImageUpload
                value={sp.logo}
                onChange={(url) => set(i, { logo: url })}
                className="aspect-square w-full bg-white"
                fit="contain"
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
              <Select
                value={sp.linkKind ?? "site"}
                onChange={(e) => set(i, { linkKind: e.target.value as "site" | "social" })}
              >
                <option value="site">Site</option>
                <option value="social">Rede social</option>
              </Select>
              <TextInput
                value={sp.link}
                onChange={(e) => set(i, { link: e.target.value })}
                placeholder={social ? "@perfil ou link da rede" : "exemplo.com"}
              />
              <div className="flex gap-2">
                <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
              </div>
            </div>
          );
        })}
      </div>

      <SaveBar
        onSave={() =>
          save({ sponsors: rows, sponsorsShowTier: showTier }, "Atualizou parceiros")
        }
      />
    </>
  );
}

export default function PatrocinadoresPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <PatrocinadoresForm
      initial={content.sponsors}
      initialShowTier={content.sponsorsShowTier ?? false}
    />
  );
}
