# Plano de Negócio — Site Oficial Run4BrasilAfrica

## 1. Sumário Executivo

O Run4BrasilAfrica é um evento de corrida que conecta esporte, causa social e visibilidade institucional. Este plano descreve a criação de um site oficial, completo e configurável, que servirá como canal central de divulgação, inscrição e engajamento do público, além de oferecer a organizadores um painel administrativo (ADM) para gerenciar todo o conteúdo sem depender de desenvolvedores a cada edição.

O diferencial do projeto é a **configurabilidade**: a cada nova edição da corrida (ano, percurso, patrocinadores, fotos), a equipe organizadora deve conseguir atualizar o site sozinha, através de um painel de administração intuitivo, sem necessidade de nova contratação de desenvolvimento.

---

## 2. Objetivos do Projeto

### 2.1 Objetivo geral
Criar uma plataforma digital institucional e funcional para o Run4BrasilAfrica, capaz de sustentar múltiplas edições do evento ao longo dos anos com o mínimo de manutenção técnica.

### 2.2 Objetivos específicos
- Apresentar a corrida de forma atrativa e profissional (institucional + emocional).
- Facilitar e centralizar as inscrições dos participantes.
- Exibir o percurso oficial integrado ao Strava.
- Permitir que a organização atualize textos, imagens, banners e links sem código.
- Criar um canal de relacionamento com participantes, patrocinadores e apoiadores.
- Fortalecer a causa social ligada ao evento (Brasil-África).

---

## 3. Público-Alvo

| Segmento | Necessidade no site |
|---|---|
| Corredores/participantes | Informações do evento, percurso, inscrição, resultados |
| Patrocinadores/apoiadores | Visibilidade de marca, números do evento, mídia kit |
| Imprensa | Releases, fotos em alta resolução, dados institucionais |
| Organização (ADM) | Gestão de conteúdo, configuração de campanhas por edição |

---

## 4. Escopo Funcional

### 4.1 Área Pública (site institucional)

**Página inicial da corrida**, contendo:

1. **Banner/Hero rotativo**
   - Carrossel com fotos e vídeos das edições anteriores.
   - Textos de destaque sobrepostos (data, local, chamada para inscrição).
   - Configurável via ADM (upload de imagens, ordem, texto, call-to-action).

2. **Galeria de imagens**
   - Organizada por edição/ano ou por álbum (ex: "Largada", "Percurso", "Premiação").
   - Upload em lote pelo ADM, com geração automática de miniaturas (thumbnails).
   - Opção de exibir também vídeos (YouTube/Instagram embed).

3. **Percurso da corrida (integração Strava)**
   - Exibição do mapa/rota importada de uma atividade ou "rota" do Strava.
   - Dados complementares: distância, elevação, ponto de largada/chegada.
   - Atualização via API do Strava (ou upload manual do GPX como alternativa/fallback, caso a integração falhe).

4. **Inscrição**
   - Botão/link de destaque para inscrição (pode apontar para plataforma parceira de inscrição esportiva ou para um checkout próprio, ver seção 4.3).
   - Exibição de valores, lotes/categorias e prazo, se aplicável.

5. **Objetivos e causa social**
   - Texto institucional sobre a proposta do evento e a conexão Brasil-África.
   - Indicadores de impacto (ex: valor arrecadado, instituições apoiadas — se aplicável).

6. **Seções complementares recomendadas** (sugestão de valor agregado):
   - Patrocinadores/apoiadores (logos com link).
   - Perguntas frequentes (FAQ).
   - Kit do atleta / regulamento (download de PDF).
   - Contato / redes sociais.
   - Depoimentos de participantes de edições anteriores.

### 4.2 Painel Administrativo (ADM)

Acesso via login (autenticação segura, com controle de permissões), permitindo:

- **Gestão do banner:** upload/remoção/reordenação de imagens e vídeos, edição de textos e botões.
- **Gestão da galeria:** criação de álbuns, upload em lote, exclusão, ordenação.
- **Gestão de textos:** edição de todos os textos da página inicial (objetivos, sobre o evento, causa social) via editor de texto rico (WYSIWYG).
- **Configuração do Strava:** inserir/atualizar o link ou ID da rota, gerenciar token de conexão da API.
- **Gestão de links:** botão de inscrição, redes sociais, WhatsApp, doações.
- **Gestão de patrocinadores:** cadastro de logo, link e categoria (ouro/prata/bronze, por exemplo).
- **Controle de usuários administrativos:** múltiplos níveis de acesso (ex: administrador geral, editor de conteúdo).
- **Configuração multi-edição:** possibilidade de manter histórico de edições anteriores (2024, 2025, 2026...) sem apagar dados.
- **Log de alterações:** rastreabilidade de quem alterou o quê (auditoria simples).

### 4.3 Considerações sobre pagamento/inscrição

Existem dois caminhos possíveis, com implicações diferentes de custo e prazo:

| Opção | Descrição | Prós | Contras |
|---|---|---|---|
| A. Link para plataforma parceira (ex: Ticket Sports, Yescom, Sympla) | Site apenas linka/embeda a inscrição de terceiros | Rápido, sem responsabilidade sobre pagamento/PCI | Menos controle de marca e dados dos inscritos |
| B. Checkout próprio (gateway de pagamento integrado, ex: Pagar.me, Mercado Pago, Stripe) | Inscrição e pagamento dentro do próprio site | Controle total, marca, dados próprios | Maior custo/complexidade, requer conformidade (PCI, LGPD), suporte a estornos |

**Recomendação:** iniciar com a Opção A (mais rápida e barata) e evoluir para a Opção B em edições futuras, se o volume justificar o investimento.

---

## 4.4 Diretrizes de Design e Experiência (UI/UX)

O site deve transmitir energia, movimento e emoção — reforçando a identidade esportiva e a causa social do evento — através de um design moderno, sem recorrer a emojis em nenhum ponto da interface (textos, botões, notificações, e-mails transacionais).

**Direção visual:**
- Identidade visual forte e autoral, evitando templates genéricos: paleta de cores conectada ao Brasil e à África, tipografia com personalidade (headings expressivos, texto de leitura limpo).
- Uso de fotografia em alta qualidade como protagonista visual (corredores, largada, paisagens), não apenas ilustrações genéricas de banco de imagens.
- Hierarquia visual clara: banner de impacto, seguido por blocos de conteúdo bem espaçados, sem poluição visual.
- Design totalmente responsivo, com atenção especial à experiência mobile (grande parte do público acessará pelo celular).

**Animações e microinterações:**
- Banner/hero com transições suaves entre imagens (fade, parallax leve ou zoom sutil), transmitindo dinamismo sem sobrecarregar a página.
- Animações de entrada ao rolar a página (scroll reveal) para seções como galeria, objetivos e patrocinadores.
- Microinterações em botões e links (hover, estados de clique) para dar sensação de resposta e qualidade.
- Contadores animados para números de impacto (ex: participantes, edições realizadas, valor arrecadado), quando aplicável.
- Mapa do percurso (Strava) com animação de traçado da rota ao carregar a seção.
- Todas as animações devem ser leves em performance (usando CSS/GPU-friendly ou bibliotecas como Framer Motion/GSAP) e respeitar configurações de acessibilidade (usuários que preferem menos movimento na tela).

**Restrição de conteúdo:**
- Não utilizar emojis em nenhum texto, botão, título ou notificação do site, do painel ADM ou de comunicações automáticas (e-mail de confirmação de inscrição, etc.). A comunicação deve manter tom institucional e esportivo, com elegância visual entregue via imagens, ícones vetoriais e tipografia — não por emojis.

---

## 5. Arquitetura Técnica Sugerida

| Camada | Sugestão | Observação |
|---|---|---|
| Frontend | Next.js (React) | Performance, SEO, fácil de estilizar o site institucional |
| Backend/API | Node.js ou mesmo Next.js API routes | Simplicidade de manutenção |
| Banco de dados | PostgreSQL (ex: Supabase) | Já facilita autenticação, storage de imagens e API pronta |
| Armazenamento de mídia | Supabase Storage / Cloudflare R2 / AWS S3 | Para banners, galeria e uploads do ADM |
| Autenticação ADM | Supabase Auth ou Auth0 | Login seguro com controle de papéis (roles) |
| Integração Strava | Strava API (OAuth2) | Requer aplicação registrada no Strava e renovação de token |
| Hospedagem | Vercel / Cloudflare Pages | Custo baixo, deploy simples, boa performance |
| E-mail transacional | Resend / SendGrid | Confirmação de inscrição, contato |

> Observação: essa é uma sugestão de stack moderna e de baixo custo operacional. A escolha final pode variar conforme equipe técnica disponível e orçamento.

---

## 6. Fases do Projeto e Cronograma Estimado

| Fase | Entregas | Duração estimada |
|---|---|---|
| 1. Descoberta e conteúdo | Definição de identidade visual, textos, fotos, regulamento | 1–2 semanas |
| 2. Design (UI/UX) | Protótipo navegável da home e do ADM | 2 semanas |
| 3. Desenvolvimento — site público | Banner, galeria, percurso Strava, seções institucionais | 3–4 semanas |
| 4. Desenvolvimento — painel ADM | Login, CRUD de conteúdo, configurações | 3–4 semanas |
| 5. Integrações | Strava API, link/checkout de inscrição, redes sociais | 1–2 semanas |
| 6. Testes e homologação | Testes de usabilidade, carga (dia de pico de inscrição), responsividade mobile | 1–2 semanas |
| 7. Lançamento | Publicação, divulgação, monitoramento pós-lançamento | Contínuo |

**Estimativa total:** aproximadamente 10 a 14 semanas para a primeira versão completa (site + ADM), a depender da disponibilidade de conteúdo (fotos, textos) e da equipe.

---

## 7. Estimativa de Investimento (referencial)

| Item | Faixa estimada (BRL) | Observação |
|---|---|---|
| Design (UI/UX) | R$ 2.000 – R$ 6.000 | Depende de nível de customização visual |
| Desenvolvimento (site + ADM) | R$ 8.000 – R$ 25.000 | Depende de complexidade e stack |
| Domínio e hospedagem (anual) | R$ 300 – R$ 1.500 | Vercel/Cloudflare + domínio .com.br |
| Gateway de pagamento (se opção B) | Taxa por transação (2–5%) | Só se optar por checkout próprio |
| Manutenção/suporte (mensal) | R$ 300 – R$ 1.000 | Ajustes pontuais, backups, atualizações |

> Valores são referenciais de mercado brasileiro para projetos de porte similar; um orçamento fechado depende do fornecedor/equipe contratada.

---

## 8. Estratégia de Sustentabilidade do Site (multi-edição)

Para o site continuar útil ano após ano sem retrabalho técnico:

- Todo conteúdo variável (fotos, textos, percurso, patrocinadores, link de inscrição) deve estar no ADM, nunca "hardcoded".
- Estrutura de "edição do evento" como entidade no banco de dados (ex: Run4BrasilAfrica 2026, 2027...), permitindo manter histórico e comparações.
- Checklist anual de atualização (o próprio ADM pode guiar a organização com um "modo configuração de nova edição").

---

## 9. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Token do Strava expira/API muda | Ter fallback de upload manual do percurso (GPX/imagem) |
| Pico de acesso no lançamento das inscrições | Hospedagem escalável (Vercel/Cloudflare) e cache de página estática |
| Equipe organizadora sem perfil técnico para usar o ADM | Painel simples, com tutorial em vídeo curto de uso |
| Dependência de plataforma de inscrição terceira | Manter dados de contato próprios (e-mail/WhatsApp) para não depender 100% do parceiro |
| LGPD (dados de inscritos) | Política de privacidade clara, consentimento explícito, dados armazenados com segurança |

---

## 10. Indicadores de Sucesso (KPIs)

- Número de acessos e taxa de conversão para inscrição.
- Tempo médio no site e taxa de rejeição.
- Número de inscrições concluídas via site.
- Engajamento com a galeria (visualizações, compartilhamentos).
- Satisfação da organização com a autonomia do ADM (tempo para atualizar conteúdo por edição).

---

## 11. Próximos Passos Recomendados

1. Validar e priorizar o escopo funcional acima com a organização.
2. Definir se a inscrição será via parceiro (rápido) ou checkout próprio (mais robusto).
3. Levantar material de referência: fotos de edições anteriores, textos institucionais, logotipos de patrocinadores.
4. Criar conta de desenvolvedor no Strava para obter credenciais de API.
5. Escolher stack técnica e fornecedor/equipe de desenvolvimento.
6. Iniciar Fase 1 (Descoberta e conteúdo).

---

*Documento pronto para servir de base de negociação com fornecedores/desenvolvedores ou para uso interno na organização do Run4BrasilAfrica.*
