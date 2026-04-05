# Pet Volta — Contexto para Claude Code

## O que é este projeto
Pet Volta é um SaaS de segurança pet com rastreamento via QR Code e gestão de saúde.
Fase atual: MVP em desenvolvimento.

## Stack
- **Frontend:** Angular 21.x (standalone components, zoneless, SSR)
- **Backend:** Supabase Free tier (PostgreSQL, Auth, RLS, Realtime, Edge Functions, Storage)
- **Pagamentos:** Stripe (Checkout + Customer Portal)
- **Email:** Resend
- **Hosting:** Vercel (domínio: petvolta.vercel.app)
- **UI:** Zard UI (shadcn para Angular) + Tailwind CSS v4
- **Design:** TypeUI Colorful (blue→violet gradient axis, Inter body, Outfit titles)
- **Monitoramento:** Sentry

## Especificação completa
Leia OBRIGATORIAMENTE antes de implementar qualquer coisa:
- `.specify/memory/constitution.md` — Princípios inegociáveis
- `.specify/specs/001-mvp-pet-volta/spec.md` — User Stories e requisitos
- `.specify/specs/001-mvp-pet-volta/plan.md` — Plano técnico detalhado
- `.specify/specs/001-mvp-pet-volta/tasks.md` — Breakdown de tasks
- `.specify/specs/001-mvp-pet-volta/data-model.md` — Schema PostgreSQL completo
- `.specify/specs/001-mvp-pet-volta/research.md` — Pesquisas técnicas

## Comandos
- `npm start` → `ng serve` (dev server)
- `npm run build` → `ng build` (production build)
- `npm test` → `ng test` (Karma/Jasmine)
- `npm run supabase:start` → Inicia Supabase local (requer Docker)
- `npm run supabase:stop` → Para Supabase local
- `npm run supabase:reset` → Reseta DB local + reaplica migrations/seed

## Convenções de código
- **Variáveis/funções:** inglês, camelCase
- **Comentários:** português brasileiro
- **UI text:** português brasileiro
- **Standalone components** apenas — NUNCA NgModules
- **Signals** (`signal()`, `computed()`, `effect()`) para estado — NUNCA RxJS para estado UI
- **Control flow:** `@if`, `@for`, `@switch` — NUNCA `*ngIf`, `*ngFor`
- **Input/Output:** `input()`, `output()` — NUNCA decorators `@Input()`, `@Output()`
- **Tailwind tokens** apenas — NUNCA valores arbitrários (`text-[#hex]`)
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

## Constraints (não-negociáveis)
- Supabase FREE tier: 500MB DB, 1GB storage, 5GB egress, 500K edge fn invocations
- Performance: LCP < 1.5s nas rotas SSR públicas
- Acessibilidade: WCAG 2.2 AA mínimo
- Todo componente DEVE ter estados: empty, loading, error
- Imagens DEVEM ser comprimidas client-side (max 500KB) antes do upload
- `.select()` seletivo — NUNCA `select('*')` em produção

## Path Aliases
@core/* → src/app/core/*
@shared/* → src/app/shared/*
@features/* → src/app/features/*
@ui/* → src/app/ui/*
@models/* → src/app/models/*
@env/* → src/environments/*
