# 🐾 Pet Volta MVP — Task Breakdown (v2)

> **Branch:** `001-mvp-pet-volta`  
> **Spec:** [spec.md](./spec.md) (v2)  
> **Plan:** [plan.md](./plan.md) (v2)  
> **Changelog:** Tasks adicionadas para recompensa, IP geoloc, 4 planos, Supabase Free mitigações

---

## Legenda

- `[P]` = Pode ser executada em paralelo com a task anterior
- `[B]` = Bloqueante — tasks seguintes dependem desta
- `[T]` = Inclui testes obrigatórios
- `[NEW]` = Task nova na v2
- `→ Checkpoint` = Ponto de validação antes de continuar

---

## Fase 0 — Setup do Projeto e Infraestrutura

### T001 [B] — Scaffold do Projeto Angular 21
- `ng new pet-volta --style=css --ssr --routing`
- `provideZonelessChangeDetection()` em `app.config.ts`
- Path aliases: `@core/*`, `@shared/*`, `@features/*`, `@ui/*`, `@models/*`, `@env/*`
- Remover `zone.js` dos polyfills

### T002 [B] — Configurar Tailwind CSS v4 + Design Tokens TypeUI Colorful
- Tokens de cor conforme TypeUI Colorful: primary (#3B82F6), secondary (#8B5CF6), success, warning, danger
- Fontes: Outfit (display/titles), Inter (body), JetBrains Mono (code/IDs)
- `borderRadius`: `rounded-pet: 24px`, `rounded-pet-sm: 16px`
- Grid 8px (conforme TypeUI Colorful)
- Gradientes: `from-blue-500 to-violet-500` (eixo principal TypeUI)

### T003 [B] — Configurar Supabase Local + Schema v2
**Migrations:**
- `001_enums.sql`: plan_tier (`digital`, `essential`, `elite`, `guardian`), pet_species, pet_size, pet_status, tag_status, health_record_type, subscription_status
- `002_tables.sql`: profiles, pets (com `public_slug`, `reward_amount_cents`, `lost_description`, `max_photos`), tags, health_records, scan_events (com `ip_city`, `ip_region`, `ip_country`, `ip_lat`, `ip_lon`, `location_type`), notification_prefs, pet_co_tutors, stripe_events
- `003_triggers.sql`: auto-create profile, auto-create notification_prefs, updated_at triggers
- `004_rls_policies.sql`: todas as policies (DENY default, ALLOW explícito)
- `005_storage_buckets.sql`: pet-photos (public), avatars (public), health-attachments (private)
- `006_seed_tags.sql`: inserir 20 tags orphan para testes

### T004 [P] — Instalar e Configurar Zard UI + Customização Colorful
- `npx zard-cli init`
- Adicionar componentes: button, input, card, badge, dialog, toast, skeleton, avatar, dropdown, tabs, select, switch, separator, label
- Customizar tokens para paleta TypeUI Colorful
- Customizar border-radius para `rounded-pet`
- Verificar compatibilidade Angular 21 + zoneless

### T005 [P] — Configurar Sentry + Environments + Vercel
- Sentry Angular SDK com DSN por environment
- `environment.ts` / `environment.prod.ts`: Supabase URL, anon key, Stripe key
- Configurar `vercel.json` básico com rewrites para Angular SSR

### T006 [P][NEW] — Vercel Cron Job Anti-Pausa Supabase
- Criar `api/keepalive.ts` (Vercel Serverless Function)
- SELECT simples no Supabase (`tags` LIMIT 1)
- Configurar em `vercel.json`: cron a cada 5 dias
- Verificar que ping mantém projeto ativo

### → Checkpoint Fase 0
- [ ] `ng serve` funciona sem Zone.js
- [ ] Tailwind com tokens TypeUI Colorful renderiza gradientes blue→violet
- [ ] `supabase start` roda todas as migrations (schema v2)
- [ ] Zard UI componentes com paleta customizada
- [ ] Cron anti-pausa configurado

---

## Fase 1 — Core: Auth + Supabase Service Layer + Plan Limits

### T007 [B][T] — Supabase Client Service
- `SupabaseService` singleton com createClient()
- SSR-aware: `createServerClient` no server, `createBrowserClient` no browser
- Signal `currentUser` via `auth.onAuthStateChange`

### T008 [B][T] — Auth Service + Guard + Interceptor
- signUp (plano `digital` automático), signIn, signInWithGoogle, signOut, resetPassword
- `authGuard`: CanActivateFn → redirect `/auth/login`
- `authInterceptor`: Bearer token

### T009 [T] — Telas de Auth
- Login: email + senha, botão Google
- Registro: nome, email, senha, confirmar
- Forgot password
- SSR prerender para rotas auth

### T010 [B][NEW][T] — Plan Limits Service
**Arquivo:** `src/app/shared/utils/plan-limits.ts` + `src/app/core/plan/plan.service.ts`

- Constantes `PLAN_LIMITS` (conforme plan.md Seção 2.5)
- `PlanService`: getCurrentPlan(), canAddPet(), canAddHealthRecord(), canSetReward(), canInviteCoTutor(), hasTagAccess(), getPhotoLimit()
- Signal `currentPlan` derivado do `profiles.plan_tier`
- Usado em guards, componentes e formulários para UX de limite
- **NÃO é a barreira de segurança** (RLS é) — é para UX feedback

### → Checkpoint Fase 1
- [ ] Registro → login → dashboard (tela vazia) → logout
- [ ] Google OAuth funcional
- [ ] Novo usuário tem `plan_tier = 'digital'` automaticamente
- [ ] `PlanService.canAddPet()` retorna correto para cada plano

---

## Fase 2 — Pet Management + Tag + Slug Público

### T011 [B][T] — Pet Service (CRUD + Slug + Photos)
- Interface `Pet` com campos v2 (public_slug, reward_amount_cents, lost_description, max_photos)
- CRUD via Supabase SDK (RLS protege)
- Geração automática de `public_slug` (formato: `{petName}-{random4chars}`)
- Upload de fotos respeitando limite do plano (`max_photos` derivado de `plan_tier`)
- Compressão client-side antes do upload (canvas resize → max 500KB)

### T012 [T] — Telas de Pet Management
- Pet List: grid cards com status badge, indicador de recompensa ativa
- Pet Form: formulário completo, upload de fotos (respeitando limite), validações
- Pet Detail: tabs (Info, Saúde, Tags, Scans), badge de plano, CTA upgrade
- Empty state quando não tem pets
- Banner "Tenha uma tag física" para plano Digital

### T013 [B][T] — Edge Function: Activate Tag
- Recebe `{tagCode, petId}` + auth token
- **Verifica que tutor tem plano com tag** (essential+)
- Verifica: tag orphan? Pet pertence ao tutor?
- UPDATE tag: `pet_id, status='active', activated_by, activated_at`
- Rejeita se plano `digital`

### T014 [T] — Tela de Ativação de Tag
- Se tutor é `digital`: mostrar página de upgrade em vez da ativação
- Se tutor tem plano pago: fluxo normal de seleção de pet + 1 clique

### → Checkpoint Fase 2
- [ ] Criar pet com slug público → acessar `/p/{slug}` (tela básica)
- [ ] Ativar tag (plano essential+) → tag vinculada
- [ ] Plano digital bloqueado de ativar tag com CTA de upgrade
- [ ] Limites de fotos por plano funcionam

---

## Fase 3 — Scan, Notificação, IP Geoloc e Página Pública

### T015 [B][T][NEW] — Módulo IP Geolocation (Edge Function)
**Arquivo:** `supabase/functions/_shared/ip-geolocation.ts`

- Extrair IP do header `X-Forwarded-For` (Supabase Edge Functions suportam)
- Consultar `http://ip-api.com/json/{ip}?fields=status,city,regionName,country,lat,lon`
- Retornar `{ city, region, country, lat, lon }` ou `null` se falhar
- Timeout: 3 segundos (não bloquear o scan se ip-api falhar)
- Não armazenar IP raw — apenas dados derivados

### T016 [B][T] — Edge Function: Scan (v2 com IP Geoloc)
- Endpoint público (anon key)
- Recebe `{tagCode, latitude?, longitude?, message?}`
- Rate limiting: 60 req/min por IP, debounce 5min por tag+IP
- Buscar tag → pet → owner → notification_prefs
- **Lógica de localização:**
  1. Se `latitude` e `longitude` presentes → `location_type = 'precise'`
  2. Se não → chamar módulo IP Geolocation → `location_type = 'approximate'`
  3. Se IP geoloc também falhar → `location_type = 'none'`
- INSERT scan_event com todos os dados (dispara Realtime)
- Chamar send-notification internamente
- Retornar `{success, petName, ownerNotified, rewardAmount}`

### T017 [B][T] — Edge Function: Send Notification (v2 com 3 templates)
- Service-role only
- Template 1 — Localização precisa: email com mapa estático (Google Static Maps API ou similar)
- Template 2 — Localização aproximada: email com cidade/região + disclaimer
- Template 3 — Sem localização: email básico com mensagem do encontrador
- Se pet tem recompensa ativa: incluir no email "Recompensa oferecida: R$ X"
- Enviar via Resend API

### T018 [B][T] — Página Pública SSR (v2 com Recompensa + Dual Route)
- **Duas rotas SSR:**
  - `/t/{tagCode}` — acesso via tag QR
  - `/p/{publicSlug}` — acesso via link direto (plano Digital)
- Resolver: buscar tag/slug → pet → owner (dados públicos)
- Modo safe: info + contato (sem geoloc, sem recompensa exibida)
- Modo lost:
  - Banner alerta gradient red→orange
  - **Reward badge** (gradient blue→violet) se `reward_amount_cents > 0` e plano ≥ essential
  - `lost_description` se preenchida
  - Geoloc request → se negada, submit do form envia `ipLocationFallback: true`
- Tag orphan: tela genérica + CTA
- Meta tags OpenGraph dinâmicas (incluindo recompensa no description se lost)
- Funciona sem JavaScript para info básica

### T019 [T] — Realtime Notifications no Dashboard
- Subscribe a `scan_events` filtrado por pet IDs do tutor
- Toast com: nome do pet, localização (precisa ou aproximada), horário
- Indicador visual: 📍 (preciso) vs 📌 (aproximado) vs 📎 (sem localização)
- **Apenas planos essential+** (plano digital não tem realtime)
- Reconnect com exponential backoff

### T020 [T] — Edge Function: Toggle Lost (v2 com Recompensa)
- Recebe `{petId, status, rewardAmountCents?, lostDescription?}` + auth token
- Verificar ownership
- Se ativando `lost`:
  - UPDATE pet: status='lost', lost_since=now(), reward_amount_cents, lost_description
  - **Verificar que plano permite recompensa** (essential+) — se digital, ignorar reward
- Se desativando:
  - UPDATE pet: status='safe' (preservar reward_amount_cents e lost_description)
- Invalidar cache SSR via Vercel API: `POST https://api.vercel.com/v1/projects/{id}/revalidate?path=/t/{tagCode}&path=/p/{slug}`
- Retornar pet atualizado

### → Checkpoint Fase 3
- [ ] Scan com geoloc → email com mapa → toast no dashboard 📍
- [ ] Scan sem geoloc → email com "São Paulo, SP" → toast com 📌
- [ ] Scan com ip-api down → email básico → toast com 📎
- [ ] Recompensa exibida na página pública quando lost + valor > 0
- [ ] Plano digital: sem recompensa, sem realtime
- [ ] `/p/{slug}` funciona para pets sem tag
- [ ] LCP < 1.5s nas rotas públicas

---

## Fase 4 — Health Records + Planos + Pagamento

### T021 [T] — Health Records Service + Telas
- CRUD via Supabase SDK
- Formulário dinâmico por tipo
- **Limite mensal para plano digital:** verificar count de registros no mês corrente
- Upload de anexo (PDF até 5MB)
- Lista com filtro por tipo, ordenada por data

### T022 [B][T] — Stripe Integration (Edge Functions)
- **create-checkout:** Criar Stripe Checkout Session
  - `metadata`: `{userId, planTier}`
  - Prices: 3 products (essential, elite, guardian)
  - Trial: 7 dias essential sem cartão
- **create-portal:** Stripe Customer Portal Session
- **stripe-webhook:** Processar eventos:
  - `checkout.session.completed` → UPDATE profile plan_tier + subscription_status
  - `customer.subscription.updated` → UPDATE plan_tier
  - `customer.subscription.deleted` → plan_tier = 'digital', subscription_status = 'canceled'
  - `invoice.payment_failed` → subscription_status = 'past_due'
- Signature verification + idempotency (tabela stripe_events)
- **Downgrade handling:** ao ir para digital, pets excedentes → readonly, tags desvinculadas (mas mantidas em DB)

### T023 [T] — Tela de Pricing
- Tabela comparativa 4 planos (conforme spec US-009)
- Destaque visual no plano recomendado (Elite)
- Gradientes TypeUI Colorful nos cards de plano
- Botão "Começar Grátis" para Digital (redirect para registro)
- Botões de checkout para pagos
- Indicação do plano atual (se logado)
- Badge "Trial 7 dias" para Essential

### → Checkpoint Fase 4
- [ ] Health records com limite mensal para digital
- [ ] Checkout Stripe → plan_tier atualizado → limites expandidos
- [ ] Downgrade → pets excedentes readonly
- [ ] Trial 7 dias essential funcional

---

## Fase 5 — Dashboard + Settings + Polish

### T024 [T] — Dashboard Home (Bento Grid)
- Layout shell: sidebar (colapsável) + topbar
- Bento Grid (1 col mobile, 2 tab, 3 desktop) com gradientes TypeUI
- Cards: Meus Pets (com badge de recompensa ativa), Atividade, Plano, Alertas
- **Banner upgrade para digital:** "Proteja seu pet com uma tag QR → Upgrade"
- Skeleton loading, pull-to-refresh

### T025 [T] — Settings (Perfil + Notificações)
- Edição de perfil com validação telefone BR
- Prefs de notificação (email on/off, snooze)
- Zona de perigo: excluir conta (LGPD)

### T026 [NEW][T] — Co-Tutor Management (Elite+)
- Tela de convite: email do co-tutor → INSERT pet_co_tutors (status 'pending')
- Email de convite via Resend com deep link
- Co-tutor aceita → status 'accepted' → recebe notificações de scan
- Owner pode revogar acesso
- **Gate por plano:** apenas elite e guardian veem esta opção

### T027 — SEO + Meta Tags
- Meta service: title, description, OG, Twitter Card dinâmicos
- Recompensa no OG description se pet lost: "Luna está perdida! Recompensa: R$ 500"
- Canonical URLs corretas para `/t/` e `/p/`

### T028 — Performance Audit
- Lighthouse em rotas públicas: score ≥ 90
- Bundle < 150KB gzipped
- Imagens WebP, lazy loading, srcset
- Preload fontes (Outfit 600, Inter 400)
- Verificar que gradientes não impactam CLS

### T029 — Testes E2E (Playwright)
- Fluxo completo: Registro → Pet → Tag → Scan → Email (com mock)
- Fluxo lost: Toggle lost com recompensa → Página pública com badge
- Fluxo plano: Digital → Upgrade → Limites expandidos
- Fluxo IP geoloc: Scan sem browser geoloc → verificar location_type approximate
- Visual regression: screenshots

### T030 — Deploy Pipeline + Monitoramento
- GitHub Actions: lint, type-check, test, build, e2e
- Deploy Vercel: `vercel.json` com cron, rewrites, env vars
- Deploy Supabase: migrations + Edge Functions
- Stripe webhooks para URL produção
- Domínio `petvolta.com.br` + HTTPS + HSTS
- **Monitoramento Supabase Free:** dashboard custom ou script que verifica DB size, egress, invocations

### → Checkpoint Final
- [ ] Quickstart scenarios (plan.md) passam
- [ ] Lighthouse ≥ 90 Performance
- [ ] E2E tests verdes
- [ ] CI/CD pipeline verde
- [ ] Deploy produção acessível
- [ ] Stripe live configurado
- [ ] Cron anti-pausa ativo
- [ ] DB size < 100MB no deploy inicial
