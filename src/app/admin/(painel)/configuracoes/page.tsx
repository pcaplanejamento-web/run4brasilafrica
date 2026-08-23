"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Backend } from "@/lib/content/store";
import type {
  Analytics,
  Branding,
  CertificateConfig,
  Cloudinary,
  ContactLinks,
  EventInfo,
  HeaderCta,
  Organizer,
  OrganizersSection,
  PrivacySection,
  ThemeColors,
} from "@/lib/content/types";
import { homeAnchorTargets } from "@/lib/content/sections";
import ImageUpload from "@/components/admin/ImageUpload";
import EditionsManager from "@/components/admin/EditionsManager";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageTitle,
  SaveBar,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import ChangePassword from "@/components/admin/ChangePassword";

const BACKEND_LABEL: Record<Backend, { text: string; dot: string; tone: string }> = {
  backend: { text: "Backend conectado (Cloudflare D1)", dot: "#4a9d5f", tone: "#2f7a45" },
  seed: {
    text: "Backend conectado — usando conteúdo padrão (nada salvo ainda)",
    dot: "#4a9d5f",
    tone: "#2f7a45",
  },
  local: {
    text: "Sem backend — salvando apenas neste navegador",
    dot: "#d9a441",
    tone: "#9a6b12",
  },
  unset: {
    text: "Backend não configurado (rodando localmente)",
    dot: "#d9a441",
    tone: "#9a6b12",
  },
  error: { text: "Backend inacessível", dot: "#c0392b", tone: "#a83227" },
};

function ConfiguracoesForm({
  initialEvent,
  initialBranding,
  initialHeaderCta,
  initialCertificate,
  initialTheme,
  initialCloudinary,
  initialAnalytics,
  initialPrivacy,
  initialOrganizers,
  initialContact,
  cloudinaryUpload,
}: {
  initialEvent: EventInfo;
  initialBranding: Branding;
  initialHeaderCta: HeaderCta;
  initialCertificate: CertificateConfig;
  initialTheme: ThemeColors;
  initialCloudinary: Cloudinary;
  initialAnalytics: Analytics;
  initialPrivacy: PrivacySection;
  initialOrganizers: OrganizersSection;
  initialContact: ContactLinks;
  cloudinaryUpload?: { cloudName?: string; uploadPreset?: string };
}) {
  const { save, reset, reload, backend, status, content } = useContent();
  const [event, setEvent] = useState<EventInfo>(initialEvent);
  const [branding, setBranding] = useState(initialBranding);
  const [headerCta, setHeaderCta] = useState<HeaderCta>(initialHeaderCta);
  const [cert, setCert] = useState<CertificateConfig>(initialCertificate);
  const headerTargets = homeAnchorTargets(content);
  const [theme, setTheme] = useState<ThemeColors>(initialTheme);
  const [cloudinary, setCloudinary] = useState<Cloudinary>(initialCloudinary);
  const [analytics, setAnalytics] = useState<Analytics>(initialAnalytics);
  const [privacy, setPrivacy] = useState<PrivacySection>(initialPrivacy);
  const [contact, setContact] = useState<ContactLinks>(initialContact);
  const [organizers, setOrganizers] = useState<OrganizersSection>({
    enabled: initialOrganizers.enabled !== false,
    title: initialOrganizers.title ?? "",
    body: initialOrganizers.body ?? "",
    people: initialOrganizers.people ?? [],
  });

  const orgPeople = organizers.people ?? [];
  function setOrg(i: number, patch: Partial<Organizer>) {
    setOrganizers((o) => ({
      ...o,
      people: (o.people ?? []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }
  function removeOrg(i: number) {
    setOrganizers((o) => ({
      ...o,
      people: (o.people ?? []).filter((_, idx) => idx !== i),
    }));
  }
  function addOrg() {
    setOrganizers((o) => ({
      ...o,
      people: [...(o.people ?? []), { name: "Novo organizador", username: "" }],
    }));
  }

  const b = BACKEND_LABEL[backend];

  function setEv<K extends keyof EventInfo>(key: K, value: EventInfo[K]) {
    setEvent((ev) => ({ ...ev, [key]: value }));
  }

  async function handleReset() {
    if (
      !window.confirm(
        "Restaurar todo o conteúdo do site para o padrão? As alterações salvas serão perdidas.",
      )
    )
      return;
    await reset();
    // Reload so every ADM form re-hydrates from the now-reset (seed) content —
    // otherwise the forms still hold the OLD values and the next save would
    // silently write them back over the reset.
    window.location.reload();
  }

  const THEME_FIELDS: { key: keyof ThemeColors; label: string; def: string }[] = [
    { key: "background", label: "Fundo do site", def: "#2b2119" },
    { key: "headerBg", label: "Cor do header (topo)", def: "#2b2119" },
    { key: "footerBg", label: "Cor do rodapé", def: "#1a130d" },
    { key: "accent", label: "Cor de destaque", def: "#c8ce2e" },
    { key: "accentText", label: "Texto sobre o destaque", def: "#211a08" },
    { key: "text", label: "Cor do texto", def: "#f2ede4" },
    { key: "surfaces", label: "Cor interna dos componentes (cartões e painéis)", def: "#2b2018" },
    { key: "heroRed", label: "Vermelho do hero", def: "#c05a3a" },
  ];

  return (
    <>
      <div className="mb-7">
        <PageTitle>Configurações</PageTitle>
      </div>

      <div className="flex max-w-[760px] flex-col gap-5">
        {/* Backend status */}
        <Card>
          <SectionLabel>Conexão com o backend</SectionLabel>
          <div className="flex items-center gap-2 text-[14px]" style={{ color: b.tone }}>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: b.dot }}
            />
            {b.text}
          </div>
          <p className="mt-2 text-[13px] leading-[1.6] text-adm-muted">
            O conteúdo é gravado no Cloudflare D1 (o banco do próprio site). Rodando
            localmente sem o binding, as alterações ficam apenas neste navegador; no
            site publicado, salvam para todos os visitantes na hora.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <GhostButton
              onClick={() => reload()}
              className="min-h-11 px-4 py-2.5 text-[13px]"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Testando..." : "Testar conexão"}
            </GhostButton>
          </div>
        </Card>

        {/* Gestão das edições — escolhe qual edição editar (dirige todos os cards
            abaixo) + criar/ativar/excluir/copiar/pré-visualizar. */}
        <EditionsManager />

        {/* Identidade do evento — POR EDIÇÃO (cada edição tem a sua). */}
        <Card>
          <SectionLabel>Identidade do evento (desta edição)</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Nome do evento</FieldLabel>
              <TextInput
                value={event.brandName}
                onChange={(e) => setEv("brandName", e.target.value)}
                placeholder="Run4BrasilAfrica"
              />
            </div>
            <div>
              <FieldLabel>Ano da edição</FieldLabel>
              <TextInput
                value={event.editionYear}
                onChange={(e) => setEv("editionYear", e.target.value)}
                placeholder="2026"
              />
            </div>
            <div>
              <FieldLabel>Cidade</FieldLabel>
              <TextInput
                value={event.city}
                onChange={(e) => setEv("city", e.target.value)}
                placeholder="Rio de Janeiro"
              />
            </div>
            <div>
              <FieldLabel>Data / local (rótulo do banner)</FieldLabel>
              <TextInput
                value={event.dateLabel}
                onChange={(e) => setEv("dateLabel", e.target.value)}
                placeholder="14 SET 2026 · RIO DE JANEIRO"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Chamada principal (headline do hero)</FieldLabel>
              <TextInput
                value={event.tagline}
                onChange={(e) => setEv("tagline", e.target.value)}
                placeholder="Corra por algo maior"
              />
            </div>
          </div>
        </Card>

        {/* Marca: logo + favicon */}
        <Card>
          <SectionLabel>Logo e favicon</SectionLabel>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel>Logo do site (cabeçalho/rodapé)</FieldLabel>
              <ImageUpload
                value={branding.logo}
                onChange={(url) => setBranding({ ...branding, logo: url })}
                aspect="wide"
                fit="contain"
                className="bg-[#2b2118]"
                label="logo"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                PNG com fundo transparente funciona melhor. Substitui o texto
                &ldquo;RUN4BRASILAFRICA&rdquo;.
              </p>
            </div>
            <div>
              <FieldLabel>Favicon (ícone da aba do navegador)</FieldLabel>
              <ImageUpload
                value={branding.favicon}
                onChange={(url) => setBranding({ ...branding, favicon: url })}
                aspect="square"
                fit="contain"
                className="max-w-[200px] bg-[#2b2118]"
                label="favicon"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Imagem quadrada pequena (ex.: PNG 64×64 ou 128×128).
              </p>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Imagem de compartilhamento (WhatsApp / redes)</FieldLabel>
              <ImageUpload
                value={branding.ogImage}
                onChange={(url) => setBranding({ ...branding, ogImage: url })}
                aspect="og"
                className="max-w-[520px] bg-[#2b2118]"
                label="imagem de compartilhamento"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Aparece ao compartilhar o link (proporção 1200×630). Se vazio, usa a
                imagem padrão. Atualize-a se mudar a data/cidade do evento.
              </p>
            </div>
          </div>
        </Card>

        {/* Botão do topo (header): texto + destino, POR EDIÇÃO */}
        <Card>
          <SectionLabel>Botão do topo (header)</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Personalize o botão do cabeçalho — o texto e para onde ele leva — ou oculte-o
            para não aparecer nada.
          </p>
          <div className="mb-3">
            <FieldLabel>Exibição</FieldLabel>
            <Select
              value={headerCta.hidden ? "hidden" : "show"}
              onChange={(e) => setHeaderCta((h) => ({ ...h, hidden: e.target.value === "hidden" }))}
            >
              <option value="show">Mostrar botão</option>
              <option value="hidden">Ocultar (não aparece nada)</option>
            </Select>
          </div>
          {!headerCta.hidden && (
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Texto do botão</FieldLabel>
                <TextInput
                  value={headerCta.label ?? ""}
                  onChange={(e) => setHeaderCta((h) => ({ ...h, label: e.target.value }))}
                  placeholder="Ex.: Inscreva-se"
                />
              </div>
              <div>
                <FieldLabel>Ação ao clicar</FieldLabel>
                <Select
                  value={headerCta.target ?? "section"}
                  onChange={(e) =>
                    setHeaderCta((h) => ({ ...h, target: e.target.value as "section" | "link" }))
                  }
                >
                  <option value="section">Rolar até uma seção da tela inicial</option>
                  <option value="link">Abrir um link</option>
                </Select>
              </div>
              {(headerCta.target ?? "section") === "section" ? (
                <div>
                  <FieldLabel>Seção de destino</FieldLabel>
                  <Select
                    value={headerCta.section ?? "top"}
                    onChange={(e) => setHeaderCta((h) => ({ ...h, section: e.target.value }))}
                  >
                    {headerTargets.map((t) => (
                      <option key={t.anchor} value={t.anchor}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div>
                  <FieldLabel>Link (URL)</FieldLabel>
                  <TextInput
                    value={headerCta.url ?? ""}
                    onChange={(e) => setHeaderCta((h) => ({ ...h, url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Certificado do atleta — informações e aparência, POR EDIÇÃO */}
        <Card>
          <SectionLabel>Certificado do atleta</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Controle as informações e a aparência do certificado que os atletas emitem na
            Classificação (Resultados). Por padrão, as cores vêm da logo.
          </p>
          <div className="mb-3">
            <FieldLabel>Cores</FieldLabel>
            <Select
              value={cert.useLogoColors === false ? "custom" : "logo"}
              onChange={(e) => setCert((c) => ({ ...c, useLogoColors: e.target.value === "logo" }))}
            >
              <option value="logo">Usar as cores da logo</option>
              <option value="custom">Escolher uma cor</option>
            </Select>
            {cert.useLogoColors === false && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={cert.accent || "#7c8a1e"}
                  onChange={(e) => setCert((c) => ({ ...c, accent: e.target.value }))}
                  aria-label="Cor de destaque do certificado"
                  className="h-9 w-14 cursor-pointer rounded-md border border-adm-border bg-white p-1"
                />
                <span className="text-[11px] text-adm-muted">Cor da moldura, selo e filetes.</span>
              </div>
            )}
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Assinatura 1 — título</FieldLabel>
              <TextInput value={cert.sig1Label ?? ""} onChange={(e) => setCert((c) => ({ ...c, sig1Label: e.target.value }))} placeholder="Organização" />
            </div>
            <div>
              <FieldLabel>Assinatura 1 — linha de baixo</FieldLabel>
              <TextInput value={cert.sig1Sub ?? ""} onChange={(e) => setCert((c) => ({ ...c, sig1Sub: e.target.value }))} placeholder="(nome do evento)" />
            </div>
            <div>
              <FieldLabel>Assinatura 2 — título</FieldLabel>
              <TextInput value={cert.sig2Label ?? ""} onChange={(e) => setCert((c) => ({ ...c, sig2Label: e.target.value }))} placeholder="Direção de Prova" />
            </div>
            <div>
              <FieldLabel>Assinatura 2 — linha de baixo</FieldLabel>
              <TextInput value={cert.sig2Sub ?? ""} onChange={(e) => setCert((c) => ({ ...c, sig2Sub: e.target.value }))} placeholder="Cronometragem oficial" />
            </div>
          </div>
          <div className="mb-3">
            <FieldLabel>Mensagem opcional</FieldLabel>
            <TextArea value={cert.message ?? ""} onChange={(e) => setCert((c) => ({ ...c, message: e.target.value }))} rows={2} placeholder="Ex.: Parabéns pela sua conquista!" />
          </div>
          <div>
            <FieldLabel>Caixas de dados exibidas</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "showBib", label: "Número" },
                { key: "showTime", label: "Tempo" },
                { key: "showAgeGroup", label: "Faixa etária" },
                { key: "showTeam", label: "Equipe" },
              ] as { key: "showBib" | "showTime" | "showAgeGroup" | "showTeam"; label: string }[]).map((t) => {
                const on = cert[t.key] !== false;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setCert((c) => ({ ...c, [t.key]: !on }))}
                    aria-pressed={on}
                    className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    style={{
                      borderColor: on ? "#c8551f" : "var(--adm-border, #e2ddd2)",
                      background: on ? "#fdeee6" : "transparent",
                      color: on ? "#c8551f" : "#666",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Cores do site (tema) */}
        <Card>
          <SectionLabel>Cores do site</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Personalize as cores de todo o site. Campo vazio = cor padrão.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {THEME_FIELDS.map((f) => (
              <div key={f.key}>
                <FieldLabel>{f.label}</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme[f.key] || f.def}
                    onChange={(e) => setTheme({ ...theme, [f.key]: e.target.value })}
                    className="h-9 w-12 flex-none rounded border border-[#ccc]"
                    aria-label={f.label}
                  />
                  <TextInput
                    value={theme[f.key] ?? ""}
                    placeholder={f.def}
                    onChange={(e) => setTheme({ ...theme, [f.key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <GhostButton onClick={() => setTheme({})}>
              Restaurar cores padrão
            </GhostButton>
          </div>
        </Card>

        {/* Cloudinary (galeria) */}
        <Card>
          <SectionLabel>Galeria via Cloudinary (opcional)</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Se preenchido, as fotos da galeria passam a ser enviadas para o Cloudinary.
            Crie uma conta gratuita, um <strong>upload preset não assinado</strong> e
            informe abaixo. Vazio = usa o armazenamento próprio.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Cloud name</FieldLabel>
              <TextInput
                value={cloudinary.cloudName ?? ""}
                onChange={(e) => setCloudinary({ ...cloudinary, cloudName: e.target.value })}
                placeholder="ex.: run4brasilafrica"
              />
            </div>
            <div>
              <FieldLabel>Upload preset (não assinado)</FieldLabel>
              <TextInput
                value={cloudinary.uploadPreset ?? ""}
                onChange={(e) => setCloudinary({ ...cloudinary, uploadPreset: e.target.value })}
                placeholder="ex.: r4ba_galeria"
              />
            </div>
          </div>
        </Card>

        {/* Analytics / medição */}
        <Card>
          <SectionLabel>Analytics (medição de acessos)</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Meça quantas pessoas visitam o site e clicam em inscrever. Preencha um ou os dois —
            vazio = desligado.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Cloudflare Web Analytics — token</FieldLabel>
              <TextInput
                value={analytics.cfBeaconToken ?? ""}
                onChange={(e) => setAnalytics({ ...analytics, cfBeaconToken: e.target.value })}
                placeholder="ex.: 0123ab...(token do beacon)"
              />
            </div>
            <div>
              <FieldLabel>Google Analytics 4 — ID de medição</FieldLabel>
              <TextInput
                value={analytics.gaId ?? ""}
                onChange={(e) => setAnalytics({ ...analytics, gaId: e.target.value })}
                placeholder="ex.: G-XXXXXXXXXX"
              />
            </div>
          </div>
        </Card>

        {/* Organizadores (footer floating card) */}
        <Card>
          <SectionLabel>Organizadores</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Abre num banner flutuante ao clicar em &ldquo;Organizadores&rdquo; no
            rodapé. A foto de cada um leva ao perfil no Instagram.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Exibir &ldquo;Organizadores&rdquo; no rodapé?</FieldLabel>
              <Select
                value={organizers.enabled === false ? "nao" : "sim"}
                onChange={(e) =>
                  setOrganizers({ ...organizers, enabled: e.target.value === "sim" })
                }
              >
                <option value="sim">Sim, exibir</option>
                <option value="nao">Não, ocultar</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Título da dedicatória</FieldLabel>
              <TextInput
                value={organizers.title ?? ""}
                onChange={(e) => setOrganizers({ ...organizers, title: e.target.value })}
                placeholder="Organizadores"
              />
            </div>
            <div>
              <FieldLabel>Texto da dedicatória</FieldLabel>
              <TextArea
                value={organizers.body ?? ""}
                onChange={(e) => setOrganizers({ ...organizers, body: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-4">
              {orgPeople.map((p, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-adm-border bg-[#fbfbfa] p-4 sm:grid-cols-[140px_1fr]"
                >
                  <ImageUpload
                    value={p.photo}
                    onChange={(url) => setOrg(i, { photo: url })}
                    aspect="square"
                    fit="cover"
                    className="bg-white"
                    label="foto"
                    cloudinary={cloudinaryUpload}
                  />
                  <div className="flex flex-col gap-3">
                    <div>
                      <FieldLabel>Nome</FieldLabel>
                      <TextInput
                        value={p.name}
                        onChange={(e) => setOrg(i, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <FieldLabel>
                        Usuário do Instagram (aparece abaixo do nome e leva ao perfil ao clicar na foto)
                      </FieldLabel>
                      <TextInput
                        value={p.username ?? ""}
                        onChange={(e) => setOrg(i, { username: e.target.value })}
                        placeholder="@fulano"
                      />
                    </div>
                    <div>
                      <GhostButton onClick={() => removeOrg(i)}>Remover</GhostButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <GhostButton onClick={addOrg} className="self-start">
              + Adicionar organizador
            </GhostButton>
          </div>
        </Card>

        {/* Redes sociais */}
        <Card>
          <SectionLabel>Redes sociais</SectionLabel>
          {(
            [
              ["Instagram", "instagram"],
              ["WhatsApp", "whatsapp"],
              ["YouTube", "youtube"],
              ["E-mail de contato", "email"],
            ] as const
          ).map(([label, key]) => (
            <div
              key={key}
              className="mb-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr]"
            >
              <FieldLabel>{label}</FieldLabel>
              <TextInput
                value={contact[key]}
                onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="mt-1 grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr]">
            <FieldLabel>Botão flutuante do WhatsApp</FieldLabel>
            <Select
              value={contact.whatsappFloat ? "sim" : "nao"}
              onChange={(e) =>
                setContact({ ...contact, whatsappFloat: e.target.value === "sim" })
              }
            >
              <option value="nao">Desativado</option>
              <option value="sim">Ativado (canto inferior direito)</option>
            </Select>
          </div>
        </Card>

        {/* Doações */}
        <Card>
          <SectionLabel>Doações</SectionLabel>
          <TextInput
            value={contact.donationsUrl}
            onChange={(e) => setContact({ ...contact, donationsUrl: e.target.value })}
          />
        </Card>

        {/* Privacidade (LGPD) */}
        <Card>
          <SectionLabel>Política de privacidade</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Texto mostrado no aviso de privacidade (abre num banner flutuante no site, ao clicar
            em &ldquo;Política de Privacidade&rdquo;). As quebras de linha são mantidas.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Título</FieldLabel>
              <TextInput
                value={privacy.title ?? ""}
                onChange={(e) => setPrivacy({ ...privacy, title: e.target.value })}
                placeholder="Política de Privacidade"
              />
            </div>
            <div>
              <FieldLabel>Texto</FieldLabel>
              <TextArea
                value={privacy.body ?? ""}
                onChange={(e) => setPrivacy({ ...privacy, body: e.target.value })}
                rows={12}
              />
            </div>
          </div>
        </Card>

        {/* Change my password */}
        <ChangePassword />

        {/* Danger zone */}
        <Card>
          <SectionLabel>Restaurar conteúdo</SectionLabel>
          <p className="mb-3 text-[13px] leading-[1.6] text-adm-muted">
            Volta todo o conteúdo do site para os valores padrão de fábrica.
          </p>
          <GhostButton
            onClick={handleReset}
            className="min-h-11 border-[#e0b4b0] px-4 py-2.5 text-[13px] text-[#c0392b] hover:border-[#c0392b] hover:text-[#c0392b]"
          >
            Restaurar conteúdo padrão
          </GhostButton>
        </Card>
      </div>

      <div className="max-w-[760px]">
        <SaveBar
          onSave={() =>
            save(
              {
                event,
                branding,
                headerCta,
                certificate: cert,
                theme,
                cloudinary,
                analytics,
                privacy,
                organizers,
                contact,
              },
              "Atualizou configurações da edição",
            )
          }
        />
      </div>
    </>
  );
}

export default function ConfiguracoesPage() {
  const { hydrated, content, selectedEditionId } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    // `key` = edição selecionada: ao trocar de edição no gestor, o formulário
    // re-hidrata com a config daquela edição (todos os cards passam a editá-la).
    <ConfiguracoesForm
      key={selectedEditionId ?? "none"}
      initialEvent={content.event}
      initialBranding={content.branding ?? {}}
      initialHeaderCta={content.headerCta ?? {}}
      initialCertificate={content.certificate ?? {}}
      initialTheme={content.theme ?? {}}
      initialCloudinary={content.cloudinary ?? {}}
      initialAnalytics={content.analytics ?? {}}
      initialPrivacy={content.privacy ?? {}}
      initialOrganizers={content.organizers ?? {}}
      initialContact={content.contact}
      cloudinaryUpload={content.cloudinary}
    />
  );
}
