"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { Backend } from "@/lib/content/store";
import type {
  Analytics,
  Branding,
  Cloudinary,
  EventInfo,
  Hero,
  Metrics,
  Organizer,
  OrganizersSection,
  PrivacySection,
  ThemeColors,
} from "@/lib/content/types";
import ImageUpload from "@/components/admin/ImageUpload";
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
  initialHero,
  initialMetrics,
  initialBranding,
  initialTheme,
  initialCloudinary,
  initialAnalytics,
  initialPrivacy,
  initialOrganizers,
  cloudinaryUpload,
}: {
  initialEvent: EventInfo;
  initialHero: Hero;
  initialMetrics: Metrics;
  initialBranding: Branding;
  initialTheme: ThemeColors;
  initialCloudinary: Cloudinary;
  initialAnalytics: Analytics;
  initialPrivacy: PrivacySection;
  initialOrganizers: OrganizersSection;
  cloudinaryUpload?: { cloudName?: string; uploadPreset?: string };
}) {
  const { save, reset, reload, backend, status } = useContent();
  const [event, setEvent] = useState(initialEvent);
  const [hero, setHero] = useState(initialHero);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [branding, setBranding] = useState(initialBranding);
  const [theme, setTheme] = useState<ThemeColors>(initialTheme);
  const [cloudinary, setCloudinary] = useState<Cloudinary>(initialCloudinary);
  const [analytics, setAnalytics] = useState<Analytics>(initialAnalytics);
  const [privacy, setPrivacy] = useState<PrivacySection>(initialPrivacy);
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
    setEvent({ ...event, [key]: value });
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
    { key: "accent", label: "Cor de destaque", def: "#c8ce2e" },
    { key: "accentText", label: "Texto sobre o destaque", def: "#211a08" },
    { key: "text", label: "Cor do texto", def: "#f2ede4" },
    { key: "sections", label: "Seções escuras", def: "#221a12" },
    { key: "cards", label: "Cartões", def: "#332619" },
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

        {/* Event info */}
        <Card>
          <SectionLabel>Identidade do evento</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Nome da marca</FieldLabel>
              <TextInput
                value={event.brandName}
                onChange={(e) => setEv("brandName", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Ano da edição</FieldLabel>
              <TextInput
                value={event.editionYear}
                onChange={(e) => setEv("editionYear", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Cidade</FieldLabel>
              <TextInput
                value={event.city}
                onChange={(e) => setEv("city", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Selo de data (badge do hero)</FieldLabel>
              <TextInput
                value={event.dateLabel}
                onChange={(e) => {
                  setEv("dateLabel", e.target.value);
                  setHero({ ...hero, badge: e.target.value });
                }}
              />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Chamada principal (título do hero)</FieldLabel>
            <TextInput
              value={hero.title}
              onChange={(e) => {
                setHero({ ...hero, title: e.target.value });
                setEv("tagline", e.target.value);
              }}
            />
          </div>
          <div className="mt-4">
            <FieldLabel>Texto do botão principal</FieldLabel>
            <TextInput
              value={hero.ctaLabel}
              onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })}
            />
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
                className="h-20 bg-[#2b2118]"
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
                className="h-20 w-20 bg-[#2b2118]"
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
                className="h-40 bg-[#2b2118]"
                label="imagem de compartilhamento"
              />
              <p className="mt-1.5 text-[12px] text-adm-muted">
                Aparece ao compartilhar o link (proporção 1200×630). Se vazio, usa a
                imagem padrão. Atualize-a se mudar a data/cidade do evento.
              </p>
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

        {/* Números do evento (manuais) */}
        <Card>
          <SectionLabel>Números do evento</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Inscritos ({event.editionYear})</FieldLabel>
              <TextInput
                value={metrics.registered}
                onChange={(e) => setMetrics({ ...metrics, registered: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Vagas restantes</FieldLabel>
              <TextInput
                value={metrics.spotsLeft}
                onChange={(e) => setMetrics({ ...metrics, spotsLeft: e.target.value })}
              />
            </div>
          </div>
          <p className="mt-2 text-[12px] text-adm-muted">
            No painel, &ldquo;Fotos na galeria&rdquo; e &ldquo;Patrocinadores&rdquo; são
            contados automaticamente.
          </p>
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
                  className="grid grid-cols-1 gap-3 rounded-lg border border-adm-border bg-[#fbfbfa] p-4 sm:grid-cols-[110px_1fr]"
                >
                  <ImageUpload
                    value={p.photo}
                    onChange={(url) => setOrg(i, { photo: url })}
                    className="aspect-square w-full bg-white"
                    fit="cover"
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
                hero,
                metrics,
                branding,
                theme,
                cloudinary,
                analytics,
                privacy,
                organizers,
              },
              "Atualizou configurações do evento",
            )
          }
        />
      </div>
    </>
  );
}

export default function ConfiguracoesPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <ConfiguracoesForm
      initialEvent={content.event}
      initialHero={content.hero}
      initialMetrics={content.metrics}
      initialBranding={content.branding ?? {}}
      initialTheme={content.theme ?? {}}
      initialCloudinary={content.cloudinary ?? {}}
      initialAnalytics={content.analytics ?? {}}
      initialPrivacy={content.privacy ?? {}}
      initialOrganizers={content.organizers ?? {}}
      cloudinaryUpload={content.cloudinary}
    />
  );
}
