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
| Backend | Google Apps Script (Web App) + planilha Google — ver [`apps-script/`](apps-script/README.md) |
| Cache/offline do ADM | `localStorage` (fallback quando o backend não está configurado) |

A stack segue a recomendação do Plano §5 (Next.js/React). O conteúdo é persistido no
**Apps Script**; storage de mídia, Auth com papéis e integração Strava são os próximos
passos descritos em [ARQUITETURA.md](ARQUITETURA.md).

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com a URL/token do Apps Script
npm run dev                  # http://localhost:3000
```

Sem `.env.local` o site funciona normalmente com o conteúdo padrão e o ADM salva
**apenas no navegador** (a tela Configurações mostra "Backend não configurado").
Para persistência real, siga [`apps-script/README.md`](apps-script/README.md) e
preencha `GAS_WEB_APP_URL` e `GAS_SHARED_TOKEN`.

Outros comandos:

```bash
npm run build    # build de produção
npm run start    # servir o build
npm run lint     # ESLint
```

Acesso ao painel: rodapé do site → **"Acesso administrativo"**, ou `/admin/login`
(qualquer e-mail/senha entra — a autenticação real ainda será conectada).

## Estrutura

```
src/
  app/
    layout.tsx            # fontes, metadata, <noscript> fallback do reveal
    page.tsx              # home pública (busca conteúdo publicado, ISR)
    globals.css          # design tokens (paleta oklch, fontes, animações)
    api/content/route.ts  # proxy do backend (GET/PUT) com token no servidor
    admin/
      page.tsx            # redireciona para /admin/login
      login/page.tsx      # login (porta de entrada)
      (painel)/
        layout.tsx        # ContentProvider + AdminShell (sidebar responsiva)
        dashboard | banner | galeria | conteudo | strava | patrocinadores |
        links | usuarios | edicoes | log | configuracoes   # 11 páginas
  components/
    site/                 # componentes do site público (Hero, Faq, Counter, ...)
    admin/                # AdminShell, AdmSidebar, primitivos de UI, nav
  lib/content/
    types.ts              # modelo de conteúdo tipado
    seed.ts               # conteúdo padrão (portado do handoff)
    store.tsx             # store do ADM (backend + cache + log + status)
    server.ts             # busca de conteúdo no servidor (público) com fallback
    theme.ts              # cores de badges (tiers de patrocínio, status de edição)
apps-script/              # backend Google Apps Script (Code.gs + instruções)
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
