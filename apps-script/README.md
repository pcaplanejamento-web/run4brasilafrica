# Backend — Google Apps Script

Este é o backend do site: um **Web App** do Google Apps Script que guarda todo o
conteúdo do site (o objeto `SiteContent`) como um JSON numa planilha Google. O painel
ADM lê e grava aqui; o site público lê daqui na renderização.

## Por que Apps Script

- Zero custo e zero servidor para manter.
- Os dados ficam numa planilha Google que a organização pode inspecionar.
- Ótimo para esta fase (Plano §5 sugere Supabase para o futuro — a fronteira já está
  isolada em `src/lib/content`, então trocar depois não afeta os componentes).

## Passo a passo

1. Acesse <https://script.google.com> → **Novo projeto**.
2. Apague o conteúdo de `Código.gs` e cole o conteúdo de [`Code.gs`](Code.gs).
3. **Configurações do projeto** (ícone de engrenagem) → **Propriedades do script** →
   **Adicionar propriedade**:
   - Nome: `SHARED_TOKEN`
   - Valor: uma senha longa e aleatória (ex.: gere 32+ caracteres).
4. **Implantar** → **Nova implantação** → tipo **App da Web**:
   - **Executar como:** Eu
   - **Quem pode acessar:** Qualquer pessoa
   - Clique em **Implantar** e autorize os acessos pedidos (Planilhas/Drive).
5. Copie a **URL do app da Web** (termina em `/exec`).
6. Na raiz do projeto Next, crie `.env.local` (veja `.env.example`):

   ```bash
   GAS_WEB_APP_URL=https://script.google.com/macros/s/SEU_ID/exec
   GAS_SHARED_TOKEN=o-mesmo-token-do-passo-3
   ```

7. Reinicie `npm run dev`. No ADM, a tela **Configurações** deve mostrar
   **"Backend conectado"**. Salve qualquer alteração e confira a planilha
   *"Run4BrasilAfrica — Conteúdo"* no seu Drive (célula A1).

## Atualizando o script

Ao editar o `Code.gs`, faça **Implantar → Gerenciar implantações → editar (lápis) →
Versão: Nova versão → Implantar**. A URL `/exec` continua a mesma.

## Segurança

- O token de escrita fica **apenas no servidor** (`.env.local`, nunca no navegador):
  o ADM grava através da rota `/api/content` do Next, que injeta o token.
- Antes de produção, conecte a autenticação real do ADM (Plano §4.2) e considere
  restringir o acesso do Web App.

## Formato dos dados

A célula A1 guarda o objeto completo `SiteContent` (ver `src/lib/content/types.ts`)
serializado em JSON. Cada "Salvar" no ADM grava o snapshot inteiro; `GET` devolve
`{ ok: true, content }` (ou `content: null` antes do primeiro salvamento, quando o
app usa o conteúdo padrão de `src/lib/content/seed.ts`).
