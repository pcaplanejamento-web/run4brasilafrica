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
- **Leitura no site público é feita no cliente** (`components/site/SiteContent.tsx`):
  o servidor renderiza o baseline (seed) para SEO/primeiro paint e o navegador busca
  o conteúdo ao vivo em `/api/content`. Isso porque `getCloudflareContext()` é
  instável dentro da renderização de React Server Components no OpenNext, enquanto o
  caminho navegador → rota é sólido — o mesmo que o ADM usa.

## Autenticação (ADM)

- Usuários e sessões no D1 (`migrations/0002_auth.sql`). Senha com **PBKDF2-SHA256**
  (Web Crypto), sessão = token opaco no D1 + cookie **HttpOnly/Secure/SameSite=Lax**.
- `src/lib/auth.ts` (hash/verify, create/get/destroy session) + `src/lib/cf.ts`
  (`getDB`). Endpoints `/api/auth/*`, `/api/users`, `/api/users/[id]`.
- **Fronteira de segurança:** `PUT /api/content` exige sessão; a API de usuários exige
  papel **Administrador geral**. A UI (`AuthProvider`) redireciona para o login quando
  não há sessão — mas a proteção real está nas rotas de escrita.
- Guardas: não é possível remover/rebaixar o **último administrador** (evita lockout).
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
  CSS → sem recarregar/parar), com barra de título + fechar. Volta ao normal quando a seção
  reaparece. (Os players ficam **fora** de `Reveal` para o `position:fixed` valer na viewport.)
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
- **`RaceDay`** (`content.inscricao.raceDate`, client): faixa **"Dia da Corrida"** com a data
  + contagem regressiva para a largada, logo antes de `InscricaoCTA` (Percurso e lotes seguem
  seções próprias).
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
  (touch). **Sem lightbox / sem zoom**: `touch-action: pan-y` bloqueia pinça e duplo-toque;
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

## Percurso: Strava e/ou Garmin

- Campos `percurso.title` (editável no ADM), `percurso.stravaRouteRef` e
  `percurso.garminRouteRef` (ADM > Percurso). O título é mostrado **exatamente** como
  digitado (sem prefixar o km).
- `RouteViewer` (client): quando os **dois** estão configurados, um **seletor** (Strava |
  Garmin, alvos ≥44px, default Strava) deixa o visitante escolher qual mapa ver; com só um,
  mostra ele direto; nenhum → placeholder.
- Garmin (`garminEmbedUrl`) aceita links de **course/activity/route** com id numérico **ou
  UUID**; links de **event** (`/modern/event/<uuid>`) não têm mapa incorporável → ignorados
  (use um link de course/percurso). `StravaRoute` (embed.js) e `GarminRoute` (iframe
  `connect.garmin.com/.../embed/<id>`). Rota/atividade **pública** (sem credenciais). O
  wrapper `.route-embed` + CSS global **e** um `MutationObserver` no `StravaRoute` forçam o
  iframe a **preencher a largura** da seção.

## Números do dashboard e texto do percurso

- Dashboard: **Inscritos** e **Vagas restantes** são manuais (`content.metrics`,
  editados em Configurações); **Fotos na galeria** = `galleryPhotos.length` e
  **Patrocinadores** = `sponsors.length` (contagens reais, automáticas).
- Percurso: o título adapta-se à **distância** inserida no ADM — o público monta
  `"<distância compacta> " + percurso.title` (ex.: `10 KM` → `10KM DE PURA ADRENALINA.`).

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
  com **abas por lote** quando o kit varia. ADM em **/admin/kit** (`ItemsEditor` reutilizável).
  Novos itens no `ADM_NAV`: Depoimentos, FAQ, Kit do atleta.

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
