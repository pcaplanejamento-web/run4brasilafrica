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
          const social = sp.linkKind === "social";
          const c = sponsorTierColors[sp.tier] ?? sponsorTierColors.Bronze;
          return (
            <div
              key={i}
              className="flex flex-col gap-4 border-b border-adm-line px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:gap-5 sm:px-5"
            >
              {/* Logo AMPLIADO com "Escolher do armazenamento" sobre a imagem. */}
              <div className="w-28 shrink-0 sm:w-32">
                <ImageUpload
                  value={sp.logo}
                  onChange={(url) => set(i, { logo: url })}
                  className="aspect-square w-full bg-white"
                  fit="contain"
                  label="logo"
                  cloudinary={cloudinary}
                  pickerOverlay
                />
              </div>

              {/* Campos rotulados — um único campo de link (tipo + valor). */}
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Nome</FieldLabel>
                  <TextInput value={sp.name} onChange={(e) => set(i, { name: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Categoria</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sp.tier ?? "Bronze"}
                      onChange={(e) => set(i, { tier: e.target.value as SponsorTier })}
                    >
                      {TIERS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                    {/* Bolinha da cor da categoria (indicador; some no público se
                        "Mostrar categoria" estiver Não). */}
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={{ background: c.bg }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Tipo de link</FieldLabel>
                  <Select
                    value={sp.linkKind ?? "site"}
                    onChange={(e) => set(i, { linkKind: e.target.value as "site" | "social" })}
                  >
                    <option value="site">Site</option>
                    <option value="social">Rede social (Instagram)</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>{social ? "Instagram (@perfil ou link)" : "Endereço do site"}</FieldLabel>
                  <TextInput
                    value={sp.link}
                    onChange={(e) => set(i, { link: e.target.value })}
                    placeholder={social ? "@perfil ou instagram.com/perfil" : "exemplo.com"}
                  />
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <GhostButton onClick={() => remove(i)} className="px-3 py-2 text-[#c0392b]">
                    Remover parceiro
                  </GhostButton>
                </div>
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
