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
- **`server.ts`** — `getPublishedContent()` (server-only): busca o conteúdo no backend
  para o **site público**, com merge sobre o seed e fallback total.
- **`store.tsx`** — `ContentProvider` + hook `useContent()` usado pelo **ADM**. Carrega
  via `/api/content`, salva com `save(patch, logAction?)`, e expõe `status`
  (`loading/saving/saved/error`), `backend`, `reload()` e `reset()`. Mantém um cache
  em `localStorage`.
- **`theme.ts`** — mapas de cor de badges (tiers de patrocínio, status de edição).

## Backend (Google Apps Script)

Fluxo de dados:

```
Site público (server)  ── GET ──▶  Apps Script /exec  ◀── planilha (A1 = JSON)
ADM (browser)  ── PUT ──▶  /api/content (Next, token)  ── POST ──▶  Apps Script /exec
```

- **`src/app/api/content/route.ts`** — proxy same-origin. `GET` lê do GAS; `PUT`
  grava/reseta. O **token de escrita fica só no servidor** (`GAS_SHARED_TOKEN`),
  nunca no bundle do navegador. O POST ao GAS usa `Content-Type: text/plain` para
  evitar preflight CORS (o Apps Script não responde a `OPTIONS`).
- **`apps-script/Code.gs`** — Web App que guarda o `SiteContent` inteiro na célula A1
  de uma planilha do Drive. Ver [`apps-script/README.md`](apps-script/README.md).

### Resiliência (sem backend / offline)

- Sem `GAS_WEB_APP_URL`, o site usa o seed e o ADM salva **só no `localStorage`**
  (a tela Configurações mostra o estado). Nada quebra.
- O `store` só sobrescreve o conteúdo local quando o backend é a fonte real
  (`source === "backend"`); um seed devolvido como placeholder nunca apaga edições
  locais.
- Toda gravação é **otimista** e cacheada antes da rede, então uma falha de backend
  vira aviso de erro sem perder o que o usuário digitou.

### Próximos passos (Plano §4/§5)

1. Conectar `login/page.tsx` a Auth real com papéis (admin geral / editor).
2. Upload de mídia (banner, galeria, logos) para storage.
3. Rota do Strava (OAuth2) na seção Percurso, com fallback de GPX/imagem.
4. Se o volume crescer, migrar o backend do Apps Script para Supabase — a fronteira
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
- **Apps Script como backend** — custo/servidor zero, dados numa planilha que a
  organização inspeciona; ótimo para esta fase (Plano §5). O `localStorage` fica como
  cache/offline e como persistência quando o backend não está configurado.
- **Token só no servidor** — o ADM grava via `/api/content`, então o segredo de escrita
  nunca vai para o navegador.
- **Sem biblioteca de ícones** — o design usa formas geométricas simples; alinhado à
  regra "sem emojis" e reduz peso.

## Próximos passos (do Plano)

Fase 3–5: backend/API, storage, Auth com papéis, integração Strava e link/checkout de
inscrição (Ticket Sports como Opção A). Ver Plano §4.3 e §6.
