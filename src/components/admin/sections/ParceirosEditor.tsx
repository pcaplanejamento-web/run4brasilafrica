"use client";

import type { Sponsor, SponsorTier } from "@/lib/content/types";
import { sponsorTierColors } from "@/lib/content/theme";
import {
  FieldLabel,
  GhostButton,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import ImageUpload from "@/components/admin/ImageUpload";

const TIERS: SponsorTier[] = ["Ouro", "Prata", "Bronze"];

/** Normaliza um parceiro para o modelo de link único (`link` + `linkKind`). */
function migrate(sp: Sponsor): Sponsor {
  if (sp.linkKind) return sp;
  if (sp.instagram) {
    return { ...sp, link: sp.instagram, linkKind: "social", instagram: undefined };
  }
  return { ...sp, linkKind: "site" };
}

export interface ParceirosValue {
  sponsors: Sponsor[];
  sponsorsShowTier?: boolean;
  sponsorsSubtitle?: string;
  sponsorsShowCta?: boolean;
}

/** Editor controlado da seção "Parceiros" (sponsors + flags). */
export function ParceirosEditor({
  value,
  onChange,
  sejaAtiva,
  cloudinary,
}: {
  value: ParceirosValue;
  onChange: (next: ParceirosValue) => void;
  sejaAtiva: boolean;
  cloudinary?: { cloudName?: string; uploadPreset?: string };
}) {
  const rows = (value.sponsors ?? []).map(migrate);
  const showTier = value.sponsorsShowTier ?? false;
  const subtitle = value.sponsorsSubtitle ?? "";
  const showCta = value.sponsorsShowCta ?? false;
  const patch = (p: Partial<ParceirosValue>) => onChange({ ...value, sponsors: rows, ...p });
  const set = (i: number, sp: Partial<Sponsor>) =>
    patch({ sponsors: rows.map((s, idx) => (idx === i ? { ...s, ...sp } : s)) });
  const remove = (i: number) => patch({ sponsors: rows.filter((_, idx) => idx !== i) });
  const add = () =>
    patch({ sponsors: [...rows, { name: "Novo parceiro", tier: "Bronze", link: "", linkKind: "site" }] });

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-adm-border bg-adm-card px-5 py-4">
        <FieldLabel>Legenda (abaixo do título &quot;Parceiros&quot; no site)</FieldLabel>
        <TextArea
          value={subtitle}
          onChange={(e) => patch({ sponsorsSubtitle: e.target.value })}
          rows={2}
          placeholder="Ex.: Marcas que correm com a gente por uma causa maior."
        />
        <div className="mt-1 text-[12px] text-adm-muted">Opcional — em branco não exibe legenda.</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-adm-border bg-adm-card px-5 py-4">
        <div>
          <div className="text-[13px] font-bold text-adm-ink">Mostrar a categoria no site</div>
          <div className="text-[12px] text-adm-muted">
            Exibe a etiqueta Ouro/Prata/Bronze abaixo de cada parceiro.
          </div>
        </div>
        <div className="w-[120px]">
          <Select
            value={showTier ? "sim" : "nao"}
            onChange={(e) => patch({ sponsorsShowTier: e.target.value === "sim" })}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-adm-border bg-adm-card px-5 py-4">
        <div>
          <div className="text-[13px] font-bold text-adm-ink">
            Botão &quot;Seja um parceiro&quot; no título
          </div>
          <div className="text-[12px] text-adm-muted">
            {sejaAtiva
              ? "Botão ao lado do título que rola até a seção “Seja um Parceiro”."
              : "Ative a seção “Seja um Parceiro” para usar este botão."}
          </div>
        </div>
        <div className="w-[120px]">
          <Select
            value={sejaAtiva && showCta ? "sim" : "nao"}
            disabled={!sejaAtiva}
            onChange={(e) => patch({ sponsorsShowCta: e.target.value === "sim" })}
          >
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-adm-ink">Parceiros</span>
        <PrimaryButton onClick={add}>+ Novo parceiro</PrimaryButton>
      </div>

      <div className="overflow-hidden rounded-lg border border-adm-border bg-adm-card">
        {rows.map((sp, i) => {
          const c = sponsorTierColors[sp.tier];
          const social = sp.linkKind === "social";
          return (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 border-b border-adm-line px-5 py-4 md:grid-cols-[96px_1.1fr_0.8fr_0.8fr_1.1fr_0.9fr_88px] md:items-center md:gap-3"
            >
              <ImageUpload
                value={sp.logo}
                onChange={(url) => set(i, { logo: url })}
                className="aspect-square w-full bg-white"
                fit="contain"
                label="logo"
                cloudinary={cloudinary}
              />
              <TextInput value={sp.name} onChange={(e) => set(i, { name: e.target.value })} />
              <div className="flex items-center gap-2">
                <Select value={sp.tier} onChange={(e) => set(i, { tier: e.target.value as SponsorTier })}>
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
              <TextInput
                value={sp.username ?? ""}
                onChange={(e) => set(i, { username: e.target.value })}
                placeholder={social ? "vazio = usa o link social" : "@usuario (opcional)"}
              />
              <div className="flex gap-2">
                <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="px-5 py-4 text-[13px] text-adm-muted">Nenhum parceiro ainda.</div>
        )}
      </div>
    </div>
  );
}
