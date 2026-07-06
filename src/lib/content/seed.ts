import type { SiteContent } from "./types";

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

  hero: {
    badge: "14 SET 2026 · RIO DE JANEIRO",
    title: "CORRA POR ALGO MAIOR.",
    ctaLabel: "Garantir vaga",
    slides: [
      { text: "14 de setembro · Rio de Janeiro", cta: "Garantir minha vaga" },
      { text: "Inscrições do Lote 2 abertas", cta: "Inscreva-se" },
      { text: "Reviva a edição de 2025", cta: "Ver galeria" },
    ],
    transition: "Fade suave",
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
  },

  percurso: {
    eyebrow: "O PERCURSO",
    title: "10KM DE PURA ADRENALINA.",
    distance: "10 KM",
    elevation: "+84 M",
    startFinish: "COPACABANA",
    stravaRouteRef: "strava.com/routes/•••••••",
    connected: true,
  },

  inscricao: {
    title: "LOTE 2 ABERTO.",
    subtitle: "A partir de R$ 129 · 5KM e 10KM · kit incluído",
    ctaLabel: "Inscreva-se",
    platform: "Ticket Sports (parceiro)",
    url: "https://ticketsports.com.br/run4brasilafrica-2026",
  },

  albums: [
    { name: "Largada", count: 48 },
    { name: "Percurso", count: 62 },
    { name: "Premiação", count: 31 },
    { name: "Comunidade", count: 27 },
  ],

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
    { name: "Banco Atlântico", tier: "Ouro", link: "bancoatlantico.com" },
    { name: "VoaAfrica Airlines", tier: "Ouro", link: "voaafrica.com" },
    { name: "Hidrata+", tier: "Prata", link: "hidratamais.com.br" },
    { name: "Correndo Sports", tier: "Prata", link: "correndosports.com" },
    { name: "Café Raízes", tier: "Bronze", link: "cafeaizes.com.br" },
    { name: "Estúdio Aro", tier: "Bronze", link: "estudioaro.com" },
  ],

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
    subtitle: "Retirada, categorias e regulamento oficial.",
    regulamentoLabel: "Regulamento",
    kitLabel: "Kit do atleta",
  },

  contact: {
    instagram: "instagram.com/run4brasilafrica",
    whatsapp: "+55 21 0000-0000",
    youtube: "youtube.com/@run4brasilafrica",
    email: "contato@run4brasilafrica.com",
    donationsUrl: "doacoes.run4brasilafrica.com",
    copyright: "© 2026",
  },

  /* ---- ADM-managed content ---- */

  contentSections: [
    {
      title: "SOBRE A CAUSA",
      body: "Cada passo do Run4BrasilAfrica financia projetos sociais que conectam comunidades no Brasil e na África. Energia de pista, impacto real.",
    },
    {
      title: "SOBRE O EVENTO",
      body: "Corrida de 10km e caminhada de 5km com concentração em Copacabana, aberta a corredores de todos os níveis.",
    },
    {
      title: "PERGUNTAS FREQUENTES — INTRODUÇÃO",
      body: "Reunimos aqui as dúvidas mais comuns sobre inscrição, kit do atleta e regras da prova.",
    },
    {
      title: "RODAPÉ / CONTATO",
      body: "contato@run4brasilafrica.com · +55 21 0000-0000",
    },
  ],

  editions: [
    { year: "2026", date: "14 set 2026", participants: "1.840", status: "Ativa" },
    { year: "2025", date: "8 set 2025", participants: "3.210", status: "Encerrada" },
    { year: "2024", date: "9 set 2024", participants: "2.480", status: "Encerrada" },
  ],

  dashboardKpis: [
    { label: "Inscritos (2026)", value: "1.840" },
    { label: "Vagas restantes", value: "660" },
    { label: "Fotos na galeria", value: "212" },
    { label: "Patrocinadores", value: "9" },
  ],

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
