import type { LayoutItem, SiteContent } from "./types";

/**
 * Ordem canônica da home. Inclui as chaves das seções que viram **abas** na
 * leitura (`about`, `stats`, `depoimentos`, `faq`, …): `normalizeContent`
 * (migrate.ts) troca cada uma por `custom:sec-*` **na mesma posição**, então a
 * ordem padrão fica correta mesmo numa instalação nova. Chaves já não presentes
 * em `SECTIONS` são válidas aqui só até a migração trocá-las (antes do
 * `resolveLayout`).
 */
const SEED_LAYOUT: LayoutItem[] = [
  "hero",
  "stats",
  "about",
  "playlist",
  "percurso",
  "location",
  "raceday",
  "inscricao",
  "galeria",
  "premiacao",
  "parceiros",
  "sejaParceiro",
  "depoimentos",
  "faq",
  "kit",
  "compartilhar",
].map((key) => ({ key, enabled: true }));

/**
 * Default seed content — values ported verbatim from the Claude Design handoff
 * (design-source/project/*.dc.html). This is the source of truth the public
 * site renders and the initial state the ADM store hydrates from.
 */
export const seedContent: SiteContent = {
  event: {
    brandName: "Run4BrasilAfrica",
    editionYear: "2026",
    dateLabel: "14 SET 2026 · RIO DE JANEIRO",
    city: "Rio de Janeiro",
    tagline: "CORRA POR ALGO MAIOR.",
  },

  branding: {},

  theme: {},

  layout: SEED_LAYOUT,

  hero: {
    slides: [
      {
        id: "slide-1",
        mediaType: "image",
        videoStartMuted: true,
        subtitle: "14 SET 2026 · RIO DE JANEIRO",
        title: "CORRA POR ALGO MAIOR.",
        ctaLabel: "Garantir vaga",
        ctaUrl: "#inscricao",
      },
      {
        id: "slide-2",
        mediaType: "image",
        videoStartMuted: true,
        subtitle: "INSCRIÇÕES ABERTAS",
        title: "DUAS TERRAS. UMA LARGADA.",
        ctaLabel: "Inscreva-se",
        ctaUrl: "#inscricao",
      },
    ],
    slideDurationSeconds: 6,
    reduceMotion: true,
  },

  stats: [
    { value: "3.200+", label: "Corredores em 2025" },
    { value: "4", label: "Edições realizadas" },
    { value: "R$ 180 mil", label: "Arrecadados para a causa" },
  ],

  about: {
    eyebrow: "A CAUSA",
    title: "DUAS TERRAS. UMA LARGADA.",
    body: "Cada passo do Run4BrasilAfrica financia projetos sociais que conectam comunidades no Brasil e na África. Energia de pista, impacto real.",
    linkLabel: "Ver instituições apoiadas",
    linkUrl: "#parceiros",
    mediaType: "image",
    videoStartMuted: true,
    clickToPlay: false,
    aspectRatio: "4/3",
  },

  playlist: {
    enabled: false,
    title: "Playlist do evento",
    note: "A trilha para embalar seus treinos até a largada.",
    visible: "both",
  },

  percurso: {
    eyebrow: "O PERCURSO",
    title: "PURA ADRENALINA.",
    distance: "10 KM",
    elevation: "+84 M",
    startFinish: "COPACABANA",
    stravaRouteRef: "",
    garminRouteRef: "",
    connected: true,
  },

  inscricao: {
    title: "LOTE 2 ABERTO.",
    subtitle: "A partir de R$ 129 · 5KM e 10KM · kit incluído",
    ctaLabel: "Inscreva-se",
    platform: "Ticket Sports (parceiro)",
    url: "https://ticketsports.com.br/run4brasilafrica-2026",
    raceDate: "2026-09-14T07:00",
  },

  lotes: [
    {
      id: "lote-1",
      name: "Lote 1",
      text: "A partir de R$ 129 · 5KM e 10KM · kit incluído",
      ctaLabel: "Inscreva-se",
      url: "https://ticketsports.com.br/run4brasilafrica-2026",
      openDate: "2026-07-01T00:00",
      date: "2026-08-01T23:59",
      colorBg: "#c8ce2e",
      colorText: "#1a1400",
      open: true,
    },
    {
      id: "lote-2",
      name: "Lote 2",
      text: "A partir de R$ 149 · últimas vagas",
      ctaLabel: "Inscreva-se",
      url: "https://ticketsports.com.br/run4brasilafrica-2026",
      openDate: "2026-08-01T23:59",
      date: "2026-09-01T23:59",
      colorBg: "#c8ce2e",
      colorText: "#1a1400",
      open: false,
    },
  ],

  albums: [
    { name: "Largada", count: 48 },
    { name: "Percurso", count: 62 },
    { name: "Premiação", count: 31 },
    { name: "Comunidade", count: 27 },
  ],

  galleryPhotos: [],

  gallery: {
    buyEnabled: false,
    buyLabel: "Comprar fotos",
    slideCols: 3,
    slideRows: 2,
    slideColsMobile: 2,
    slideRowsMobile: 3,
    slideSeconds: 5,
  },

  cloudinary: {},

  analytics: {},

  premiacao: {
    eyebrow: "PREMIAÇÃO",
    title: "PÓDIO",
    note: "",
    places: [
      { place: "1º lugar", prize: "" },
      { place: "2º lugar", prize: "" },
      { place: "3º lugar", prize: "" },
    ],
    resultsLabel: "Ver resultados completos",
    resultsUrl: "",
  },

  location: {
    title: "Localização",
    venueName: "",
    address: "",
    note: "Onde a corrida acontece e como chegar.",
  },

  share: {
    title: "Compartilhe o evento",
    subtitle: "Chame a galera para correr por uma causa maior.",
  },

  customSections: [],

  privacy: {
    title: "Política de Privacidade",
    body: `Esta política explica como o Run4BrasilAfrica trata os dados pessoais informados no site, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).

QUAIS DADOS COLETAMOS
Coletamos apenas o que você envia nos formulários do site: no "Seja um Parceiro", nome, e-mail, telefone, tipo (pessoa física/jurídica) e a mensagem sobre como deseja ajudar; nos avisos por e-mail, apenas o e-mail.

PARA QUE USAMOS
Usamos esses dados exclusivamente para entrar em contato sobre parcerias e para avisar sobre inscrições/novidades do evento. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.

ONDE FICAM GUARDADOS
Os dados ficam armazenados na infraestrutura do próprio site (Cloudflare) e são acessíveis apenas à equipe organizadora autenticada. Mantemos os dados pelo tempo necessário para as finalidades acima.

SEUS DIREITOS
Você pode solicitar, a qualquer momento, o acesso, a correção ou a exclusão dos seus dados, bem como revogar o consentimento. Basta escrever para contato@run4brasilafrica.com.

Em caso de dúvidas jurídicas, consulte um advogado antes de usar este texto como versão final.`,
  },

  sejaParceiro: {
    title: "Seja um parceiro",
    subtitle:
      "Sua marca ou o seu trabalho podem impulsionar a causa. Conte como você quer ajudar e a organização entra em contato.",
    videoEnabled: false,
    aspectRatio: "16/9",
    videoStartMuted: true,
  },

  galleryTiles: [
    { album: "LARGADA" },
    { album: "PERCURSO" },
    { album: "PREMIAÇÃO" },
    { album: "COMUNIDADE" },
    { album: "LARGADA" },
    { album: "PERCURSO" },
    { album: "PREMIAÇÃO" },
    { album: "COMUNIDADE" },
  ],

  sponsors: [
    { name: "Banco Atlântico", tier: "Ouro", link: "bancoatlantico.com", linkKind: "site" },
    { name: "VoaAfrica Airlines", tier: "Ouro", link: "voaafrica.com", linkKind: "site" },
    { name: "Hidrata+", tier: "Prata", link: "hidratamais.com.br", linkKind: "site" },
    { name: "Correndo Sports", tier: "Prata", link: "correndosports.com", linkKind: "site" },
    { name: "Café Raízes", tier: "Bronze", link: "cafeaizes.com.br", linkKind: "site" },
    { name: "Estúdio Aro", tier: "Bronze", link: "estudioaro.com", linkKind: "site" },
  ],

  organizers: {
    enabled: true,
    title: "Organizadores",
    body: "Com gratidão a quem faz o Run4BrasilAfrica acontecer.",
    people: [],
  },

  sponsorsShowTier: false,

  sponsorsSubtitle: "Marcas que correm com a gente por uma causa maior.",

  sponsorsShowCta: false,

  testimonials: [
    {
      quote:
        "Correr o Run4BrasilAfrica foi sentir que cada passo tinha um propósito além da linha de chegada.",
      name: "Marina T.",
      role: "Participante 2025",
    },
    {
      quote:
        "A organização impecável e a energia da largada tornaram essa a minha corrida favorita do ano.",
      name: "Diego F.",
      role: "Participante 2024",
    },
    {
      quote:
        "Como patrocinadores, vemos um retorno de marca genuíno junto a uma causa que faz sentido apoiar.",
      name: "Camila R.",
      role: "Parceira institucional",
    },
  ],

  faq: [
    {
      q: "Como funciona a inscrição?",
      a: 'Basta clicar em "Inscreva-se" e escolher sua categoria (5km ou 10km). O pagamento é processado por nossa plataforma parceira de inscrição esportiva.',
    },
    {
      q: "O kit do atleta está incluso?",
      a: "Sim, todo inscrito recebe o kit do atleta na retirada, com camiseta oficial, número de peito e brindes dos parceiros.",
    },
    {
      q: "Posso transferir minha inscrição?",
      a: "Transferências podem ser solicitadas até 15 dias antes do evento, sujeitas a uma taxa administrativa.",
    },
    {
      q: "Como é usada a arrecadação da causa social?",
      a: "Parte do valor de cada inscrição é destinada a instituições parceiras que atuam em projetos sociais no Brasil e na África.",
    },
  ],

  kit: {
    title: "KIT DO ATLETA",
    subtitle: "Tudo que você recebe ao se inscrever.",
    regulamentoLabel: "Regulamento",
    regulamentoMode: "link",
    regulamentoUrl: "",
    regulamentoText: "",
    kitMode: "single",
    items: [
      { name: "Camiseta oficial", icon: "shirt" },
      { name: "Número de peito", icon: "bib" },
      { name: "Sacochila", icon: "backpack" },
      { name: "Boné", icon: "cap" },
      { name: "Garrafinha", icon: "bottle" },
      { name: "Medalha de finisher", icon: "medal" },
    ],
    perLote: [],
  },

  contact: {
    instagram: "instagram.com/run4brasilafrica",
    whatsapp: "+55 21 0000-0000",
    youtube: "youtube.com/@run4brasilafrica",
    email: "contato@run4brasilafrica.com",
    donationsUrl: "doacoes.run4brasilafrica.com",
    copyright: "© 2026",
    whatsappFloat: false,
  },

  /* ---- ADM-managed content ---- */

  // O seed é single-tenant; a migração (`migrateToEditions`) empacota TODO o
  // conteúdo do topo na edição **ativa** (ano = `event.editionYear`). Portanto
  // aqui a lista fica vazia — cada edição carrega seu próprio conteúdo.
  editions: [],


  log: [
    { time: "06/07 14:32", action: 'Atualizou texto da seção "Sobre a causa"', user: "Fernanda S." },
    { time: "05/07 09:10", action: 'Adicionou 3 fotos ao álbum "Largada"', user: "Bruno A." },
    { time: "03/07 18:44", action: "Reconectou token de integração Strava", user: "Fernanda S." },
    { time: "01/07 11:02", action: "Cadastrou novo patrocinador (Prata)", user: "Bruno A." },
    { time: "29/06 17:15", action: "Reordenou slides do banner", user: "Fernanda S." },
    { time: "27/06 10:03", action: "Atualizou link de inscrição", user: "Rafael L." },
    { time: "24/06 08:50", action: "Convidou novo usuário administrativo", user: "Fernanda S." },
    { time: "20/06 15:40", action: "Editou FAQ", user: "Bruno A." },
    { time: "15/06 09:22", action: "Criou edição Run4BrasilAfrica 2026", user: "Fernanda S." },
    { time: "10/06 13:05", action: 'Removeu foto do álbum "Percurso"', user: "Bruno A." },
  ],
};
