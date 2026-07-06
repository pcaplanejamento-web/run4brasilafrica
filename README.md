# Run4BrasilAfrica — Site Oficial

Site institucional + painel administrativo (ADM) da corrida **Run4BrasilAfrica**,
implementado a partir do handoff de design do Claude Design (`design-source/`) e
seguindo o [Plano de Negócio](design-source/project/uploads/Plano_de_Negocio_Run4BrasilAfrica.md).

O sistema tem dois lados:

- **Site público** (`/`) — página institucional da corrida: hero, causa social,
  percurso, inscrição, galeria, patrocinadores, depoimentos, FAQ e kit do atleta.
- **Painel ADM** (`/admin`) — área logada para a organização atualizar todo o
  conteúdo a cada edição, **sem tocar em código** (Plano §4.2 e §8).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (design tokens em `src/app/globals.css`) |
| Fontes | Space Grotesk (títulos) + IBM Plex Sans (texto) via `next/font` |
| Backend | Cloudflare Workers KV (binding `CONTENT_KV` em `wrangler.jsonc`) |
| Hospedagem | Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`) |
| Cache/offline do ADM | `localStorage` (fallback quando não há binding, ex.: `next dev`) |

A stack segue a recomendação do Plano §5 (Next.js/React). O conteúdo é persistido no
**Cloudflare KV**; storage de mídia, Auth com papéis e integração Strava são os
próximos passos descritos em [ARQUITETURA.md](ARQUITETURA.md).

## Como rodar

```bash
npm install
npm run dev                  # http://localhost:3000
```

Não há variáveis de ambiente a configurar. Localmente (sem o binding KV) o site
funciona com o conteúdo padrão e o ADM salva **apenas no navegador** (a tela
Configurações mostra o status). No site publicado na Cloudflare, o KV guarda o
conteúdo para todos os visitantes.

Outros comandos:

```bash
npm run build    # build de produção
npm run start    # servir o build
npm run lint     # ESLint
```

Acesso ao painel: rodapé do site → **"Acesso administrativo"**, ou `/admin/login`
(qualquer e-mail/senha entra — a autenticação real ainda será conectada).

## Deploy (Cloudflare)

Este é um app Next.js com servidor (ADM, rota `/api/content`, renderização
dinâmica). **GitHub Pages não serve** para isso — só hospeda arquivos estáticos.
Na Cloudflare o app roda em **Workers** através do adaptador **OpenNext**
(`@opennextjs/cloudflare`), já configurado neste repositório:

- [`open-next.config.ts`](open-next.config.ts) e [`wrangler.jsonc`](wrangler.jsonc)
- scripts em `package.json`: `cf:build`, `cf:preview`, `cf:deploy`

### Opção A — Painel da Cloudflare (conectando ao GitHub)

1. Acesse <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Import a repository** (autorize o app da Cloudflare no GitHub).
2. Selecione o repositório `run4brasilafrica`.
3. Em build, use (importante — o deploy precisa compilar antes):
   - **Build command:** deixe em branco
   - **Deploy command:** `npm run cf:deploy`

   > `npm run cf:deploy` compila e publica de uma vez
   > (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`). Um
   > `npx wrangler deploy` puro falha com "Could not find the compiled OpenNext
   > configuration" porque não roda a compilação.
4. **Save and Deploy**. A cada `git push` na `main`, a Cloudflare publica de novo.

> O backend (KV) já vem no `wrangler.jsonc` (binding `CONTENT_KV`) — não há
> variáveis de ambiente a definir. Se recriar o Worker do zero, crie o namespace
> com `npx wrangler kv namespace create CONTENT_KV` e atualize o `id`.

### Opção B — Linha de comando (mais direto)

```bash
npx wrangler login        # abre o navegador para autenticar na Cloudflare
npm run cf:deploy         # build do OpenNext + publica o Worker
```

### Testar o build da Cloudflare localmente

```bash
npm run cf:preview        # roda o Worker localmente (runtime workerd)
```

> Se o GitHub Pages estiver ligado (mostrando este README), desative-o em
> **Settings → Pages → Source: None** para não confundir com o site real.

> A Vercel também funciona (sem adaptador — detecta o Next.js sozinho), caso
> queira comparar; basta importar o mesmo repositório lá.

## Estrutura

```
src/
  app/
    layout.tsx            # fontes, metadata, <noscript> fallback do reveal
    page.tsx              # home pública (SSR do seed; conteúdo ao vivo no client)
    globals.css          # design tokens (paleta oklch, fontes, animações)
    api/content/route.ts  # backend: lê/grava o conteúdo no Cloudflare KV
    admin/
      page.tsx            # redireciona para /admin/login
      login/page.tsx      # login (porta de entrada)
      (painel)/
        layout.tsx        # ContentProvider + AdminShell (sidebar responsiva)
        dashboard | banner | galeria | conteudo | strava | patrocinadores |
        links | usuarios | edicoes | log | configuracoes   # 11 páginas
  components/
    site/                 # site público: SiteContent (hidrata ao vivo), Hero, Faq...
    admin/                # AdminShell, AdmSidebar, primitivos de UI, nav
  lib/content/
    types.ts              # modelo de conteúdo tipado
    seed.ts               # conteúdo padrão (portado do handoff)
    store.tsx             # store do ADM (backend + cache + log + status)
    kv.ts                 # leitura/gravação no Cloudflare KV (usado pela rota)
    theme.ts              # cores de badges (tiers de patrocínio, status de edição)
open-next.config.ts       # adaptador OpenNext → Cloudflare
wrangler.jsonc            # Worker + binding KV (CONTENT_KV) + assets
design-source/            # bundle original do Claude Design (referência/provenância)
```

## Princípios seguidos

- **100% orientado a componentes** — cada seção do site e cada primitivo do ADM
  é um componente reutilizável; nada de HTML duplicado.
- **Nada hardcoded** — todo conteúdo variável vive em `lib/content` e é editável
  pelo ADM (Plano §8). Trocar o seed por uma chamada de API não muda os componentes.
- **Responsivo + touchscreen** — layout fluido do desktop ao mobile; menu e sidebar
  viram drawer/menu com alvos de toque ≥ 44px; grids refluem por breakpoint.
- **Acessibilidade e movimento** — animações leves (scroll-reveal, contadores,
  micro-interações) que respeitam `prefers-reduced-motion`; conteúdo visível sem JS.
- **Sem emojis** — em nenhum texto, botão ou notificação (Plano §4.4).

Detalhes de arquitetura, tokens e o caminho para produção: **[ARQUITETURA.md](ARQUITETURA.md)**.
