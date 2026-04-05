# 🐾 Pet Volta MVP — Task Breakdown (v3)

> **Spec:** [spec.md](./spec.md) (v2) | **Plan:** [plan.md](./plan.md) (v2)  
> **Changelog v3:** Landing page na Fase 1, Stripe movido para Fase 5 (última), fases reorganizadas

## Legenda
- `[P]` Paralela | `[B]` Bloqueante | `[T]` Testes obrigatórios | `→` Checkpoint

---

## Fase 0 — Scaffold e Infraestrutura Base

### T001 [B] — Scaffold Angular 21 + Zoneless
- `ng new pet-volta --directory=. --style=css --ssr --routing --skip-git`
- `provideZonelessChangeDetection()` em `app.config.ts`
- Remover `zone.js` dos polyfills
- Path aliases em `tsconfig.json`: `@core/*`, `@shared/*`, `@features/*`, `@ui/*`, `@models/*`, `@env/*`
- Configurar `app.routes.server.ts` com render modes SSR/CSR por rota

### T002 [B] — Criar CLAUDE.md + .gitignore + vercel.json
- `CLAUDE.md` na raiz (stack, convenções, constraints, paths, comandos)
- `.gitignore`: node_modules, .env.local, dist/, .supabase/
- `vercel.json`: `{ "framework": "angular", "crons": [{ "path": "/api/keepalive", "schedule": "0 8 */5 * *" }] }`

### T003 [B] — Tailwind CSS v4 + Design Tokens TypeUI Colorful
- Tokens: primary `#3B82F6`, secondary `#8B5CF6`, success `#16A34A`, warning `#D97706`, danger `#DC2626`
- Fontes: Outfit (display/700), Inter (body/400), JetBrains Mono (code/400)
- Border radius: `rounded-pet: 24px`, `rounded-pet-sm: 16px`
- Grid 8px. Gradientes CSS: blue→violet, red→orange
- Preload de fontes no `index.html`

### T004 [P] — Instalar e Configurar Zard UI
- `npx zard-cli init` + componentes base (button, input, card, badge, dialog, toast, skeleton, avatar, dropdown, tabs, select, switch, separator, label)
- Customizar paleta e border-radius

### T005 [P] — Configurar Supabase Local + Migrations
- `supabase init` + `supabase link`
- Migrations: enums → tabelas (profiles, pets, tags, health_records, scan_events, notification_prefs, pet_co_tutors, stripe_events) → triggers → RLS policies → storage buckets
- Seed: 20 tags orphan

### T006 [P] — Environments + Sentry
- `environment.ts` (local) e `environment.prod.ts` (prod)
- `@sentry/angular` configurado

### → Checkpoint Fase 0
- [ ] `ng serve` funciona sem Zone.js
- [ ] Tailwind com gradientes blue→violet renderiza
- [ ] Zard UI componentes com paleta customizada
- [ ] `supabase start` cria todas as tabelas
- [ ] Push → Vercel deploya automaticamente

---

## Fase 1 — Landing Page + Auth

### T007 [B][T] — Supabase Client Service
- Singleton SSR-aware (createServerClient / createBrowserClient)
- Signal `currentUser`

### T008 [B][T] — Auth Service + Guard
- signUp, signIn, signInWithGoogle, signOut, resetPassword
- Signals: `currentSession`, `isAuthenticated`
- `authGuard`: redirect `/auth/login`

### T009 [B][T] — Landing Page (SSR Prerender)
**Rota:** `/` | **Arquivo:** `src/app/features/landing/landing.component.ts`

**5 seções obrigatórias:**

**HEADER (sticky, blur backdrop):**
- Esquerda: espaço para logo (SVG placeholder `🐾 Pet Volta`)
- Centro: menus (Início, Planos, FAQ) com scroll suave para âncoras
- Direita: botões `[Login]` e `[Criar Conta]` → `/auth/login` e `/auth/register`
- Mobile: hamburger menu

**HERO:**
- Título: headline apelativo sobre segurança pet
- Subtítulo: proposta de valor em 1 linha
- CTAs: `[Começar Grátis]` e `[Conhecer Planos]`
- Visual: ilustração/mockup ou ícone grande de QR + pet
- Background: gradiente blue→violet (eixo TypeUI Colorful)
- Seção "Como Funciona" com 3 passos visuais (ícones + texto curto)

**PLANOS:**
- 4 cards lado a lado (1 col mobile, 2 tab, 4 desktop)
- Digital (Free) / Essential / Elite (destaque "Mais popular") / Guardian
- Features em lista com ✅/❌
- Gradiente sutil no card Elite
- Botões: "Começar Grátis" (digital) e "Assinar" (pagos — por ora, redirect para registro)

**DEPOIMENTOS:**
- 3 cards com citação, nome, cidade, emoji do pet
- Dados fictícios (marcar internamente como placeholder)
- Layout: carousel no mobile, 3 colunas no desktop

**FAQ:**
- 8 perguntas em accordion (Zard UI ou customizado)
- Perguntas: como funciona a tag, segurança dos dados, cancelamento, modo perdido, recompensa, limite de pets, tag à prova d'água, internet necessária

**FOOTER:**
- Logo + 3 colunas (Produto, Suporte, Legal)
- Copyright + frase emocional
- Links para Termos, Privacidade, LGPD (páginas placeholder)

**Requisitos técnicos:**
- Prerender estático (ISR não necessário — conteúdo estático)
- LCP < 1.5s
- Meta tags OpenGraph (título, descrição, imagem placeholder)
- Responsivo mobile-first
- Acessível (headings semânticos, contraste WCAG AA, teclado navegável)

### T010 [T] — Telas de Auth
- Login: email + senha, Google OAuth, link "Criar conta"
- Registro: nome, email, senha, confirmar senha
- Forgot Password
- Erros em português. Redirect pós-login → `/dashboard`

### T011 [B][T] — Plan Limits Service
- Constantes `PLAN_LIMITS` com 4 tiers
- `PlanService` com checks: canAddPet(), getPhotoLimit(), hasTagAccess(), etc.
- Signal `currentPlan`
- **Para testes sem Stripe:** alterar `plan_tier` direto no SQL Editor do Supabase

### → Checkpoint Fase 1
- [ ] Landing page completa com 5 seções + header + footer
- [ ] Gradientes TypeUI Colorful aplicados no hero e cards de plano
- [ ] Header com logo placeholder, menus centralizados, botões login/registro à direita
- [ ] FAQ accordion funcional
- [ ] Responsivo em mobile, tablet e desktop
- [ ] Registro → Login → Dashboard (vazio) → Logout
- [ ] Google OAuth funcional
- [ ] LCP < 1.5s na landing
- [ ] Deploy automático no Vercel

---

## Fase 2 — Pet Management + Tag + Slug Público

### T012 [B][T] — Pet Service (CRUD + Slug + Photos)
- CRUD via Supabase SDK, geração de `public_slug`, upload com compressão client-side

### T013 [T] — Telas de Pet Management
- Pet List, Pet Form, Pet Detail (tabs), empty states, CTA upgrade

### T014 [B][T] — Edge Function: Activate Tag
- Verifica plano essential+, tag orphan, ownership. Deploy via dashboard Supabase.

### T015 [T] — Tela de Ativação de Tag
- Plano digital → página upgrade. Plano pago → seleção pet + 1 clique.

### → Checkpoint Fase 2
- [ ] CRUD pet funcional com fotos e slug público
- [ ] Tag ativada, `/p/{slug}` mostra dados básicos
- [ ] Plano digital bloqueado de ativar tag

---

## Fase 3 — Scan, Notificação, IP Geoloc e Página Pública

### T016 [B][T] — Módulo IP Geolocation (Edge Function shared)
- ip-api.com com timeout 3s. Retorna city/region/country/lat/lon ou null.

### T017 [B][T] — Edge Function: Scan
- Público. Rate limit + debounce. Geoloc precisa OU IP fallback. INSERT scan_event.

### T018 [B][T] — Edge Function: Send Notification
- 3 templates email (preciso/aproximado/nenhum). Recompensa inclusa se aplicável. Resend API.

### T019 [B][T] — Página Pública SSR
- `/t/{tagCode}` + `/p/{publicSlug}`. Modo safe/lost/orphan. Reward badge. Geoloc request.

### T020 [T] — Realtime Notifications no Dashboard
- Subscribe scan_events. Toast com 📍/📌/📎. Apenas essential+.

### T021 [T] — Edge Function: Toggle Lost + Recompensa
- Status + reward + description. Invalida cache Vercel.

### → Checkpoint Fase 3
- [ ] Scan → email em < 30s (preciso ou aproximado)
- [ ] Recompensa na página pública quando lost
- [ ] Realtime toast no dashboard

---

## Fase 4 — Health Records + Dashboard + Settings + Polish

### T022 [T] — Health Records (CRUD + limite mensal digital)
### T023 [T] — Dashboard Home (Bento Grid + shell sidebar/topbar)
### T024 [T] — Settings (Perfil + Notificações + LGPD excluir conta)
### T025 [T] — Co-Tutor Management (Elite+ — convite email, aceite, revogação)
### T026 — SEO + Meta Tags dinâmicas
### T027 — Performance Audit (Lighthouse ≥ 90, bundle < 150KB)
### T028 — Testes E2E (Playwright — fluxos completos)

### → Checkpoint Fase 4
- [ ] Dashboard completo | Health records com limites | Lighthouse ≥ 90 | E2E passing

---

## Fase 5 — Stripe Integration (ÚLTIMA)

> ⚠️ Só execute quando tudo acima estiver validado. Até aqui, altere `plan_tier` via SQL Editor.

### T029 [B] — Configurar Stripe no Dashboard (products, prices, portal, secrets)
### T030 [B][T] — Edge Functions: create-checkout, create-portal, stripe-webhook
### T031 [T] — Upgrade/Downgrade Flow no Frontend
### T032 — Webhook URL no Stripe + testes com cartão `4242 4242 4242 4242`

### → Checkpoint Fase 5
- [ ] Checkout funcional | Webhook processando | Upgrade/downgrade refletido

---

## Fase 6 — Deploy Final

### T033 — CI/CD (GitHub Actions)
### T034 — Configuração de produção (Auth confirm email, Google OAuth publicar, cron ativo)

### → Checkpoint Final
- [ ] Todos os fluxos end-to-end | Landing LCP < 1.5s | Sentry ativo | Cron anti-pausa ativo
