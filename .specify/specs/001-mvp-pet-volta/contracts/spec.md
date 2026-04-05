# 🐾 Pet Volta MVP — Especificação Funcional (v3)

> **Branch:** `001-mvp-pet-volta`  
> **Data:** 2026-04-05  
> **Status:** Draft v3  
> **Constitution:** [constitution.md](./constitution.md)  
> **Changelog v3:** Landing page (US-011), Stripe como última fase, serviços via plataforma

---

## 1. Visão Geral

### O Que É
Pet Volta é um SaaS de segurança pet que conecta tutores a seus animais de estimação através de tags físicas com QR Code e perfis digitais. Quando um pet é encontrado, qualquer pessoa pode escanear a tag para notificar o tutor com localização em tempo real. O sistema também oferece gestão básica de saúde do pet.

### O Problema
Pets se perdem. Quando isso acontece, o tutor não tem como ser notificado imediatamente nem saber a localização de quem encontrou o animal. Métodos tradicionais (placas com telefone, microchip) dependem de ações manuais lentas. Não existe um canal digital instantâneo entre quem encontra o pet e o tutor.

### A Solução (MVP)
Uma plataforma web (PWA-ready) onde:
1. O tutor cadastra seus pets e cria perfis digitais (todos os planos)
2. Tutores com plano pago recebem tags QR Code físicas para vincular aos pets
3. Qualquer pessoa que encontre o pet escaneia a tag
4. O tutor recebe notificação imediata com geolocalização do scan (precisa ou aproximada)
5. O perfil público do pet mostra informações de contato, emergência e recompensa (se perdido)
6. O tutor pode registrar vacinas e consultas veterinárias

### Público-Alvo
- **Tutor de pet** (usuário): pessoa que possui 1+ animais e deseja rastreabilidade
- **Encontrador** (visitante anônimo): pessoa que escaneia a tag de um pet encontrado
- **Administrador** (futuro): gestão da plataforma

---

## 2. User Stories

### US-001: Cadastro e Autenticação do Tutor
**Como** tutor de pet, **quero** criar uma conta e fazer login, **para** acessar o dashboard e gerenciar meus pets.

**Critérios de Aceite:**
- [ ] Cadastro via email + senha com confirmação de e-mail
- [ ] Login social com Google (OAuth 2.0 via Supabase Auth)
- [ ] Recuperação de senha via e-mail
- [ ] Após login, redirecionar para `/dashboard`
- [ ] Sessão mantida via Supabase Auth com refresh token automático
- [ ] Logout limpa todos os tokens locais
- [ ] Rate limiting: máximo 5 tentativas de login falhas em 15 minutos
- [ ] Novo cadastro recebe plano `digital` (free) automaticamente

### US-002: Gestão do Perfil do Tutor
**Como** tutor, **quero** manter meu perfil atualizado, **para** que quem encontre meu pet saiba como me contatar.

**Critérios de Aceite:**
- [ ] Campos editáveis: nome completo, telefone principal, telefone emergência, cidade, estado
- [ ] Foto de perfil com upload (max 2MB, formatos: jpg, png, webp)
- [ ] Telefone exibido na página pública do pet (com opção de ocultar)
- [ ] Validação de telefone brasileiro (formato: +55 XX XXXXX-XXXX)
- [ ] Endereço NÃO é exibido publicamente (apenas cidade/estado)

### US-003: Cadastro de Pet
**Como** tutor, **quero** cadastrar meus pets, **para** criar perfis que serão acessados via QR Code ou link direto.

**Critérios de Aceite:**
- [ ] Campos obrigatórios: nome do pet, espécie (cachorro/gato/outro), raça, porte (P/M/G)
- [ ] Campos opcionais: data de nascimento, cor predominante, microchip ID, observações médicas, temperamento
- [ ] Upload de fotos limitado pelo plano:
  - Digital (Free): 1 foto
  - Essential: 2 fotos
  - Elite: galeria ilimitada (até 10 fotos)
  - Guardian: galeria ilimitada (até 10 fotos)
- [ ] Max 2MB por foto (formatos: jpg, png, webp)
- [ ] Quantidade de pets limitada pelo plano:
  - Digital (Free): 1 pet
  - Essential: 1 pet
  - Elite: 3 pets
  - Guardian: 5 pets
- [ ] Ao atingir o limite, exibir CTA de upgrade de plano
- [ ] Cada pet recebe um `petId` único (UUID v4)
- [ ] Cada pet também recebe um `publicSlug` único para acesso direto (plano Digital sem tag)

### US-004: Ativação de Tag QR Code
**Como** tutor com plano pago (Essential+), **quero** ativar uma tag escaneando-a, **para** vincular a tag ao meu pet.

**Critérios de Aceite:**
- [ ] **Apenas planos Essential, Elite e Guardian** incluem tags físicas
- [ ] Cada tag física possui um `tagCode` único impresso e codificado no QR
- [ ] URL do QR: `https://petvolta.com.br/t/{tagCode}`
- [ ] Fluxo de ativação:
  1. Tutor escaneia QR → abre URL no navegador
  2. Se logado e tag "órfã" (não vinculada): redireciona para tela de vinculação
  3. Tutor seleciona pet da lista → confirma vinculação (1 clique)
  4. Tag fica associada ao pet
- [ ] Se tag já vinculada a outro pet do mesmo tutor: oferecer troca
- [ ] Se tag já vinculada a pet de outro tutor: exibir mensagem "Tag já ativada" + suporte
- [ ] Tutor pode desvincular tag manualmente nas configurações do pet
- [ ] Uma tag = um pet. Um pet pode ter múltiplas tags
- [ ] Tutores do plano Digital veem CTA explicando benefícios da tag + upgrade

### US-005: Página Pública do Pet (SSR)
**Como** qualquer pessoa, **quero** ver o perfil público de um pet ao escanear a tag ou acessar o link, **para** saber como devolver o pet ao tutor.

**Critérios de Aceite:**
- [ ] Rota tag: `https://petvolta.com.br/t/{tagCode}` — renderizada via SSR
- [ ] Rota direta: `https://petvolta.com.br/p/{publicSlug}` — para pets sem tag (plano Digital)
- [ ] LCP < 1.5s em conexão 3G simulada
- [ ] **Modo Normal** (pet está `safe`):
  - Exibe: nome do pet, foto principal, espécie, raça, idade calculada, observações médicas relevantes (alergias, medicação contínua)
  - Exibe: nome do tutor, cidade/estado, botão "Entrar em Contato" (abre WhatsApp ou telefone)
  - NÃO solicita geolocalização
  - Mensagem: "Eu sou o {nome}! Se me encontrou, entre em contato com meu tutor 💛"
- [ ] **Modo Alerta** (pet está `lost`):
  - UI muda visualmente: banner vermelho/laranja proeminente, animação de urgência sutil
  - Mensagem: "⚠️ {nome} está perdido! Ajude a devolvê-lo ao tutor."
  - **Exibe recompensa** se definida: "🎁 Recompensa: R$ {valor}" com destaque visual
  - Solicita geolocalização do navegador ao encontrador (com mensagem clara sobre o motivo)
  - Se geolocalização concedida: envia coordenadas precisas junto com notificação
  - **Se geolocalização negada: captura localização aproximada via IP do encontrador** (cidade/região)
  - Exibe formulário simplificado: "Onde você encontrou?" (campo de texto livre) + "Enviar localização"
  - Botão de contato direto com mais destaque visual
- [ ] Se tag não vinculada: exibir tela genérica "Tag Pet Volta" com CTA para criar conta
- [ ] Meta tags OpenGraph e Twitter Card para compartilhamento em redes sociais
- [ ] Página NÃO requer JavaScript para exibir informações básicas (SSR completo)

### US-006: Notificação de Scan ao Tutor
**Como** tutor, **quero** ser notificado imediatamente quando alguém escaneia a tag do meu pet, **para** saber que alguém o encontrou.

**Critérios de Aceite:**
- [ ] A cada scan da tag por um visitante, um evento de scan é registrado
- [ ] Dados do evento: timestamp, geolocalização precisa (se concedida), **localização aproximada via IP (sempre)**, user-agent, IP (anonimizado)
- [ ] Notificação enviada via:
  - **E-mail** (sempre): template transacional com:
    - Mapa estático da localização precisa (se geoloc concedida)
    - **OU cidade/região aproximada via IP** (se geoloc negada)
    - Texto: "Localização aproximada: {cidade}, {estado}" quando via IP
  - **Realtime** (se tutor online no dashboard): toast notification via Supabase Realtime
- [ ] Histórico de scans visível no dashboard do pet (com indicador de precisão: 📍 preciso / 📌 aproximado)
- [ ] Debounce: múltiplos scans da mesma tag pelo mesmo IP em < 5 minutos = 1 notificação
- [ ] Tutor pode silenciar notificações temporariamente (snooze 1h, 8h, 24h)

### US-007: Modo Alerta (Pet Perdido) + Recompensa
**Como** tutor, **quero** marcar meu pet como perdido e oferecer uma recompensa, **para** que a página pública incentive a devolução.

**Critérios de Aceite:**
- [ ] Toggle "Meu pet está perdido" no dashboard do pet
- [ ] **Campo de recompensa** (opcional): valor em R$ (mínimo R$ 0, sem máximo)
  - Input numérico com máscara de moeda brasileira
  - Valor armazenado em centavos (integer) para evitar float
  - Tutor pode alterar o valor a qualquer momento enquanto pet está `lost`
  - Se valor = 0 ou vazio: nenhuma recompensa é exibida na página pública
- [ ] **Campo de descrição do desaparecimento** (opcional): texto livre (max 500 caracteres)
  - Onde foi visto pela última vez, circunstâncias, etc.
  - Exibido na página pública em Modo Alerta
- [ ] Ao ativar modo perdido:
  - Status do pet muda de `safe` → `lost`
  - Página pública SSR muda para Modo Alerta (US-005)
  - Cache da página SSR é invalidado imediatamente (revalidação on-demand)
  - Timestamp do "perdido desde" é registrado
- [ ] Ao desativar:
  - Status volta para `safe`
  - Recompensa e descrição são preservados (não apagados) mas não exibidos
  - Página pública volta ao Modo Normal
  - Histórico do evento é mantido
- [ ] Confirmação antes de ativar/desativar (diálogo com texto claro)

### US-008: Gestão de Registros de Saúde
**Como** tutor, **quero** registrar vacinas e consultas veterinárias, **para** manter o histórico de saúde do meu pet organizado.

**Critérios de Aceite:**
- [ ] Tipos de registro: `vaccination`, `consultation`, `medication`, `exam`
- [ ] Campos por tipo:
  - **Vacinação**: nome da vacina, data, próxima dose, veterinário, observações
  - **Consulta**: motivo, data, veterinário, diagnóstico, observações
  - **Medicação**: nome, dosagem, frequência, data início, data fim
  - **Exame**: tipo do exame, data, resultado, arquivo anexo (PDF até 5MB)
- [ ] Quantidade de registros limitada pelo plano:
  - Digital (Free): máximo 2 registros por mês (rolling window)
  - Essential: ilimitado
  - Elite: ilimitado
  - Guardian: ilimitado
- [ ] Ao atingir limite, exibir CTA de upgrade
- [ ] Registros ordenados por data (mais recente primeiro)
- [ ] Informações de saúde NÃO são exibidas na página pública (exceto alergias/medicação contínua marcadas como "visível em emergência")

### US-009: Gestão de Planos e Pagamento
**Como** tutor, **quero** assinar e gerenciar meu plano, **para** desbloquear funcionalidades premium.

**Critérios de Aceite:**
- [ ] **4 Planos:**

| Feature | Digital (Free) | Essential | Elite | Guardian |
|---|---|---|---|---|
| **Valor** | R$ 0 | Assinatura + Tag | Assinatura + Tag | Assinatura + Tag |
| **Pets** | 1 | 1 | 3 | 5 |
| **Tag QR física** | ❌ | ✅ 1 inclusa | ✅ 3 inclusas | ✅ 5 inclusas |
| **Fotos por pet** | 1 | 2 | Galeria (até 10) | Galeria (até 10) |
| **Registros saúde** | 2/mês | Ilimitado | Ilimitado | Ilimitado |
| **Notificação e-mail** | ✅ | ✅ | ✅ | ✅ |
| **Notificação realtime** | ❌ | ✅ | ✅ | ✅ |
| **Recompensa (lost)** | ❌ | ✅ | ✅ | ✅ |
| **Multi-tutor** | ❌ | ❌ | ✅ (compartilhamento) | ✅ (compartilhamento) |
| **Histórico scans** | 7 dias | 90 dias | 1 ano | Ilimitado |
| **Acesso antecipado** | ❌ | ❌ | ❌ | ✅ |
| **Suporte** | Comunidade | E-mail | E-mail prioritário | VIP (WhatsApp) |

- [ ] **Plano Digital (Free):**
  - Perfil digital do pet acessível via link direto `/p/{publicSlug}`
  - Sem tag QR física (pet não pode ser "escaneado" por desconhecidos)
  - Notificação de scan não se aplica (não tem tag)
  - Funciona como "vitrine" do produto — tutor vê valor e faz upgrade
  - Recompensa NÃO disponível (incentivo para upgrade)
- [ ] Checkout via Stripe Checkout (redirect, não embedded)
- [ ] Gerenciamento de assinatura via Stripe Customer Portal
- [ ] Webhook do Stripe atualiza `subscription_status` e `plan_tier` no Supabase
- [ ] RLS policies no Supabase verificam `plan_tier` para enforçar limites
- [ ] Downgrade: pets e registros excedentes ficam em modo "somente leitura" (não são deletados)
- [ ] Período de trial: 7 dias Essential gratuito no primeiro cadastro (sem cartão)
- [ ] **Multi-tutor (Elite+):** owner pode convidar co-tutores via email. Co-tutor tem acesso de leitura + recebe notificações de scan. Não pode editar ou deletar.

### US-010: Dashboard do Tutor
**Como** tutor, **quero** ver um resumo de todos os meus pets e atividades, **para** ter uma visão geral rápida.

**Critérios de Aceite:**
- [ ] Layout: Bento Grid responsivo (mobile: 1 coluna, tablet: 2 colunas, desktop: 3 colunas)
- [ ] Cards do dashboard:
  - **Meus Pets**: grid de cards com foto, nome, status (safe/lost), último scan, recompensa ativa
  - **Atividade Recente**: timeline dos últimos 10 eventos (scans, alterações de status)
  - **Plano Atual**: nome do plano, data de renovação, uso (X/Y pets, X/Y registros)
  - **Alertas**: pets em modo `lost` com destaque visual + valor da recompensa
- [ ] Ações rápidas: "+ Novo Pet", "Ativar Tag" (se plano pago), "Upgrade de Plano"
- [ ] Para plano Digital: banner persistente mostrando benefícios do upgrade + tag
- [ ] Pull-to-refresh em mobile
- [ ] Skeleton loading para cada card individualmente

### US-011: Landing Page Pública
**Como** visitante do site, **quero** entender o que é o Pet Volta e ver os planos disponíveis, **para** decidir se quero criar uma conta.

**Critérios de Aceite:**
- [ ] Rota: `/` — renderizada via SSR (prerender estático)
- [ ] LCP < 1.5s, Lighthouse Performance ≥ 90
- [ ] **Header (sticky):**
  - Logo Pet Volta no canto esquerdo
  - Menu de navegação central: "Como Funciona", "Planos", "FAQ" (smooth scroll para seções)
  - Botões no canto direito: "Entrar" (outline) e "Criar Conta" (gradient primary→secondary)
  - Mobile: hamburger menu colapsável abaixo de `lg:`
  - Ao scrollar: backdrop blur (`bg-white/80 backdrop-blur-md`) com sombra sutil
- [ ] **Hero Section:**
  - Background gradient blue→violet (eixo TypeUI Colorful)
  - Headline principal: chamada apelativa sobre segurança do pet
  - Subtítulo: explicação curta do que o Pet Volta faz
  - 2 CTAs: "Começar Grátis" (botão grande, branco sobre gradient) e "Conhecer Planos" (outline branco, scroll)
  - Elemento visual: mockup/ilustração de celular mostrando a página pública do pet
- [ ] **Seção "Como Funciona":**
  - 3 passos com ícones: Cadastre → Ative a tag → Seja notificado
  - Layout em row (desktop) ou column (mobile)
- [ ] **Seção "Planos":**
  - 4 cards comparativos (Digital, Essential, Elite, Guardian)
  - Plano Elite com destaque visual (borda gradient, badge "Recomendado")
  - Features listadas conforme tabela da US-009
  - Todos os botões redirecionam para `/auth/register` (Stripe é integrado por último)
  - Preços visíveis
- [ ] **Seção "Depoimentos":**
  - 3 cards de depoimentos fictícios (até ter usuários reais)
  - Cada card: avatar (iniciais), nome fictício, cidade, texto do depoimento, 5 estrelas
  - Disclamer visual sutil: dados fictícios para demonstração
- [ ] **Seção "FAQ":**
  - Mínimo 6 perguntas frequentes em formato accordion (expandir/colapsar)
  - Perguntas: Como funciona? O que acontece no scan? Preciso pagar? Dados seguros? Posso cancelar? O que é recompensa?
- [ ] **CTA Final:**
  - Barra gradient com chamada para ação e botão "Criar Conta Grátis"
- [ ] **Footer:**
  - Logo Pet Volta
  - Links: Sobre, Política de Privacidade, Termos de Uso, Contato
  - Copyright
- [ ] Toda a página funciona sem JavaScript para conteúdo básico (SSR)
- [ ] Meta tags: title, description, OG image estática, Twitter Card

---

## 3. Requisitos Não Funcionais

### RNF-001: Performance
- LCP < 1.5s para rotas SSR públicas em 3G
- TTI < 3s para dashboard em 4G
- Bundle size < 150KB gzipped (initial load)
- Imagens servidas em WebP com lazy loading e `srcset` responsivo
- Fonts: `font-display: swap` com preload das fontes críticas

### RNF-002: Segurança
- HTTPS obrigatório (HSTS)
- CSP headers configurados
- Supabase RLS em TODAS as tabelas — nenhuma tabela sem policy
- Dados de geolocalização (precisa e IP) anonimizados após 90 dias
- Stripe webhooks validados via signature verification
- Rate limiting em endpoints públicos (scan): 60 req/min por IP
- Sanitização de inputs em todas as camadas
- IP do encontrador NUNCA é exposto ao tutor (apenas hash + localização derivada)

### RNF-003: Disponibilidade & Constraints Supabase Free
- **Supabase Free tier** (não-negociável até validação do MVP):
  - 500 MB database storage
  - 1 GB file storage
  - 5 GB database egress/mês
  - 50,000 MAUs auth
  - 500,000 Edge Function invocations/mês
  - 2 projetos ativos máximo
  - **Projeto pausa após 7 dias sem atividade** — mitigar com cron ping
  - **Sem backups automáticos** — implementar backup manual via pg_dump semanal
  - 50 MB max file size
- Graceful degradation: página pública funciona mesmo se Realtime estiver down
- Edge Functions com timeout de 10s e retry com backoff exponencial

### RNF-004: Observabilidade
- Sentry para error tracking no frontend + Edge Functions
- Logs estruturados em todas as Edge Functions (JSON, com correlation ID)
- Métricas de scan por tag/hora para detecção de abuso
- **Monitoramento de uso Supabase** (DB size, egress, invocations) via dashboard
- Alertas para: erros de webhook Stripe, falhas de notificação, RLS policy violations
- **Alerta quando DB size > 400MB** (80% do limite free)

### RNF-005: LGPD (Lei Geral de Proteção de Dados)
- Consentimento explícito para coleta de geolocalização precisa (prompt do browser)
- **Localização via IP é coletada sem prompt** (legitimate interest para segurança do pet) — documentado na política de privacidade
- Política de privacidade acessível em toda página pública
- Mecanismo para exclusão de dados do tutor (right to erasure)
- Dados de scan (geoloc + IP hash) anonimizados após 90 dias
- Opt-out de notificações a qualquer momento

### RNF-006: Otimização para Supabase Free
- Implementar cache agressivo no client (TTL 5min para dados estáveis)
- Paginação em todas as listagens (max 20 items por request)
- Imagens comprimidas e redimensionadas ANTES do upload (client-side)
- Queries otimizadas com `.select()` seletivo (nunca `select('*')` em produção)
- **Cron job externo (Vercel Cron ou UptimeRobot)** para ping a cada 5 dias evitando pausa do projeto
- Monitorar egress: implementar `count` antes de `select` para listagens grandes
- Edge Functions: minimizar chamadas encadeadas — consolidar lógica quando possível

---

## 4. Fora do Escopo (MVP)

Os seguintes itens são explicitamente **NÃO** parte do MVP:

- [ ] Marketplace B2B para clínicas e pet shops
- [ ] Integração com softwares veterinários
- [ ] Hardware de rastreamento GPS ativo
- [ ] Mural de pets desaparecidos com geofencing
- [ ] App mobile nativo (iOS/Android)
- [ ] Multi-idioma (MVP é pt-BR apenas)
- [ ] Chat entre tutor e encontrador
- [ ] Push notifications nativas (Web Push) — adiado pós-MVP
- [ ] Pagamento de recompensa via plataforma (apenas exibição do valor)
- [ ] Venda avulsa de tags extras (MVP: tags incluídas no plano)

---

## 5. Métricas de Sucesso (MVP)

| Métrica | Target (3 meses) |
|---|---|
| Cadastros de tutores | 500 |
| Pets cadastrados | 700 |
| Tags ativadas | 300 |
| Taxa de conversão Digital → Essential | 12% |
| LCP médio da página pública | < 1.2s |
| Tempo de notificação (scan → email) | < 30s |
| DB size (Supabase) | < 300MB |
| Edge Function invocations/mês | < 300,000 |

---

## 6. Review & Acceptance Checklist

- [ ] Todas as User Stories têm critérios de aceite verificáveis
- [ ] Requisitos não funcionais têm métricas mensuráveis
- [ ] Escopo do MVP está claramente delimitado
- [ ] Não há referência a tecnologia específica na seção de User Stories
- [ ] Fluxos de edge case estão documentados (tag já vinculada, geoloc negada, limite atingido, IP geoloc fallback)
- [ ] Requisitos de segurança e privacidade estão explícitos
- [ ] Métricas de sucesso são rastreáveis
- [ ] Constraints do Supabase Free estão documentados com mitigações
- [ ] Feature de recompensa está documentada com regras de exibição por plano
- [ ] Geolocalização por IP como fallback está especificada
- [ ] Diferença entre plano Digital (sem tag) e planos pagos (com tag) está clara
- [ ] Landing page com todas as seções especificadas (header, hero, planos, depoimentos, FAQ, footer)
- [ ] Integração Stripe é a última fase — todos os fluxos funcionam com plano mockado antes
