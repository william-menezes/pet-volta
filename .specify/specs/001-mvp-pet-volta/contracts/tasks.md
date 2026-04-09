# 🐾 Pet Volta MVP — Tasks (v4)

**Feature:** MVP Pet Volta  
**Spec:** [spec.md](./spec.md) (v3) | **Plan:** [plan.md](./plan.md) (v3)  
**Visual Identity:** "Organic & Safe" (Green-Organic, Plamev-inspired) — paleta `#2D6A4F`, border-radius 32px, blob shapes, surface `#FDFCF0`  
**Changelog v4:** Reorganizado por User Story (US-001 a US-011) com IDs sequenciais e marcadores [P]/[USN]; identidade visual Green-Organic; Stripe como última fase (Phase 13)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[USN]**: User story correspondente (US1–US11, conforme spec.md)
- Caminhos de arquivo exatos em todas as descriptions

---

## Phase 1: Setup — Scaffold e Infraestrutura Base

**Purpose:** Inicialização do projeto, estrutura de pastas, design system e configurações

- [X] T001 Create Angular 21 project with zoneless + SSR using `ng new pet-volta --directory=. --style=css --ssr --routing --skip-git`
- [X] T002 Configure `provideZonelessChangeDetection()` in `src/app/app.config.ts` and remove zone.js from polyfills in `angular.json`
- [X] T003 Configure path aliases in `tsconfig.json` and `tsconfig.app.json` (@core/*, @shared/*, @features/*, @ui/*, @models/*, @env/*)
- [X] T004 Configure `src/app/app.routes.server.ts` with SSR/CSR render modes per route (SSR for public, CSR for dashboard)
- [X] T005 [P] Create `CLAUDE.md`, `.gitignore`, and `vercel.json` with cron anti-pause config (`"crons": [{"path": "/api/keepalive", "schedule": "0 8 */5 * *"}]`)
- [X] T006 Configure Tailwind CSS v4 with Green-Organic design tokens in `src/styles.css` (primary `#2D6A4F`, secondary `#FFB01F`, accent `#8FBC8F`, success `#1B4332`, warning `#F59E0B`, danger `#BC4749`, surface `#FDFCF0`, text `#1A1C19`; `rounded-pet: 32px`, `rounded-pet-sm: 16px`; shadow `shadow-green-900/5`; blob shape SVG assets)
- [X] T007 [P] Install and configure Zard UI with `npx zard-cli init` and apply Green-Organic palette + 32px border-radius in base card classes; `rounded-full` for buttons and inputs
- [X] T008 [P] Configure environments in `src/environments/environment.ts` and `src/environments/environment.prod.ts` (Supabase URL/keys, Sentry DSN)
- [X] T009 [P] Configure `@sentry/angular` in `src/app/app.config.ts`
- [X] T010 [P] Add Google Fonts preload in `src/index.html` (Outfit 700, Inter 400, JetBrains Mono 400) with `font-display: swap`

**Checkpoint:** `ng serve` funciona sem Zone.js; Tailwind com tokens Green-Organic renderiza (`#2D6A4F` como primary, surface `#FDFCF0`); Zard UI com `rounded-[32px]` e paleta customizada; deploy → Vercel automático

---

## Phase 2: Foundational — Core Services e Supabase

**Purpose:** Infraestrutura central que DEVE estar completa antes de qualquer user story

**⚠️ CRÍTICO:** Nenhuma user story pode começar até esta fase estar completa

- [X] T011 Initialize Supabase project with `supabase init` and `supabase link` in project root
- [X] T012 Create migration `001_enums.sql` in `supabase/migrations/` with all enums (pet_species, pet_size, pet_status, tag_status, health_record_type, plan_tier with 4 values, subscription_status)
- [X] T013 Create migration `002_tables.sql` in `supabase/migrations/` with all tables: profiles, pets (public_slug UNIQUE NOT NULL, reward_amount_cents, lost_description ≤500 chars, max_photos), tags, health_records, scan_events (ip_city, ip_region, ip_country, ip_lat, ip_lon, location_type CHECK), pet_co_tutors, notification_prefs, stripe_events
- [X] T014 Create migration `003_indexes.sql` in `supabase/migrations/` with all performance indexes (idx_pets_owner, idx_pets_status, idx_pets_slug, idx_tags_code, idx_scan_pet, idx_scan_time, idx_scan_debounce, idx_health_pet, idx_health_date, idx_co_tutors_pet, idx_co_tutors_profile)
- [X] T015 Create migration `004_triggers.sql` in `supabase/migrations/` with profile auto-create trigger on `auth.users` INSERT (sets plan_tier = 'digital', full_name from metadata)
- [X] T016 Create migration `005_rls.sql` in `supabase/migrations/` with RLS policies for all tables (pets INSERT plan-limit per tier, health_records monthly limit for digital, pet_co_tutors INSERT elite+, shared pets/scans via accepted co-tutors, tags/scan_events public read for orphan lookup)
- [X] T017 Create migration `006_storage.sql` in `supabase/migrations/` with storage buckets (pet-photos public, avatars public, health-attachments private) and storage RLS policies (owner upload via `{userId}/` prefix, public read for photos/avatars)
- [X] T018 Create migration `007_seed.sql` in `supabase/migrations/` with 20 orphan tags seed data
- [X] T019 [P] Implement `SupabaseClientService` (SSR-aware singleton) in `src/app/core/supabase/supabase-client.service.ts` (createServerClient on server, createBrowserClient on browser; signal `currentUser`)
- [X] T020 Implement `AuthService` in `src/app/core/auth/auth.service.ts` (signUp, signIn, signInWithGoogle, signOut, resetPassword; signals: currentSession, isAuthenticated)
- [X] T021 [P] Implement `authGuard` in `src/app/core/auth/auth.guard.ts` (redirect to `/auth/login` if not authenticated)
- [X] T022 [P] Create `PLAN_LIMITS` constants in `src/app/core/plan/plan-limits.ts` (4 tiers: digital, essential, elite, guardian — pets, photosPerPet, healthRecordsMonthly, scanHistoryDays, hasTag, hasReward, hasMultiTutor, hasRealtime)
- [X] T023 [P] Implement `PlanService` in `src/app/core/plan/plan.service.ts` (canAddPet(), getPhotoLimit(), hasTagAccess(), hasRealtimeAccess(), hasRewardAccess(), hasMultiTutorAccess(); signal `currentPlan` from profile)
- [X] T024 [P] Implement `CurrencyBrlPipe` in `src/app/shared/pipes/currency-brl.pipe.ts` (transforms cents integer to "R$ X,XX" format)
- [X] T025 [P] Create shared IP geolocation types in `src/app/shared/utils/ip-geolocation.ts` (IpGeoResult interface: city, region, country, lat, lon; location_type: 'precise' | 'approximate' | 'none')

**Checkpoint:** `supabase start` cria todas as tabelas, índices e policies; SupabaseClientService e AuthService injetáveis; PlanService com signals funcionando; CurrencyBrlPipe formata centavos corretamente

---

## Phase 3: US-011 — Landing Page Pública (P1) 🎯 MVP

**Goal:** Visitante entende o Pet Volta, vê planos com identidade Green-Organic, e se cadastra — página estática SSR prerender

**Independent Test:** Acessar `/` renderiza SSR; LCP < 1.5s; scroll suave nos links do header; FAQ accordion expande/colapsa; botões de plano redirecionam para `/auth/register`; hamburger menu funcional em mobile; responsivo em mobile/tablet/desktop

- [X] T026 [US11] Create landing page route in `src/app/features/landing/landing.routes.ts` and register in `src/app/app.routes.ts` and `src/app/app.routes.server.ts` with static prerender config
- [X] T027 [US11] Implement `LandingPageComponent` (shell/orchestrator) in `src/app/features/landing/landing-page.component.ts` with OpenGraph + Twitter Card meta tags via Angular Meta/Title services
- [X] T028 [P] [US11] Implement `HeaderComponent` in `src/app/features/landing/header/header.component.ts` (sticky, blur backdrop `bg-white/80 backdrop-blur-md` on scroll, logo SVG placeholder, nav with smooth scroll to section anchors, "Entrar" outline + "Criar Conta" `rounded-full bg-[#2D6A4F]` buttons, hamburger mobile below `lg:`)
- [X] T029 [P] [US11] Implement `HeroComponent` in `src/app/features/landing/hero/hero.component.ts` (gradient `#2D6A4F`→`#8FBC8F`, blob shapes as inline SVGs at 10–20% opacity, headline + subtitle, "Começar Grátis" and "Conhecer Planos" CTAs `rounded-full`, `public/hero.png` mockup as WebP)
- [X] T030 [P] [US11] Implement `HowItWorksComponent` in `src/app/features/landing/how-it-works/how-it-works.component.ts` (3 steps with icons, cards `rounded-[32px]` `shadow-green-900/5`, row desktop / column mobile)
- [X] T031 [P] [US11] Implement `PricingSectionComponent` in `src/app/features/landing/pricing-section/pricing-section.component.ts` (4 plan cards `rounded-[32px]`, Elite card gradient `#2D6A4F`→`#1B4332` + badge secondary `#FFB01F` "Mais Popular", features list ✅/❌, all buttons `rounded-full` redirect to `/auth/register`)
- [X] T032 [P] [US11] Implement `TestimonialsComponent` in `src/app/features/landing/testimonials/testimonials.component.ts` (3 fictitious cards with avatar initials, name, city, pet emoji, carousel mobile, 3 cols desktop)
- [X] T033 [P] [US11] Implement `FaqComponent` in `src/app/features/landing/faq/faq.component.ts` (8 questions in accordion: como funciona a tag, segurança dos dados, cancelamento, modo perdido, recompensa, limite de pets, tag à prova d'água, internet necessária)
- [X] T034 [P] [US11] Implement `CtaBannerComponent` in `src/app/features/landing/cta-banner/cta-banner.component.ts` (green gradient bar, "Criar Conta Grátis" `rounded-full`)
- [X] T035 [P] [US11] Implement `FooterComponent` in `src/app/features/landing/footer/footer.component.ts` (logo, 3 columns: Produto / Suporte / Legal, copyright, Termos/Privacidade/LGPD placeholder links)

**Checkpoint:** Landing page completa (header + Hero + Como Funciona + Planos + Depoimentos + FAQ + CTA + Footer); paleta Green-Organic aplicada; LCP < 1.5s; blob shapes SVG inline não bloqueiam rendering; FAQ accordion funcional; responsivo; deploy automático no Vercel

---

## Phase 4: US-001 — Cadastro e Autenticação (P1) 🎯 MVP

**Goal:** Tutor cria conta, faz login (email ou Google), recupera senha e acessa o dashboard protegido

**Independent Test:** Fluxo completo Registro → Confirmação email → Login → Dashboard (vazio) → Logout; Google OAuth funcional; recuperação de senha envia email; rota `/dashboard` redireciona para login sem sessão

- [X] T036 [US1] Implement `LoginPageComponent` in `src/app/features/auth/login.page.ts` (email + senha inputs `rounded-full`, Google OAuth button, link "Criar conta", erros em português, redirect pós-login → `/dashboard`)
- [X] T037 [P] [US1] Implement `RegisterPageComponent` in `src/app/features/auth/register.page.ts` (nome, email, senha, confirmar senha, redirect pós-registro → `/dashboard`)
- [X] T038 [P] [US1] Implement `ResetPasswordPageComponent` in `src/app/features/auth/reset-password.page.ts` (forgot password form + confirm new password form via Supabase magic link)
- [X] T039 [US1] Register auth routes in `src/app/app.routes.ts` (`/auth/login`, `/auth/register`, `/auth/reset-password`) with SSR prerender config in `src/app/app.routes.server.ts`
- [X] T040 [US1] Implement `DashboardPageComponent` shell in `src/app/features/dashboard/dashboard.page.ts` (empty state with surface `#FDFCF0`, authGuard protected, CSR route)

**Checkpoint:** Registro → Login → Dashboard → Logout funcionam; Google OAuth funcional; reset password envia email; `/dashboard` protegido pelo authGuard; novo usuário recebe `plan_tier = 'digital'` via trigger

---

## Phase 5: US-003 — Cadastro e Gestão de Pets (P2)

**Goal:** Tutor cadastra, edita e visualiza seus pets com fotos comprimidas, com limites de plano aplicados em tempo real via Signals

**Independent Test:** Criar pet com foto (comprimida < 500KB); listar pets; editar campos; plano Digital bloqueia 2º pet com CTA upgrade; public_slug gerado automaticamente; foto upada no bucket pet-photos

- [X] T041 [US3] Create `Pet` and `PetPhoto` models in `src/app/models/pet.model.ts` (all fields from data-model.md)
- [X] T042 [US3] Implement `StorageService` in `src/app/core/storage/storage.service.ts` (upload to Supabase Storage, client-side WebP compression via canvas API max 500KB, file type validation jpg/png/webp)
- [X] T043 [US3] Implement `PetService` in `src/app/core/pets/pet.service.ts` (CRUD via Supabase SDK with seletive `.select()`, generate unique `public_slug` on create, signals: pets, loading, error; integrates with StorageService for photo upload)
- [X] T044 [US3] Implement `PetListPageComponent` in `src/app/features/pets/pet-list/pet-list.page.ts` (grid of cards `rounded-[32px]` `shadow-green-900/5`, safe/lost status badges, empty state illustration, loading skeleton, CTA upgrade when plan limit reached)
- [X] T045 [US3] Implement `PetFormPageComponent` in `src/app/features/pets/pet-form/pet-form.page.ts` (create/edit form, photo upload with compression preview, plan limit enforcement via PlanService, all inputs `rounded-full`, errors in pt-BR)
- [X] T046 [P] [US3] Implement `PetDetailPageComponent` with tabs in `src/app/features/pets/pet-detail/pet-detail.page.ts` (Overview, Saúde, Histórico de Scans tabs; Zard UI Tabs component)
- [X] T047 [US3] Register pet routes in `src/app/app.routes.ts` as CSR routes (`/dashboard/pets`, `/dashboard/pets/new`, `/dashboard/pets/:id`, `/dashboard/pets/:id/edit`) protected by authGuard

**Checkpoint:** CRUD pet funcional com fotos comprimidas client-side; limites de plano aplicados via computed() Signals; public_slug único gerado; CTA upgrade em empty state; tabs de detalhe navegáveis

---

## Phase 6: US-004 — Ativação de Tag QR Code (P3)

**Goal:** Tutor com plano pago (Essential+) vincula tag órfã ao seu pet com 1 clique

**Independent Test:** Tutor Essential acessa `/t/{tagCode}` com tag órfã logado → tela de vinculação → seleciona pet → tag ativa (status = 'active'); Tutor Digital vê CTA de upgrade; tag já vinculada ao mesmo tutor oferece troca; tag de outro tutor mostra mensagem de suporte

- [X] T048 [US4] Create `Tag` model in `src/app/models/tag.model.ts` (tag_code, pet_id, status, activated_by, activated_at)
- [X] T049 [US4] Implement `TagService` in `src/app/core/tags/tag.service.ts` (fetchTagByCode, activateTag via edge function, deactivateTag, signals: currentTag, loading)
- [X] T050 [US4] Deploy Edge Function `activate-tag` in `supabase/functions/activate-tag/index.ts` (verifies Essential+ plan via profile.plan_tier, checks tag status = 'orphan', checks ownership/conflict, updates tag status and pet_id)
- [X] T051 [US4] Implement `TagActivationPageComponent` in `src/app/features/tags/tag-activation/tag-activation.page.ts` (Digital plan → upgrade CTA card `rounded-[32px]`; paid plan → pet selection list + confirm button `rounded-full`; tag already linked → info message with support link)

**Checkpoint:** Tag órfã ativada com sucesso por Essential+; Digital bloqueado com CTA; tag já vinculada mostra estado correto; `/t/{tagCode}` redireciona para ativação quando tutor logado e tag orphan

---

## Phase 7: US-005 — Página Pública do Pet SSR (P1) 🎯 MVP

**Goal:** Qualquer pessoa que escaneia a tag vê o perfil do pet em modo safe (acolhimento) ou lost (urgência com geoloc + reward)

**Independent Test:** `/t/{tagCode}` renderiza SSR sem JS; pet safe mostra perfil sem solicitar geoloc; pet lost mostra banner danger `#BC4749` + request de geoloc; geoloc negada usa IP fallback (cidade via ip-api.com); reward badge secondary `#FFB01F` aparece só quando lost + reward_amount_cents > 0; LCP < 1.5s

- [X] T052 [US5] Deploy shared Edge Function module `supabase/functions/_shared/ip-geolocation.ts` (fetch `http://ip-api.com/json/{ip}?fields=status,city,regionName,country,lat,lon` with 3s AbortController timeout, returns IpGeoResult or null on error)
- [X] T053 [US5] Implement `PublicPetService` in `src/app/core/pets/public-pet.service.ts` (fetchPetByTagCode, fetchPetBySlug — selective `.select()` with only public fields, no auth required)
- [X] T054 [US5] Implement `PublicPetPageComponent` in `src/app/features/public-pet/public-pet.page.ts` (SSR, handles both `/t/:tagCode` and `/p/:publicSlug`, loads pet data, orchestrates safe/lost UI, meta tags via Angular Meta)
- [X] T055 [P] [US5] Implement `PetSafeModeComponent` in `src/app/features/public-pet/pet-safe-mode/pet-safe-mode.component.ts` (surface `#FDFCF0`, pet name/photo/species/breed/age computed from birth_date, tutor city/state, "Entrar em Contato" WhatsApp/phone button `rounded-full`, cards `rounded-[32px]`)
- [X] T056 [P] [US5] Implement `PetLostModeComponent` in `src/app/features/public-pet/pet-lost-mode/pet-lost-mode.component.ts` (banner danger `#BC4749` with "perdido desde" date, urgency animation subtle, geoloc request prompt, message textarea, "Enviar e Notificar Tutor" CTA `rounded-full`, lost_description display)
- [X] T057 [P] [US5] Implement `RewardBadgeComponent` in `src/app/features/public-pet/reward-badge/reward-badge.component.ts` (card secondary `#FFB01F` `rounded-[32px]`, uses CurrencyBrlPipe, disclaimer "A recompensa é oferecida diretamente pelo tutor. Pet Volta não intermedia pagamentos.", shown only when pet.status = 'lost' AND reward_amount_cents > 0)
- [X] T058 [P] [US5] Implement `LocationRequestComponent` in `src/app/features/public-pet/location-request/location-request.component.ts` (requests browser geoloc with clear LGPD explanation, on success sends precise coords, on denied/error signals IP fallback to scan edge function)
- [X] T059 [US5] Register public SSR routes in `src/app/app.routes.ts` and `src/app/app.routes.server.ts` (`/t/:tagCode` SSR ISR 60s, `/p/:publicSlug` SSR ISR 60s)

**Checkpoint:** `/t/{tagCode}` e `/p/{publicSlug}` renderizam SSR sem JS necessário para conteúdo básico; modo lost com banner danger + reward badge; geoloc request com mensagem LGPD; LCP < 1.5s; tag orphan mostra tela genérica "Tag Pet Volta" com CTA cadastro

---

## Phase 8: US-006 — Notificação de Scan ao Tutor (P2)

**Goal:** Cada scan notifica o tutor via email (< 30s) com localização precisa ou aproximada; Realtime toast se online no dashboard; histórico visível

**Independent Test:** Scan de tag ativa → email recebido em < 30s com template correto (precise/approximate/none); debounce 5min impede spam de mesmo IP; tutor no dashboard recebe toast `📍`/`📌`/`📎`; histórico de scans visível na aba Histórico do pet

- [X] T060 [US6] Deploy Edge Function `scan` in `supabase/functions/scan/index.ts` (public endpoint, rate limit 60 req/min per IP via X-Forwarded-For hash, debounce 5min per tag+ip_hash, receives tagCode + optional lat/lng + optional message, calls ip-geolocation.ts if no lat/lng, INSERT scan_events with location_type, triggers send-notification)
- [X] T061 [US6] Deploy Edge Function `send-notification` in `supabase/functions/send-notification/index.ts` (Resend API, 3 email templates in pt-BR: 📍 precise location with coords, 📌 approximate "cidade, estado" from IP with disclaimer, 🔔 no location with message; includes reward value if applicable)
- [X] T062 [US6] Implement `ScanService` in `src/app/core/pets/scan.service.ts` (fetchScanHistory with pagination 20/page, plan-gated history window via PlanService, signals: scans, loading)
- [X] T063 [US6] Implement scan history tab in `PetDetailPageComponent` in `src/app/features/pets/pet-detail/pet-detail.page.ts` (timeline with scanned_at, location_type indicator 📍/📌/📎, message if present, plan-limited window notice for Digital)
- [X] T064 [US6] Implement Realtime scan notifications in `src/app/features/dashboard/dashboard.page.ts` (subscribe to scan_events channel via Supabase Realtime, toast via Zard UI with location emoji and pet name, Essential+ plan gate only)
- [X] T065 [P] [US6] Implement `NotificationPrefsService` in `src/app/core/supabase/notification-prefs.service.ts` (toggleEmailEnabled, setSnoozeUntil with 1h/8h/24h options, signals: prefs, loading)

**Checkpoint:** Scan → email em < 30s (preciso ou aproximado via IP); debounce funcional por tag+IP; Realtime toast no dashboard para Essential+; histórico com indicadores de precisão; tutor pode silenciar notificações

---

## Phase 9: US-007 — Modo Alerta + Recompensa (P2)

**Goal:** Tutor ativa "modo perdido" com recompensa e descrição; cache SSR invalidado imediatamente; página pública muda em < 2s

**Independent Test:** Toggle lost → cache Vercel invalidado → `/t/{tagCode}` carrega com banner danger e reward badge; tutor altera valor da recompensa enquanto pet lost; desativar retorna modo safe; Digital não pode definir recompensa

- [X] T066 [US7] Deploy Edge Function `toggle-lost` in `supabase/functions/toggle-lost/index.ts` (authenticated, UPDATE pets SET status, lost_since, reward_amount_cents, lost_description; calls Vercel Revalidation API for `/t/{tagCode}` and `/p/{publicSlug}` via VERCEL_TOKEN secret)
- [X] T067 [US7] Implement lost mode toggle UI in `PetDetailPageComponent` in `src/app/features/pets/pet-detail/pet-detail.page.ts` (Zard UI Dialog confirmation with clear text, toggle shows danger `#BC4749` when lost / primary `#2D6A4F` when safe, "perdido desde" timestamp display)
- [X] T068 [P] [US7] Implement `RewardFormComponent` in `src/app/features/pets/pet-detail/reward-form/reward-form.component.ts` (BRL currency mask input `rounded-full`, value stored in cents via transform, Essential+ plan gate with upgrade CTA if Digital, only visible when pet is lost)
- [X] T069 [P] [US7] Implement `LostDescriptionComponent` in `src/app/features/pets/pet-detail/lost-description/lost-description.component.ts` (textarea max 500 chars with live counter, shown only when pet is lost, saves on blur)

**Checkpoint:** Toggle lost com confirmation dialog; cache SSR invalidado e página pública muda de modo em < 2s; reward badge editável durante modo lost; plano Digital bloqueado de definir recompensa com CTA upgrade; desativar preserva reward/description mas não exibe

---

## Phase 10: US-002 — Perfil do Tutor (P2)

**Goal:** Tutor mantém informações de contato atualizadas para exibição pública no perfil do pet

**Independent Test:** Editar nome, telefones, cidade/estado e salvar; upload de avatar (< 2MB comprimido); toggle show_phone funcional; telefone com máscara BR; dados de contato aparecem na página pública do pet após salvar; conta pode ser excluída via LGPD

- [X] T070 [US2] Create `Profile` model in `src/app/models/profile.model.ts` (all fields from data-model.md profiles table)
- [X] T071 [US2] Implement `ProfileService` in `src/app/core/supabase/profile.service.ts` (fetchProfile, updateProfile with selective .select(), uploadAvatar with 2MB size check via StorageService, signals: profile, loading)
- [X] T072 [US2] Implement `SettingsProfilePageComponent` in `src/app/features/settings/profile/settings-profile.page.ts` (form: nome, telefone primary/emergency with BR format mask, cidade, estado, avatar upload with preview, show_phone toggle, all inputs `rounded-full`, errors in pt-BR)
- [X] T073 [P] [US2] Implement `SettingsNotificationsPageComponent` in `src/app/features/settings/notifications/settings-notifications.page.ts` (email toggle, snooze 1h/8h/24h options via NotificationPrefsService)
- [X] T074 [P] [US2] Implement `SettingsAccountPageComponent` in `src/app/features/settings/account/settings-account.page.ts` (LGPD: delete account button with Zard UI Dialog confirmation, calls Supabase `auth.admin.deleteUser`)
- [X] T075 [US2] Register settings routes in `src/app/app.routes.ts` as CSR routes protected by authGuard (`/dashboard/settings/profile`, `/dashboard/settings/notifications`, `/dashboard/settings/account`)

**Checkpoint:** Perfil editável e salvo; avatar upado no bucket avatars; telefone validado (BR format); show_phone toggle refletido na página pública; conta excluída via LGPD com confirmação

---

## Phase 11: US-010 — Dashboard do Tutor (P2)

**Goal:** Tutor vê resumo completo de pets, atividade, plano e alertas em Bento Grid com surface `#FDFCF0`

**Independent Test:** Dashboard carrega com skeleton por card; pets lost destacados com `#BC4749`; reward badge `#FFB01F` em alertas; card de plano mostra X/Y pets correto via computed(); banner Digital upgrade persistente; co-tutor acessível para Elite+

- [X] T076 [US10] Implement dashboard shell layout in `src/app/features/dashboard/dashboard.layout.ts` (sidebar desktop with nav links, topbar mobile with hamburger, surface `#FDFCF0` background)
- [X] T077 [US10] Implement `DashboardHomeComponent` full Bento Grid in `src/app/features/dashboard/dashboard.page.ts` (cards `rounded-[32px]` `shadow-green-900/5`, surface `#FDFCF0`, Realtime subscription, quick actions: "+ Novo Pet", "Ativar Tag", "Upgrade de Plano")
- [X] T078 [P] [US10] Implement "Meus Pets" widget in `src/app/features/dashboard/widgets/pets-widget.component.ts` (pet grid with photo, name, status badge safe/lost, último scan, reward active indicator in secondary `#FFB01F`, skeleton loading)
- [X] T079 [P] [US10] Implement "Atividade Recente" widget in `src/app/features/dashboard/widgets/activity-widget.component.ts` (last 10 events timeline: scan 📍/📌/📎 + status changes, skeleton loading)
- [X] T080 [P] [US10] Implement "Plano Atual" widget in `src/app/features/dashboard/widgets/plan-widget.component.ts` (plan name, renewal date, usage X/Y pets and monthly records via computed() from PlanService, upgrade CTA if Digital)
- [X] T081 [P] [US10] Implement "Alertas" widget in `src/app/features/dashboard/widgets/alerts-widget.component.ts` (pets in lost mode with danger `#BC4749` highlight + reward amount in secondary `#FFB01F` via CurrencyBrlPipe, skeleton loading)
- [X] T082 [P] [US10] Implement Digital plan upgrade banner in `DashboardHomeComponent` (persistent card showing tag benefits + "Assinar Plano Essential" CTA `rounded-full`, hidden for paid plans)
- [X] T083 [P] [US10] Implement co-tutor management in `src/app/features/pets/pet-detail/co-tutors/co-tutor-management.component.ts` (Elite+ only: invite by email form, pending/accepted/rejected list, revoke button with confirmation, read-only access note)

**Checkpoint:** Dashboard Bento Grid completo; skeleton loading por widget individual; pets lost destacados; plano Digital com banner upgrade persistente; co-tutor disponível para Elite+; pull-to-refresh funcional em mobile

---

## Phase 12: US-008 — Registros de Saúde (P3)

**Goal:** Tutor registra vacinas, consultas, medicações e exames com limites mensais para plano Digital

**Independent Test:** Criar registro de vacinação; plano Digital bloqueia 3º registro do mês com CTA upgrade; anexo PDF (max 5MB) upado no bucket health-attachments; registros ordenados por data desc; todos os 4 tipos de registro funcionam com campos dinâmicos

- [X] T084 [US8] Create `HealthRecord` model in `src/app/models/health-record.model.ts` (4 types: vaccination with vaccine name/next_date, consultation with diagnosis, medication with dosage/frequency/dates, exam with attachment_url)
- [X] T085 [US8] Implement `HealthRecordService` in `src/app/core/pets/health-record.service.ts` (CRUD via Supabase SDK, monthly count check for Digital plan via RLS, PDF attachment upload via StorageService max 5MB, signals: records, loading, monthlyCount)
- [X] T086 [US8] Implement `HealthListComponent` in `src/app/features/pets/pet-detail/health/health-list.component.ts` (records sorted by date DESC, type filter tabs, empty state per type, monthly usage indicator for Digital "2/2 registros este mês", skeleton loading)
- [X] T087 [US8] Implement `HealthFormComponent` in `src/app/features/pets/pet-detail/health/health-form.component.ts` (dynamic form per type with @switch control flow, date picker, PDF upload for exam type with 5MB check, all inputs `rounded-full`)
- [X] T088 [US8] Integrate health components into health tab in `src/app/features/pets/pet-detail/pet-detail.page.ts`

**Checkpoint:** CRUD registros de saúde funcional; limite mensal Digital aplicado via RLS + UI; PDF upado no bucket health-attachments; registros por data desc; todos os 4 tipos com campos dinâmicos corretos

---

## Phase 13: US-009 — Planos e Stripe Integration (P4) — ⚠️ ÚLTIMA FASE

**Goal:** Tutor pode assinar, fazer upgrade/downgrade e gerenciar assinatura via Stripe Checkout + Customer Portal

**⚠️ EXECUTE APENAS quando Fases 1–12 estiverem validadas em produção. Até lá, alterar `plan_tier` via SQL Editor:**
```sql
UPDATE profiles SET plan_tier = 'essential' WHERE id = 'uuid-do-usuario';
```

**Independent Test:** Checkout com cartão `4242 4242 4242 4242`; webhook atualiza `plan_tier` e `subscription_status`; Customer Portal permite cancelar; downgrade mantém dados em modo somente leitura

- [ ] T089 [US9] Configure Stripe products, prices (4 plans: Digital free, Essential, Elite, Guardian), Customer Portal, and store secrets in Supabase Vault
- [X] T090 [US9] Deploy Edge Function `create-checkout` in `supabase/functions/create-checkout/index.ts` (authenticated, creates Stripe Checkout Session with plan param, creates/retrieves stripe_customer_id in profiles)
- [X] T091 [US9] Deploy Edge Function `create-portal` in `supabase/functions/create-portal/index.ts` (authenticated, creates Stripe Customer Portal session for subscription management)
- [X] T092 [US9] Deploy Edge Function `stripe-webhook` in `supabase/functions/stripe-webhook/index.ts` (Stripe signature verification, handles checkout.session.completed + subscription events, updates `plan_tier` and `subscription_status` in profiles, uses `stripe_events` for idempotency)
- [X] T093 [US9] Implement pricing page in `src/app/features/dashboard/pricing/pricing.page.ts` (4 plan cards `rounded-[32px]`, current plan highlighted in primary, upgrade/downgrade buttons `rounded-full` → create-checkout, "Gerenciar Assinatura" → create-portal, toast "em breve" for Digital while Stripe not live)
- [ ] T094 [US9] Configure Stripe Webhook URL in Stripe Dashboard pointing to `supabase/functions/stripe-webhook`
- [ ] T095 [US9] Test complete Stripe flow: card `4242 4242 4242 4242` → checkout → webhook → plan_tier updated in Supabase → UI reflects new plan; verify downgrade keeps data read-only

**Checkpoint:** Checkout funcional; webhook processando e atualizando plano; upgrade/downgrade refletido em tempo real; Customer Portal acessível; downgrade mantém dados sem deletar

---

## Phase N: Polish e Cross-Cutting Concerns

**Purpose:** Melhorias que afetam múltiplas user stories e preparação final para produção

- [X] T096 [P] Implement Vercel Cron anti-pause API route in `api/keepalive.ts` (SELECT id FROM tags LIMIT 1 via Supabase, configured in `vercel.json` cron `"0 8 */5 * *"`)
- [X] T097 [P] Implement scan event cleanup: Edge Function `cleanup-scan-events` in `supabase/functions/cleanup-scan-events/index.ts` to anonymize `scan_events.ip_hash` and `ip_*` fields older than 90 days (LGPD compliance)
- [ ] T098 [P] Performance audit: run Lighthouse on `/` and `/t/{tagCode}` — target LCP < 1.5s, Lighthouse ≥ 90; verify blob SVGs inline, WebP images, lazy-load below-fold sections, `font-display: swap`
- [ ] T099 [P] Bundle size audit: verify initial load < 150KB gzipped; lazy-load dashboard routes; split landing page sections if needed
- [X] T100 [P] Configure GitHub Actions CI/CD in `.github/workflows/ci.yml` (ng build, ng test, supabase db lint on PR)
- [ ] T101 [P] Configure production settings: Supabase Auth confirm email template in pt-BR, Google OAuth app published (not in test mode), Sentry DSN set in Vercel environment variables
- [X] T102 Implement E2E test flows with Playwright in `e2e/` (scaffold + smoke flows; requer instalar `@playwright/test` para executar)

**Checkpoint Final:** Todos os fluxos end-to-end funcionando; Landing LCP < 1.5s; Lighthouse ≥ 90; bundle < 150KB gzipped; Sentry ativo; Cron anti-pausa ativo; CI/CD passing em PRs

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depende de | Bloqueia |
|---|---|---|
| Setup (Phase 1) | Nada | Tudo |
| Foundational (Phase 2) | Phase 1 | Todas as user stories |
| US-011 Landing (Phase 3) | Phase 2 | — |
| US-001 Auth (Phase 4) | Phase 2 | Phases 5, 10 |
| US-003 Pets (Phase 5) | Phase 4 | Phases 6, 12 |
| US-004 Tags (Phase 6) | Phase 5 | — |
| US-005 Página Pública (Phase 7) | Phase 2 | Phases 8, 9 |
| US-006 Notificação (Phase 8) | Phase 7 | Phase 9 |
| US-007 Modo Alerta (Phase 9) | Phases 7, 8 | — |
| US-002 Perfil (Phase 10) | Phase 4 | — |
| US-010 Dashboard (Phase 11) | Phases 4, 5, 9 | — |
| US-008 Health (Phase 12) | Phase 5 | — |
| US-009 Stripe (Phase 13) | Phases 1–12 validadas em produção | — |
| Polish (Phase N) | Todas as user stories | — |

### Oportunidades de Paralelismo

- **Phases 3 + 4** podem rodar em paralelo após Phase 2
- **Phases 5 + 7** podem rodar em paralelo após Phase 4
- **US-002 (Perfil)** pode rodar em paralelo com **US-003 (Pets)** após Phase 4
- **US-008 (Health)** pode rodar em paralelo com **US-010 (Dashboard)** após Phase 5
- Dentro de cada fase, tasks marcadas **[P]** podem rodar em paralelo

---

## Parallel Example: Phase 3 (Landing Page)

```bash
# Após T027 (LandingPageComponent shell), rodar em paralelo:
T028: HeaderComponent — src/app/features/landing/header/header.component.ts
T029: HeroComponent — src/app/features/landing/hero/hero.component.ts
T030: HowItWorksComponent — src/app/features/landing/how-it-works/how-it-works.component.ts
T031: PricingSectionComponent — src/app/features/landing/pricing-section/pricing-section.component.ts
T032: TestimonialsComponent — src/app/features/landing/testimonials/testimonials.component.ts
T033: FaqComponent — src/app/features/landing/faq/faq.component.ts
T034: CtaBannerComponent — src/app/features/landing/cta-banner/cta-banner.component.ts
T035: FooterComponent — src/app/features/landing/footer/footer.component.ts
```

---

## Implementation Strategy

### MVP First (US-011 + US-001 only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational — CRÍTICO)
3. Complete Phase 3 (US-011 Landing Page)
4. Complete Phase 4 (US-001 Auth)
5. **STOP e VALIDE:** landing page + auth flow deployados no Vercel, LCP < 1.5s
6. Compartilhe para feedback inicial antes de continuar

### Incremental Delivery (Ordem sugerida)

1. Setup + Foundational → Base pronta
2. + US-011 Landing + US-001 Auth → MVP público (landing + cadastro)
3. + US-003 Pets → Gestão de pets com fotos
4. + US-005 Página Pública → Coração do produto (scan → página do pet)
5. + US-006 Notificação → Produto completo básico (scan → email em < 30s)
6. + US-007 Alerta + Recompensa → Feature diferencial (modo perdido)
7. + US-002 Perfil + US-010 Dashboard → UX completa do tutor
8. + US-004 Tags + US-008 Health → Features premium completas
9. + US-009 Stripe → Monetização (**ÚLTIMA — só após validação em prod**)

---

## Notes

- **[P]** = arquivos diferentes, sem dependências, pode rodar em paralelo
- **[USN]** label mapeia a task para a user story (rastreabilidade spec.md ↔ tasks.md)
- **Convenções obrigatórias (CLAUDE.md):** Signals (`signal()`, `computed()`, `effect()`), `@if`/`@for`/`@switch`, `input()`/`output()`, Tailwind tokens apenas (sem valores arbitrários `text-[#hex]`), Standalone components, comentários em pt-BR, UI text em pt-BR
- **Supabase Free tier:** `.select()` seletivo sempre, paginação 20 items/page, imagens comprimidas client-side (max 500KB WebP), nunca `select('*')` em produção
- **Stripe é ÚLTIMA FASE** — não implementar até todas as fases anteriores validadas em produção com `plan_tier` mockado via SQL Editor
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) após cada task ou grupo lógico
- **Mock de plano:** `UPDATE profiles SET plan_tier = 'essential' WHERE id = 'uuid';` no Supabase Studio
