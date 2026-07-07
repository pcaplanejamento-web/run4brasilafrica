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

## Imagens (mídia)

- Storage = **Cloudflare KV** (binding `MEDIA_KV`) guardando o binário + o
  `contentType` nos metadados. (R2 seria o ideal, mas não estava habilitado na conta.)
- **Upload**: `POST /api/media` (multipart, admin) valida tipo/tamanho (≤ 8 MB),
  gera uma chave única e devolve `{ url: "/api/media/<key>" }`.
- **Servir**: `GET /api/media/[key]` transmite a imagem com cache imutável (chaves
  são únicas por upload). `DELETE` remove (admin).
- Componente `components/admin/ImageUpload.tsx` faz o upload e reporta a URL.
- Campos no conteúdo: `hero.image`, `sponsors[].logo`, `galleryPhotos[]`. O público
  (`Hero`, `Parceiros`, `Galeria`) mostra a imagem quando existe; senão, o placeholder.

### Resiliência (sem backend / offline)

- Sem os bindings (ex.: `next dev`), o site usa o seed, o ADM salva **só no
  `localStorage`** e o upload avisa que só funciona publicado. Nada quebra.
- O `store` só sobrescreve o conteúdo local quando o backend é a fonte real
  (`source === "backend"`); um seed devolvido como placeholder nunca apaga edições
  locais.
- Toda gravação é **otimista** e cacheada antes da rede, então uma falha de backend
  vira aviso de erro sem perder o que o usuário digitou.

### Próximos passos (Plano §4/§5)

1. Conectar `login/page.tsx` a Auth real com papéis (admin geral / editor).
2. Upload de mídia (banner, galeria, logos) para storage (ex.: Cloudflare R2).
3. Rota do Strava (OAuth2) na seção Percurso, com fallback de GPX/imagem.
4. Se o volume crescer, dá para migrar o D1 para outro banco (ex.: Supabase) — a fronteira
   (`/api/content` + `lib/content`) já isola isso dos componentes.

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
