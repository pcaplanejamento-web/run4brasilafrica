# Arquitetura

Documento técnico do site Run4BrasilAfrica. Complementa o
[README](README.md) e o [Plano de Negócio](design-source/project/uploads/Plano_de_Negocio_Run4BrasilAfrica.md).

## Visão geral

Aplicação Next.js (App Router) com dois domínios de UI:

- **Site público** — renderizado no servidor (SSR/estático) a partir do modelo de
  conteúdo. Bom para SEO (KPI do Plano §10). Interatividade fica isolada em pequenas
  "ilhas" client (`"use client"`): navegação, contadores, scroll-reveal e FAQ.
- **Painel ADM** — client-side, com um _store_ de conteúdo (`ContentProvider`) que
  hidrata do seed, persiste em `localStorage` e registra um log de alterações.

## Design tokens

Toda a identidade visual está em `src/app/globals.css`, no bloco `@theme`, como
variáveis CSS (paleta em `oklch`, conectando Brasil + África). **Componentes nunca
usam cores cruas** — sempre os tokens (`bg-ink`, `text-gold`, `border-line`,
`bg-terracotta`, etc.). Trocar a paleta = editar um lugar.

Grupos: superfícies escuras do site (`--color-ink*`), acentos (`--color-gold`,
`--color-brasil`), e o tema claro do ADM (`--color-adm-*`, `--color-terracotta`).

**Título das seções da home:** todos os tópicos usam o mesmo componente
`components/site/SectionEyebrow.tsx` — o rótulo em maiúsculas na cor de destaque
(`text-[16px] md:text-[20px]`, `text-gold` → `--color-gold`, que o tema mapeia de
`accent`). Um único lugar controla tamanho e cor de todos os títulos. Assim,
trocar a cor de destaque no ADM muda **todos** os títulos de uma vez. Seções sem
slogan passam `as="h2"` (heading semântico); as que têm um slogan grande abaixo
(Percurso, A Causa, Premiação, Playlist) usam o `div` como _kicker_ acima do slogan.

Animações (`.reveal`, `.r4ba-fade`, contadores) também vivem aqui e têm _override_
completo dentro de `@media (prefers-reduced-motion: reduce)`.

## Camada de conteúdo (`src/lib/content`)

O ponto central do princípio "nada hardcoded" (Plano §8):

- **`types.ts`** — o formato de `SiteContent` (evento, hero, stats, sobre, percurso,
  inscrição, galeria, patrocinadores, depoimentos, FAQ, kit, contato + entidades do
  ADM: textos, edições, usuários, KPIs, log).
- **`seed.ts`** — o conteúdo padrão, portado verbatim do handoff. É o fallback quando
  o backend ainda não tem dados.
- **`db.ts`** — `readContent()` / `writeContent()` / `resetContent()` (server-only):
  leem/gravam o `SiteContent` no Cloudflare D1 via o binding `CONTENT_DB`. Merge sobre
  o seed e fallback total quando não há binding.
- **`store.tsx`** — `ContentProvider` + hook `useContent()` usado pelo **ADM**. Carrega
  via `/api/content`, salva com `save(patch, logAction?)`, e expõe `status`
  (`loading/saving/saved/error`), `backend`, `reload()` e `reset()`. Mantém um cache
  em `localStorage`.
- **`theme.ts`** — mapas de cor de badges (tiers de patrocínio, status de edição).

## Backend (Cloudflare D1)

Fluxo de dados:

```
Site público (browser) ── GET ──▶  /api/content ──▶ D1 (CONTENT_DB, linha id=1)
ADM (browser)          ── PUT ──▶  /api/content ──▶ D1
```

- **`src/app/api/content/route.ts`** — `GET` lê o conteúdo do D1; `PUT` grava/reseta.
  Roda no Worker, onde o binding D1 está disponível de forma confiável.
- **D1 é fortemente consistente**: a leitura logo após a gravação reflete a mudança
  para todos (diferente do KV, que propagava em até ~60s). O `SiteContent` inteiro
  fica numa única linha JSON (`content`, `id = 1`); schema em `migrations/`.
- **Primeiro paint já com o conteúdo ao vivo** (`app/page.tsx`): a home é `force-dynamic`
  e, no servidor, busca o conteúdo real via **`fetch` para `/api/content`** (o mesmo route
  handler do ADM — caminho confiável ao D1 no OpenNext), passando como `initial`. Evita o
  &ldquo;piscar&rdquo; do seed → conteúdo real. Se o fetch falhar, cai no seed. Não lemos o
  binding direto no RSC porque `getCloudflareContext()` é instável nesse ponto do OpenNext.
- **`components/site/SiteContent.tsx`** apenas renderiza o `initial` (real, vindo do servidor)
  — **sem re-fetch no cliente**, para não ter troca/piscar (cores, imagem do banner, galeria
  recarregando). Cada acesso já é fresco (a home é `force-dynamic`).
- **Tema e favicon no servidor** (`app/layout.tsx` + `lib/content/theme.ts`): o layout injeta
  `:root{--color-…}` (de `content.theme`) num `<style>` no `<head>` e o favicon via
  `metadata.icons` — cores corretas já no **primeiro paint**, sem flash. (O antigo `SiteChrome`
  que fazia isso no cliente foi removido.) `getSiteContent` (`react cache()`) faz **uma** leitura
  do D1 por request, compartilhada por layout (tema+metadados) e página.
- **Preload** da 1ª imagem do hero (`fetchPriority="high"`) e do logo no `<head>` para
  aparecerem imediatamente. Mídia enviada (`/api/media`) é servida com
  `Cache-Control: public, max-age=31536000, immutable` — fica em cache no navegador.
- **Domínio único** (`src/middleware.ts`): qualquer acesso a `www.<apex>` ou a um
  `*.workers.dev` é 308-redirecionado para `https://run4brasilafrica.com.br` (preserva
  caminho/query). Só o apex e o localhost passam direto.
- **Compartilhamento (Open Graph)**: `app/layout.tsx` usa `generateMetadata()` lendo o conteúdo
  ao vivo — **título e descrição** saem de `event` (marca, `dateLabel`, cidade), então o texto do
  card nunca diverge das Configurações. A **imagem** do card é `branding.ogImage` (upload em ADM >
  Configurações) com fallback para o **estático `public/og.png`** (1200×630). O JSON-LD
  (`EventJsonLd`) usa a mesma imagem.
  - **Por que estática e não gerada em runtime**: uma versão anterior gerava a imagem com
    `next/og` (Satori + resvg **wasm**). Isso inflou o Worker e causava **Error 1102 (exceeded
    resource limits)** intermitente em cold starts, derrubando o site inteiro. Removido — a imagem
    voltou a ser um asset leve, configurável pelo ADM (atualize-a se mudar data/cidade).
  - Redes sociais fazem cache do card; um link já compartilhado pode continuar mostrando o antigo
    até revalidar (ex.: Facebook Sharing Debugger, ou compartilhar com `?v=2`).

## Autenticação (ADM)

- Usuários e sessões no D1 (`migrations/0002_auth.sql`). Senha com **PBKDF2-SHA256**
  (Web Crypto), sessão = token opaco no D1 + cookie **HttpOnly/Secure/SameSite=Lax**.
- `src/lib/auth.ts` (hash/verify, create/get/destroy session) + `src/lib/cf.ts`
  (`getDB`). Endpoints `/api/auth/*`, `/api/users`, `/api/users/[id]`.
- **Fronteira de segurança:** `PUT /api/content` exige sessão; a API de usuários exige
  papel **Administrador geral**. A UI (`AuthProvider`) redireciona para o login quando
  não há sessão — mas a proteção real está nas rotas de escrita.
- Guardas: não é possível remover/rebaixar o **último administrador** (evita lockout).
- **Proteção contra força bruta** no login: após **5 tentativas** erradas por e-mail, bloqueia
  por **15 min** (contador em KV com TTL); acerto zera o contador. Além disso, **limite por IP**
  (30 tentativas / 15 min via `lib/antispam.ts`) barra _credential-stuffing_ com muitos e-mails
  do mesmo IP.
- **Backup** (`/admin/backup`): exportar/importar todo o `SiteContent` em JSON; além disso o
  D1 tem **Time Travel** (restauração de qualquer ponto dos últimos 30 dias).
- Em `next dev` (sem D1) a auth fica desligada (painel aberto), para desenvolvimento.

## Imagens e vídeo (mídia)

- Storage = **Cloudflare KV** (binding `MEDIA_KV`) guardando o binário + o
  `contentType` nos metadados. (R2 seria o ideal, mas não estava habilitado na conta.)
- **Upload**: `POST /api/media` (multipart, admin). Imagens (JPG/PNG/WebP/GIF/SVG,
  ≤ 8 MB) e **vídeo** (MP4/WebM/MOV, ≤ 25 MB — limite do KV). Devolve `{ url }`.
- **Servir**: `GET /api/media/[key]` com cache imutável e **suporte a Range**
  (206) para tocar/seek de vídeo. `DELETE` remove (admin).
- Componente `components/admin/ImageUpload.tsx` (prop `video`) faz o upload.
- Campos no conteúdo: mídia por slide (`hero.slides[].image`), mídia da seção A Causa
  (`about.image`), `sponsors[].logo`, `galleryPhotos[]`. O público mostra as fotos reais
  quando existem; senão, o placeholder.

## Hero: carrossel com mídia por slide + seção "A Causa"

- **`YouTubePlayer`** (`components/site/YouTubePlayer.tsx`, client) — player reutilizável
  via **YouTube IFrame API**. Autoplay sempre mudo (regra do navegador); botão de som
  (mute/unMute) por ser gesto do usuário; `startMuted=false` liga o som na 1ª interação
  da página; `clickToPlay` mostra o overlay "Clique para começar o vídeo". `ResizeObserver`
  dimensiona o iframe para **cobrir** (cover) qualquer proporção do pai, usando a proporção
  do vídeo — 16:9, ou **9:16 quando é um Short** (detectado por `/shorts/` na URL via
  `isVerticalYouTube`), para preencher a caixa sem tarjas pretas; iframe com
  `pointer-events:none` (controles por cima clicáveis). Helper `youtubeId(url)` extrai o ID.
  **Autoplay bloqueado no mobile**: se o vídeo não começa logo após ficar pronto (detecção via
  `getPlayerState`), aparece um overlay **"Tocar vídeo"** que dá play no toque — assim o vídeo
  da A Causa funciona no celular.
- **`Hero`** (client) é um carrossel de verdade sobre `hero.slides` — **só slides criados
  aparecem** (0 → não renderiza nada); **sem imagem de fundo global**. Renderiza só o slide
  ativo (1 player por vez, destruído na troca). Cada slide tem sua mídia: `mediaType:"image"`
  → `background-image` cover; `mediaType:"video"` → `YouTubePlayer` (cover) com o
  `videoStartMuted` do slide. Sobre a mídia: selo (`subtitle`), título (`title`) e botão
  (`ctaLabel`→`ctaUrl`, `_blank` se for URL externa). Indicadores clicáveis; auto-advance
  (`slideDurationSeconds`, reinicia ao escolher um slide) respeitando reduce-motion.
  Fallback de slides legados: `title||text`, `ctaLabel||cta`.
- **`Sobre`** ("A Causa", client) — caixa de mídia com a proporção escolhida
  (`about.aspectRatio`, ex. 16/9, 4/3, 1/1, 3/4, **9/16 Reels**, 21/9): imagem `object-cover`,
  ou `YouTubePlayer` (com `clickToPlay`/`videoStartMuted` do about), ou placeholder. Em
  proporções **retrato** (arH > arW, ex. 9/16) a caixa é limitada a **70vh** e a largura segue
  a proporção (centralizada), então cabe na tela — mesma regra no desktop e no mobile (é vh).
  Textos
  (`eyebrow`, `title`, `body`) e botão (`linkLabel`→`linkUrl`, fallback `#parceiros`)
  totalmente editáveis.
- **Navegação do banner**: setas (anterior/próximo) + bolinhas maiores, alvos de toque
  ≥44px, agrupadas no canto inferior direito (separadas do CTA). Auto-advance reinicia ao
  escolher um slide.
- **Config de vídeo (YouTube)**: por slide e em A Causa o ADM liga/desliga a **barra de
  controles** (`videoControls` → `controls`/`fs`: play/pausa, tela cheia, compartilhar,
  logo — a API do YouTube não permite isolar cada um) e as **legendas** (`videoCaptions` →
  `cc_load_policy`). Quando os controles nativos aparecem, o iframe fica clicável
  (`pointer-events:auto`) e o botão de som próprio é ocultado.
- **ADM** (`/admin/banner`): editor de slides (tipo Foto|Vídeo, upload ou link do YouTube +
  "iniciar com som", controles/legendas, selo/título/botão/destino, reordenar/remover;
  normaliza slides legados no load), configurações gerais (duração, reduce-motion) e o grupo
  **"Seção A Causa"** (textos, botão, mídia foto/vídeo, exibição autoplay|clique, som,
  controles/legendas, proporção). Salva `{ hero, about }`.

## Playlist do evento + coordenação de áudio

- **`Playlist`** (client, entre A Causa e Percurso) — só aparece com `playlist.enabled` e ≥1
  link. `playlist.visible` (`youtube`|`spotify`|`both`) decide o que mostra; com os dois, um
  seletor (abas) troca a plataforma.
- **YouTube**: `/api/yt-playlist?list=…` **lê a página da playlist** e extrai os vídeos dos
  `lockupViewModel` (id + título, até ~100, sem chave). Se vier lista → **player principal**
  (por `videoId`) + **lista custom** com o vídeo **tocando em 1º** ("Tocando agora"); clicar
  faz `loadVideoById`. Se a extração falhar → **fallback** para o player nativo da playlist
  (`listType:"playlist"`), que já mostra **todos os vídeos** na fila do YouTube — a seção nunca
  quebra. **Spotify**: embed via **Spotify IFrame API** (`createController`),
  controlável só por play/pause (sem mutar nem autoplay); a própria lista do Spotify aparece.
- **Minimiza flutuante**: um `IntersectionObserver` na seção detecta quando ela sai da tela;
  se já houve play, o player vira **fixo no canto inferior direito** (mesmo elemento, só muda o
  CSS → sem recarregar/parar), com barra de título + **botões de tamanho (− / +)** e fechar. O
  tamanho tem 3 níveis (`FLOAT_SIZES`, pequeno/médio/grande) responsivos ao viewport
  (`w-[min(px,vw)]`), então dá para **ajustar a janela no mobile e no desktop**. Volta ao normal
  quando a seção reaparece. (Os players ficam **fora** de `Reveal` para o `position:fixed` valer.)
- **Lista sem corte**: a `<ul>` de vídeos tem `p-1` para o **anel do item "Tocando agora"**
  (que é `box-shadow`/`ring`) não ser cortado pelo `overflow-y-auto` — como o vídeo atual fica
  em 1º, o anel dele encostava no topo e era clipado.
- **`AudioBus`** (client Context, envolve o `<main>` em `SiteContent`) — os players de vídeo
  do banner/A Causa (`YouTubePlayer`) registram se o som está ligado (`setVideoSound`, com
  `useId`; um poll de 800ms cobre também o unmute pelos controles nativos). A `Playlist` lê
  `videoSoundOn`: **muta o YouTube** e **pausa o Spotify** enquanto houver áudio de vídeo, e
  retoma depois (só se foi ela quem pausou). Fora do provider (ADM) o hook é null-safe.
- **ADM** (`/admin/playlist`, novo item no `ADM_NAV`): exibir seção, título, nota, o que fica
  visível, links do YouTube e do Spotify. Salva `{ playlist }`.

## Lotes de inscrição + Dia da Corrida

- `content.lotes: Lote[]` (nome, texto, `ctaLabel`, url, **`openDate` abertura**, `date`
  encerramento, cores, `open` legado). A lógica fica em **`lib/content/lotes.ts`**:
  `loteStatus` (upcoming/open/closed por datas, com fallback ao flag `open`), `activeLote`
  (o aberto, senão o próximo), `loteCountdown` (alvo+rótulo) e `validateLotes` (regras).
- **`InscricaoCTA`** (client, tempo real): a faixa principal é o lote ativo com suas cores;
  a contagem (`Countdown`) aponta para a **abertura** ("Inscrições abrem em") enquanto está
  por vir, ou para o **encerramento** ("Inscrições encerram em") quando aberto. Mostra
  Abertura/Encerramento por lote; a lista traz o status (Aberto/Em breve/Encerrado). Sem
  lotes → inscrição única. (SSR usa `now=0` → sem mismatch de hidratação.)
- Ordem dos lotes: `sortLotes` ordena pelo **número no nome** (Lote 1, 2, 3…), então a lista
  lê sempre 1→N independentemente das datas/ordem do array; a faixa em destaque é o lote
  **ativo** (`activeLote`).
- **`RaceDay`** (`content.inscricao.raceDate`, client): faixa **"Dia da Corrida"** com a data
  + contagem regressiva para a largada, logo antes de `InscricaoCTA` (Percurso e lotes seguem
  seções próprias).
- **`RaceCountdownBar`** (client): barra fina **abaixo do header** (sticky junto do header,
  linha única no mobile) com data + hora da corrida e contagem regressiva ao vivo; quando a
  data **já passou**, mostra **"Evento realizado"** (idem em `RaceDay`).
- **Números em destaque** (`content.stats`): editor próprio em **/admin/numeros** (item
  `numeros` no `ADM_NAV`; a seção `stats` do dashboard aponta para lá).
- **SEO**: `EventJsonLd` injeta **schema.org/SportsEvent** (nome, data da corrida, local,
  oferta de inscrição) no HTML — o Google entende a corrida como evento.
- **CTA do header** (`SiteNav`): o botão adapta o texto ao lote ativo via `loteCtaLabel` —
  "Abertura em DD/MM" (a abrir), "Inscreva-se até DD/MM" (aberto) ou "Inscrições encerradas".
- **`WhatsAppFloat`** (canto inferior direito): botão flutuante que abre `wa.me/<número>`;
  ligado/desligado em ADM > Links & inscrição (Redes sociais → `contact.whatsappFloat`).
- **ADM** (Links & inscrição): campo do **dia da corrida** + **abertura/encerramento** por
  lote, com **validação** que bloqueia o salvar (mensagens): abertura ≤ encerramento; lotes
  não podem se sobrepor (um de cada vez); dia da corrida depois do último encerramento.

## Tema (cores) e marca

- `content.theme` mapeia para variáveis CSS (`--color-ink`, `--color-gold`, ...) via
  `SiteChrome` (client, no layout) — que também aplica o favicon. Editável em
  Configurações (seletores de cor). Vazio = padrão.

## Galeria (grade deslizante + Google Fotos + comprar)

- **`Galeria`** (client) mostra as fotos numa **grade que desliza** (paginada): junta as fotos
  de todas as seções (Google Fotos + enviadas), quebra em páginas de **colunas × linhas**
  (config. por breakpoint em `content.gallery` — `slideCols/Rows` e `slideColsMobile/RowsMobile`,
  detecção via `matchMedia`), auto-avança (`slideSeconds`), com setas, bolinhas e **swipe**
  (touch). O paginador não estoura a tela: com muitas páginas (>12) troca as bolinhas por um
  contador **"X / Y"**; até 12, as bolinhas usam `flex-wrap`. **Sem lightbox / sem zoom**: `touch-action: pan-y` bloqueia pinça e duplo-toque;
  imagens usam `ProtectedImage` (marca d'água, sem arraste/menu) e a seção é **escondida na
  impressão** (`@media print #galeria`). ADM configura o tamanho da grade (desktop/mobile).
- Cada seção pode ter
  um **link de álbum público do Google Fotos** (`album.sourceUrl`): o público busca as fotos em
  `/api/gphotos?url=…` (rota que **lê a página do álbum** e extrai as URLs `lh3.googleusercontent`
  — **não-oficial**, pode quebrar se o Google mudar; degrada para vazio). Sem `sourceUrl`, usa
  fotos enviadas no site (`galleryPhotos`). Sem nada → tiles de placeholder.
- **ADM** (`/admin/galeria`): **criar/renomear/excluir seções**, colar o link do Google Fotos e
  **testar** (mostra quantas fotos foram encontradas). A rota `/api/gphotos` só aceita hosts do
  Google Fotos (evita virar proxy aberto).
- **Lightbox** (`Lightbox`, client): clicar numa foto abre o visualizador em tela cheia com a
  **mesma proteção** (`ProtectedImage`/marca d'água, sem arraste/menu, escondido na
  impressão), com fechar, ←/→ e navegação por teclado sobre **todas** as fotos.
- **Botão "comprar fotos"**: `content.gallery { buyEnabled, buyLabel, buyUrl }` — quando
  ligado, um CTA ao lado do título "Galeria" abre o site de venda em nova aba.
- **Cloudinary (opcional)**: `content.cloudinary { cloudName, uploadPreset }` (Configurações).
  Quando preenchido, `ImageUpload` envia **direto do navegador** (unsigned) e guarda a
  `secure_url`; senão usa `/api/media`.
- **ADM** (`/admin/galeria`): seções (álbuns) + upload por seção + bloco do botão de compra.

## Proteção de imagens

- `ImageProtection` (global) bloqueia menu de contexto e arraste em imagens;
  `ProtectedImage` (galeria + lightbox) adiciona **marca d'água** + camada que intercepta
  salvar; CSS esconde `.protected-media` na impressão. Limite honesto: screenshots do SO não
  são bloqueáveis — a marca d'água cobre esse caso.

## Marca (logo + favicon)

- `content.branding = { logo?, favicon? }`, editados em Configurações (uploads).
- **Logo**: `SiteNav`/`SiteFooter` mostram a imagem quando existe; senão o wordmark.
- **Favicon**: `components/site/FaviconManager.tsx` (no layout raiz) busca o conteúdo e
  aplica o `<link rel="icon">` em todas as páginas. Padrão estático: `src/app/icon.svg`.

## Percurso: múltiplos percursos (Strava / Garmin / fallback)

- **Vários percursos**: `percurso.routes: PercursoRoute[]` — cada um com `title`,
  `stravaRouteRef`, `garminRouteRef`, `fallbackImage`/`fallbackNote` e dados complementares
  (`distance`/`elevation`/`startFinish`). Os campos antigos de rota única continuam no modelo
  e são migrados para um único `routes[0]` via `percursoRoutes()` (`src/lib/content/percurso.ts`)
  — nada quebra em conteúdos já salvos.
- Público: `Percurso` (server) mostra eyebrow + título da seção e delega a `PercursoRoutes`
  (client). Com mais de um percurso, um **seletor** (abas, alvos ≥44px) troca o percurso e
  atualiza o mapa e os dados. Cada percurso usa `RouteViewer`.
- `RouteViewer` (client, por percurso): monta as visões disponíveis — **Strava**, **Garmin**
  e/ou **Mapa** (fallback). **Layout estável**: uma barra de provider de **altura fixa** sempre
  aparece (seletor quando há mais de uma visão; rótulo único quando há só uma).
- **Tamanho do mapa**: a área do mapa tem **altura automática**. O embed do Strava é
  **responsivo** — ele mesmo calcula a altura pela largura da coluna (via `postMessage`); nós
  forçamos só a **largura** (`.route-embed iframe { width:100% }`, sem `height`), então o card
  cabe **exatamente** em qualquer proporção — **sem corte no desktop e sem espaço vazio no
  mobile**. (Forçar `height:100%` era o que cortava/deixava sobra.) Dois percursos com Strava na
  mesma largura têm a mesma altura → **trocar de percurso não move nada**. Garmin/evento/imagem
  usam alturas próprias (`h-[400px] md:h-[520px]`).
- Garmin (`garminView`): course/activity/route (id numérico **ou** UUID) → mapa incorporado
  (`GarminRoute`, iframe `.../embed/<id>`). Um link de **evento** (`/modern/event/<uuid>`) é
  **aceito e apresentado** como um cartão com botão &ldquo;Ver evento no Garmin&rdquo;
  (`GarminEvent`) — eventos não têm mapa incorporável.
- **Strava por link curto**: o campo aceita o **ID**, o link `strava.com/routes/<id>` **ou**
  o link curto `strava.app.link/XXXX`. Links curtos (Branch) não têm o id embutido, então
  `StravaRoute` resolve em runtime via **`/api/strava-resolve`** (segue o redirect no Worker e
  extrai `routes/<id>` ou `activities/<id>` do destino; só domínios do Strava, com cache).
  Enquanto resolve mostra &ldquo;carregando mapa…&rdquo;; se falhar, oferece o botão
  &ldquo;Ver rota no Strava&rdquo;. `hasStrava()` decide se a aba Strava aparece.
- **Fallback manual**: imagem do mapa (upload) exibida quando não há Strava/Garmin, ou como
  opção &ldquo;Mapa&rdquo; ao lado deles. `StravaRoute` (embed.js) preenche a largura via
  `.route-embed` + `MutationObserver`. ADM > **Percurso** gerencia os percursos (adicionar,
  reordenar, remover) com todos esses campos.

## Números do dashboard e texto do percurso

- Dashboard: **Inscritos** e **Vagas restantes** são manuais (`content.metrics`,
  editados em Configurações); **Fotos na galeria** = `galleryPhotos.length` e
  **Patrocinadores** = `sponsors.length` (contagens reais, automáticas).
- Percurso: `percurso.title` é o título da **seção**; cada percurso tem o seu próprio
  título e dados (ver «Percurso: múltiplos percursos»).

### Resiliência (sem backend / offline)

- Sem os bindings (ex.: `next dev`), o site usa o seed, o ADM salva **só no
  `localStorage`** e o upload avisa que só funciona publicado. Nada quebra.
- O `store` só sobrescreve o conteúdo local quando o backend é a fonte real
  (`source === "backend"`); um seed devolvido como placeholder nunca apaga edições
  locais.
- Toda gravação é **otimista** e cacheada antes da rede, então uma falha de backend
  vira aviso de erro sem perder o que o usuário digitou.

### Próximos passos (Plano §4/§5)

1. ~~Auth real com papéis~~ — **feito** (D1 + sessões).
2. ~~Upload de mídia~~ — **feito** (KV / `ImageUpload`).
3. ~~Percurso do Strava~~ — **feito** via embed público (`StravaRoute`, só precisa de um
   ID de rota **pública**; sem OAuth). OAuth2 + pull de dados via API fica para o futuro.
4. Checkout próprio de inscrição (hoje é link para parceiro — Opção A do Plano).
5. Se o volume crescer, dá para migrar o D1 para outro banco (ex.: Supabase) — a fronteira
   (`/api/content` + `lib/content`) já isola isso dos componentes.

## Parceiros (grade de cards)

- `content.sponsors` (`Sponsor`: `name`, `tier`, **`link`** + **`linkKind?: "site" | "social"`**,
  `instagram?` legado, `logo?`) + `content.sponsorsShowTier` (flag global). Público
  (`components/site/Parceiros.tsx`): **card por parceiro** com uma **placa de logo quadrada**
  (`aspect-square` 1:1, fundo branco) que **preenche a largura do card**, o **nome embaixo** e um
  selo de categoria (Ouro/Prata/Bronze) **opcional** (só quando `sponsorsShowTier` está ligado).
  Card com borda arredondada + hover (sobe/realce). Uma **legenda opcional**
  (`sponsorsSubtitle`) aparece abaixo do título "Parceiros".
- **Botão "Seja um parceiro"** (`sponsorsShowCta`): opcional, na **mesma linha do título,
  alinhado à direita** (estilo `clip-cta-lg bg-gold`), rola até `#seja-parceiro`. Só aparece
  quando `sponsorsShowCta` **e** a seção "Seja um Parceiro" está ativa no layout — `SiteContent`
  passa `showCta={(c.sponsorsShowCta ?? false) && sejaAtiva}` (gate automático: se a seção for
  desativada, o botão some sozinho). No ADM > Parceiros o toggle fica **desabilitado** quando a
  seção está inativa e o save grava `false` nesse caso.
- **Link único + tipo**: o card abre o `link` interpretado por `linkKind` — `"site"` (normaliza
  `https://`) ou `"social"` (aceita `@perfil`, `instagram.com/perfil` ou URL completa de qualquer
  rede). `partnerHref()` faz fallback ao legado (`instagram` → social; senão `link` → site) para
  conteúdo salvo antes da migração. Grade **2 colunas no mobile**, 3 no tablet, 4/5 no desktop.
  Some quando não há parceiros.
- ADM > **Parceiros** (`patrocinadores/page.tsx`, título "Parceiros"): campo **Legenda**
  (`sponsorsSubtitle`, `TextArea`, opcional) + CRUD (logo/nome/categoria/**tipo de link**
  Site|Rede social/**link único**) + **toggle global** "Mostrar a categoria no site"
  (`sponsorsShowTier`). A logo usa `ImageUpload` com **`fit="contain"`** numa caixa
  **`aspect-square`** (1:1, sem corte). `migrate()` normaliza linhas legadas ao carregar
  (`instagram` → `linkKind:"social"`, senão `linkKind:"site"`).
- **`ImageUpload` (`components/admin/ImageUpload.tsx`) — controles por ícone (sem texto):** botão
  vazio = ícone de **upload**; com imagem, overlay com ícones **trocar** (setas) e **remover**
  (lixeira), `h-9 w-9` (alvo de toque), com `aria-label`/`title`. Estado de envio = **spinner**.
  Prop **`fit`** ("cover" padrão | "contain"). Como todo upload de imagem do ADM usa este
  componente, a mudança vale em todos os lugares (banner, A Causa, kit, galeria, logo/favicon, etc.).

## Depoimentos, FAQ e Kit do atleta (editáveis no ADM)

- **Depoimentos** ("Quem já correu"): `content.testimonials` (`quote`, `name`, `role`,
  **`photo?`**). ADM em **/admin/depoimentos** (CRUD, foto via `ImageUpload`, reordenar);
  público (`Depoimentos`) mostra o avatar quando há foto.
- **FAQ**: `content.faq` (`q`, `a`). ADM em **/admin/faq** (CRUD, reordenar); público (`Faq`,
  acordeão).
- **Kit do atleta** (`content.kit`): **regulamento** por **link de arquivo** ou **texto**
  (`regulamentoMode`/`regulamentoUrl`/`regulamentoText`); **itens** do kit (`KitItem` com
  nome + imagem opcional) em modo **único** (`items`) ou **por lote** (`perLote` mapeado por
  `loteId`, escolhido por `kitMode`). Público (`KitAtleta`, client): botão do regulamento
  (link ou expande o texto) + **grade de cards** dos itens (ícone `ImageUpload` ou check),
  com **abas por lote** quando o kit varia. O público mostra só o **título da seção**
  (`SectionEyebrow`, `kit.title`) + subtítulo e a grade — sem rótulo extra acima dos cards
  (o antigo `kitLabel` foi removido por ser redundante com o título). ADM em **/admin/kit**
  (`ItemsEditor` reutilizável).
  Cada item pode ter um **ícone da biblioteca** (`KitIcons.tsx` — set de SVGs sem emoji, com
  picker no ADM) ou uma imagem enviada. Novos itens no `ADM_NAV`: Depoimentos, FAQ, Kit.

## Ordem/ativação das seções da home (Dashboard)

- `content.layout: LayoutItem[]` (`{ key, enabled }`) define a **ordem** e o **on/off** das
  seções da tela inicial. O registro fica em **`lib/content/sections.ts`** (`SECTIONS`:
  `key`→`label`+`href` da página de config; `DEFAULT_LAYOUT`; `resolveLayout` que mescla o
  salvo com o registro, **mantendo a ordem/reordenação manual** e **inserindo seções novas na
  posição natural do registro** — logo após a seção-irmã anterior que já existe, em vez de
  jogá-las no fim).
- **`SiteContent`** monta o `<main>` a partir de um mapa `key → JSX` renderizado na ordem de
  `resolveLayout(c.layout)`, pulando as desativadas. Seções sem dado (ex.: `playlist`,
  `raceday`) continuam se auto-ocultando.
- **Dashboard** (`/admin/dashboard`): card **"Componentes da tela inicial"** (substitui o
  "Acesso rápido") — lista reordenável (setas ↑/↓, alvos ~36px), toggle **Ativo/Oculto** e o
  nome **linka para a página de configuração** da seção. Salva `{ layout }`.

## Analytics, robustez e acessibilidade

- **Analytics** (`content.analytics`): `Analytics` injeta **Cloudflare Web Analytics** (beacon
  por token, sem cookies) e/ou **Google Analytics 4** (`gaId`) quando configurados em ADM >
  Configurações. Vazio = nada carrega.
- **Robustez da Galeria**: enquanto busca os álbuns do Google Fotos mostra "Carregando fotos…";
  se falhar, "Não foi possível carregar…" (em vez de sumir). A Playlist já cai no player nativo.
- **Acessibilidade**: link "Pular para o conteúdo" (`.skip-link`, aparece no foco) → `#conteudo`
  (o `<main>`); anel de foco visível para teclado (`:focus-visible`). Imagens da galeria com
  `loading="lazy"` + `decoding="async"` (performance no mobile).
- **Âncoras vs. header fixo**: `html { scroll-padding-top: 7rem }` (globals.css) desloca todo
  salto de link interno (menu do topo + botão "Seja um parceiro") pela altura do cabeçalho fixo
  (SiteNav + barra de contagem, ~112px), para o título da seção-alvo parar **logo abaixo** dele
  em vez de ficar escondido atrás.

## Segurança dos formulários públicos (anti-spam)

- **`src/lib/antispam.ts`**: `clientIp()` (lê `CF-Connecting-IP`), `allowRequest(bucket, id,
  limit, windowSec)` (rate-limit de janela fixa em KV, com TTL — no-op em dev sem KV) e
  `isHoneypotTripped()` (campo oculto `website`).
- Os `POST` públicos (`/api/partners`, `/api/subscribe`) fazem **honeypot** (bot que preenche o
  campo oculto recebe `ok:true` mas é **descartado**) + **limite por IP** (5 envios / 10 min). Os
  formulários (`SejaParceiro`, `NotifyForm`) têm o input honeypot escondido (fora da tela,
  `aria-hidden`, `tabIndex=-1`).

## Privacidade (LGPD)

- Página **`/privacidade`** (`app/privacidade/page.tsx`) — nota de privacidade (modelo a revisar
  com jurídico) que lê o e-mail de contato do conteúdo; linkada no rodapé.
- Os formulários públicos (Seja um Parceiro e "avise-me") têm **checkbox de consentimento
  obrigatório** com link para a política. `created_at` de cada registro serve de data do
  consentimento.

## Cache da home (ISR) e o Error 1102

- **Problema:** a home era `force-dynamic` — SSR completo a cada requisição. Em cold start (comum
  num site de baixo tráfego, com o isolate reciclado), o render podia estourar o limite de recurso
  do Worker → **Error 1102** intermitente.
- **Solução:** a home virou **ISR** (`export const revalidate = 30` em `app/page.tsx`) com **cache
  incremental em KV** (`NEXT_INC_CACHE_KV`) + **`enableCacheInterception`** (`open-next.config.ts`).
  Cold isolates servem o **HTML já cacheado** (`x-nextjs-cache: HIT`) sem rodar o SSR pesado. As
  rotas do ADM e `/api/*` continuam dinâmicas (não cacheadas).
- **Frescor:** edições no ADM aparecem na home em até ~30s (revalidação em background). O ADM em
  si lê `/api/content` ao vivo, então mostra as edições na hora.
- **Deploy:** o build pré-renderiza a home com o **seed** (não há D1 no build) e popula o KV. Por
  isso o `cf:deploy` roda `scripts/refresh-cache.mjs` ao final: **limpa o cache KV e aquece a home**
  para ela regenerar do D1 ao vivo — evita mostrar conteúdo seed após um deploy. Edições de
  conteúdo (sem deploy) não têm esse efeito.

## Cabeçalhos de segurança e performance

- **`next.config.ts` → `headers()`**: aplica em toda resposta `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Strict-Transport-Security` (HSTS 1 ano), `Permissions-Policy` (bloqueia câmera/mic/geo/topics)
  e `X-DNS-Prefetch-Control: on`.
- **CSP** (`Content-Security-Policy`): allow-list afinada para o que o site carrega — `self`, o
  `<style>` de tema e os scripts inline do Next (`'unsafe-inline'`), embeds/APIs de YouTube e
  Spotify, analytics (GA4 + Cloudflare) e imagens por `https:` (logos, Cloudinary, Google Fotos).
  Publicada como **`Content-Security-Policy-Report-Only`** (reporta, não bloqueia); violações vão
  para **`/api/csp-report`** (log via `wrangler tail`). Depois de confirmar que nada é bloqueado,
  trocar o header para o modo que aplica (`Content-Security-Policy`).
- **Preconnect/dns-prefetch** no `<head>` (layout) para YouTube/Spotify/Cloudinary/Google Fotos,
  acelerando o carregamento quando esses recursos são usados. Imagens da galeria já usam
  `loading="lazy"` + `decoding="async"` dentro de contêineres com proporção fixa (sem CLS).
- **Logs de erro**: as rotas de API registram falhas com contexto (`console.error("[api/...]")`),
  visíveis no `wrangler tail` / painel Cloudflare, para diagnóstico.

## Integração contínua (CI) e testes

- `.github/workflows/ci.yml`: a cada push/PR roda `npm ci` → **lint** → **tsc --noEmit** →
  **test (vitest)** → **next build**. Pega erros de tipo e os arquivos duplicados que o iCloud às
  vezes cria, antes de virarem deploy quebrado. O ESLint ignora `.next.*/**` e `.open-next.*/**`.
- **Testes (`tests/`, vitest, `npm test`)**: funções puras — `resolveLayout` (ordem/inserção de
  seção nova), anti-spam (`isHoneypotTripped`, `clientIp`, `allowRequest`). `vitest.config.ts`
  faz alias de `@` → `src` e stub de `server-only`.

## Rastreamento de conversão (analytics)

- **`lib/track.ts`** `track(name, params?)` dispara evento GA4 via `window.gtag` **se** o GA
  estiver configurado (ADM > Configurações); no-op caso contrário. Eventos: `inscricao_click`
  (todo `CtaButton`), `lead_parceiro` (envio de Seja um Parceiro) e `lead_email` (avise-me). O
  Cloudflare Web Analytics (pageviews, sem cookies) não precisa de fiação.

## Captura de e-mails (avisos)

- **Avisos por e-mail** (guardado no próprio sistema, sem serviço externo):
  - Tabela D1 `subscribers` (`id`, `email` único, `created_at`) — `migrations/0003_subscribers.sql`.
  - **`src/app/api/subscribe/route.ts`**: `POST` público valida o e-mail e faz
    `INSERT OR IGNORE`; `GET`/`DELETE` são só do ADM (exigem sessão) para listar/remover.
  - **`NotifyForm`** aparece na seção de Inscrição quando o lote ativo ainda vai abrir
    (`upcoming`): o visitante deixa o e-mail para ser avisado.
  - ADM > **Avisos (e-mails)** (`/admin/inscritos`): lista, exporta CSV e remove e-mails.

## Seja um Parceiro (cadastro de apoiadores)

- Seção pública + captura de leads (guardado no próprio sistema, sem serviço externo):
  - Tabela D1 `partners` (`id`, `name`, `email`, `phone`, `message`, `kind` = `fisica|juridica`,
    `has_whatsapp` 0/1, `created_at`) — `migrations/0004_partners.sql`.
  - **`src/app/api/partners/route.ts`**: `POST` público valida e insere; `GET` (com filtro
    opcional `?kind=`) e `DELETE` são só do ADM (exigem sessão). Protegido por **anti-spam**
    (honeypot + limite por IP — ver seção Segurança).
  - **Aviso por e-mail (opcional)**: se `content.sejaParceiro.notifyEmail` estiver preenchido
    **e** o secret `RESEND_API_KEY` existir, cada novo cadastro dispara um e-mail à organização
    via `lib/email.ts` (Resend). Best-effort: nunca bloqueia nem falha o cadastro se o e-mail
    não sair. Sem a key, só não envia. Config em ADM + secrets `RESEND_API_KEY`/`NOTIFY_FROM`
    (ver README).
  - **`SejaParceiro`** (client, seção da home, `key: "sejaParceiro"` em `sections.ts`):
    formulário com Nome, E-mail, Telefone (com a marcação **"Este número tem WhatsApp"** logo
    abaixo), tipo (**Pessoa física/jurídica**) e **"O que posso ajudar"** (texto livre).
    Título/legenda editáveis (`content.sejaParceiro`) via `SectionEyebrow`; responsivo + alvos
    de toque (`min-h-11`).
  - **Vídeo promocional opcional** (mesmas regras de "A Causa" — reaproveita `YouTubePlayer`,
    `youtubeId`, `isVerticalYouTube`): `videoEnabled` liga/desliga; `videoUrl`, `aspectRatio`
    (mesmas opções), `clickToPlay`, `videoStartMuted`, `videoControls`, `videoCaptions`. Quando
    ligado, a seção vira 2 colunas no desktop (**vídeo à esquerda, formulário à direita**) e
    empilha no mobile (**vídeo primeiro, depois o formulário**). Desligado → só o formulário
    (coluna única, como antes).
  - ADM > **Seja um Parceiro** (`/admin/seja-parceiro`): edita o texto da seção, **configura o
    vídeo** (card "Vídeo promocional" com toggle + os mesmos controles de A Causa) **e** lista os
    cadastros — **filtro por PF/PJ**, botão que abre o **WhatsApp** (`wa.me`, assume +55 quando
    não há código do país) de quem marcou ter WhatsApp, `mailto:` do e-mail, exporta CSV e remove.

## Premiação (pódio animado)

- **Resultado e Premiação são a mesma seção** — a antiga seção «Resultados» foi removida e o
  link para resultados externos vive dentro da Premiação (`resultsUrl`).
- `content.premiacao` (`PremiacaoSection`): **pódio** com a premiação por posição. Cada
  posição (`PodiumPlace`) tem `place` (rótulo, ex.: &ldquo;1º lugar&rdquo;), `prize`
  (premiação) e **`color`** (cor do degrau/acento — opcional; vazio usa o padrão ouro/prata/
  bronze por posição). O número do degrau escolhe texto claro/escuro por contraste
  automaticamente. O componente renderiza quando há dados (posições ou link).
- **Exibir/ocultar é só no Dashboard** — a Premiação **não** tem toggle próprio de exibição; a
  visibilidade vem do `content.layout` («Componentes da tela inicial», ativar/ocultar +
  ordenar), como qualquer seção da home. (Fonte única de verdade; evita duas chaves conflitantes.)
- Público (`components/site/Premiacao.tsx`, client): **pódio animado** — ao entrar na tela
  (IntersectionObserver, mesma config do `Reveal`, com fallback quando já está visível no
  mount) as barras **crescem da base** (o 1º sobe por último, com stagger) e os cartões fazem
  fade-in mostrando os valores cadastrados. No desktop o 1º fica ao **centro e mais alto** (2º
  à esquerda, 3º à direita, via `sm:order-*`); no mobile empilham 1 → 2 → 3. Cores por rank
  (ouro, prata, bronze). Posições 4ª+ listam abaixo; botão opcional para **resultados
  completos** (`resultsUrl`, nova aba). Respeita `prefers-reduced-motion`.
- **Importante**: o efeito de scroll só é montado quando a seção é renderizada; por isso o
  componente não se auto-oculta por um `enabled` interno (senão o observer nunca prendia no
  elemento e o pódio ficava em branco). Registrada em `sections.ts` como `premiacao`, editável
  em ADM > **Premiação** (`/admin/premiacao`).

## Componentes compartilhados, ordem de lotes e navegação do ADM

- **`SlidePager`** (`components/site/SlidePager.tsx`) é o paginador **oficial** (setas
  circulares + bolinhas, alvo ≥44px). Usado na Galeria (`tone="solid"`) e no Banner
  (`tone="overlay"`, sobre a mídia). Sempre que um componente trocar slides, usa este.
- **`CtaButton`** (`components/site/CtaButton.tsx`) é o botão de inscrição **padrão** (pílula
  dourada, cantos cortados). O mesmo componente é usado no **header** (`size="sm"`) e no
  **Banner** (`size="lg"`), garantindo botões idênticos em todo o site.
- **Banner no mobile**: o paginador aparece isolado, centralizado, **logo abaixo do botão**
  (`md:hidden`); no desktop ele flutua no canto inferior direito (`hidden md:flex`).
- **Ordem dos lotes**: o destaque é o lote **aberto** (senão o próximo a abrir), e **não se
  repete** na lista abaixo. Os demais aparecem em ordem **regressiva** (`sortLotesDesc`), e o
  ADM (Links & inscrição) também lista os lotes de forma regressiva.
- **Navegação do ADM** (`AdmSidebar`): as abas de **seção** seguem a mesma ordem dos
  Componentes da tela inicial definida no Dashboard (`content.layout` → página de cada seção,
  deduplicada). As configs que **não** são seções da home (Textos, Avisos, Edições, Log,
  Backup, Configurações, Usuários) ficam fixas na **parte inferior**, logo acima do bloco do
  administrador. O Dashboard fica no topo. (Sem marcador/ícone quadrado nos itens.)

## Padrão de componentes

- **Site** (`components/site`): componentes de apresentação recebem sua fatia de
  conteúdo por props (ex.: `<Hero hero={...} />`). `Reveal` e `Counter` são
  utilitários de animação reaproveitáveis.
- **ADM** (`components/admin`): `AdminShell` provê o layout responsivo (sidebar fixa
  no desktop, drawer no mobile); `ui.tsx` concentra os primitivos (`Card`, `TextInput`,
  `PrimaryButton`, `SaveBar`, `Badge`, `AdmLoading`...) para as 11 páginas não repetirem
  estilo; `nav.ts` é a fonte única do menu. Páginas editáveis são "portas" que só
  montam o formulário depois de `hydrated`, então os campos iniciam com o dado do
  backend (nunca com o seed defasado).

## Responsividade e touch

- Breakpoints Tailwind (`sm`/`md`/`lg`) refluem grids (ex.: galeria 2→4 colunas,
  patrocinadores 2→5, depoimentos 1→3).
- Navegação do site e sidebar do ADM viram menu/drawer com backdrop no mobile.
- Alvos de toque de ao menos 44px (`min-h-11`) em botões e itens de menu.
- Tabelas do ADM (patrocinadores, usuários, log) viram cartões empilhados no mobile.

## Decisões e por quê

- **Next.js/React** — recomendado pelo Plano §5; SSR ajuda SEO e performance.
- **Tailwind v4 com tokens** — pareamento rápido do design com paleta `oklch`
  centralizada; evita CSS solto e mantém consistência.
- **Cloudflare D1 como backend** — SQLite gerenciado, fortemente consistente e
  gratuito; no mesmo lugar do site (o Worker), então dá para configurar tudo por linha
  de comando, sem contas externas. Também serve de base para o login com usuários no
  futuro. O `localStorage` fica como cache/offline e persistência quando não há binding.
- **Sem segredos no cliente** — o binding KV vive no Worker; o navegador fala com o
  KV apenas através da rota `/api/content`.
- **Hospedagem na Cloudflare (Workers) via OpenNext** — como a Cloudflare não roda
  Next.js nativamente, o adaptador `@opennextjs/cloudflare` empacota o app num Worker
  (`open-next.config.ts`, `wrangler.jsonc`). Mantém runtime Node (a rota `/api/content`
  e o fetch do servidor funcionam sem virar Edge). Deploy: ver README. A Vercel também
  funciona sem adaptador, se um dia preferir migrar.
- **Sem biblioteca de ícones** — o design usa formas geométricas simples; alinhado à
  regra "sem emojis" e reduz peso.

## Próximos passos (do Plano)

Fase 3–5: backend/API, storage, Auth com papéis, integração Strava e link/checkout de
inscrição (Ticket Sports como Opção A). Ver Plano §4.3 e §6.
