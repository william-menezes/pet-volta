# 🐾 Pet Volta MVP — Plano de Implementação Técnica (v3)

> **Branch:** `001-mvp-pet-volta`  
> **Data:** 2026-04-05  
> **Spec:** [spec.md](./spec.md)  
> **Constitution:** [constitution.md](../constitution.md)  
> **Changelog v3:** Landing page, Stripe como última fase, mock de plano, serviços via plataforma

---

## 1. Decisões de Arquitetura

### 1.1 Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Frontend Framework | Angular | 21.x (stable) | SSR nativo, Signals estáveis, zoneless stable, route-level render mode |
| Rendering | Angular SSR | Built-in (`@angular/ssr`) | SSR para rotas públicas, CSR para dashboard |
| Zoneless | `provideZonelessChangeDetection()` | Stable (desde v20.2) | Menor bundle, melhor performance |
| UI Components | Zard UI | Latest | Copy-paste/shadcn para Angular, Signal-based, Tailwind v4 |
| Styling | Tailwind CSS | v4.x | Utility-first, design tokens via CSS custom properties |
| Backend | **Supabase (Free tier)** | Cloud | PostgreSQL, Auth, RLS, Realtime, Edge Functions, Storage |
| Pagamentos | Stripe | API v2024+ | Checkout Sessions, Customer Portal, Webhooks |
| Email Transacional | Resend | API | Free: 3,000 emails/mês |
| IP Geolocation | ip-api.com | Free (non-commercial) | 45 req/min, sem API key necessária |
| **Hosting Frontend** | **Vercel** | — | Edge SSR, ISR, on-demand revalidation, Cron Jobs |
| Monitoramento | Sentry | Angular SDK | Error tracking, performance monitoring |

### 1.2 Rendering Strategy

```
Rota                              Rendering    Cache
────────────────────────────────  ───────────  ──────────────────
/t/{tagCode}  (perfil via tag)    SSR          ISR 60s + on-demand revalidation
/p/{publicSlug} (perfil direto)   SSR          ISR 60s + on-demand revalidation
/auth/*       (login/registro)    SSR          Static (prerender)
/pricing      (planos)            SSR          Static (prerender)
/             (landing page)      SSR          Static (prerender)
/dashboard/** (área logada)       CSR          No cache
```

### 1.3 Design System — TypeUI Colorful

> **Referência oficial:** https://www.typeui.sh/design-skills/colorful
> TypeUI Colorful é um design system vibrante, high-energy, com paleta blue-to-violet e gradientes como ferramenta central.

**Paleta de Cores (tokens do TypeUI Colorful):**

| Token | Hex | Uso no Pet Volta |
|---|---|---|
| Primary | `#3B82F6` (Blue) | CTAs, links, elementos interativos, âncora da paleta |
| Secondary | `#8B5CF6` (Violet) | Acentos, destaques, gradient endpoints, badges premium |
| Success | `#16A34A` | Status `safe`, confirmações, toggle ativo |
| Warning | `#D97706` | Avisos, estados pendentes |
| Danger | `#DC2626` | Modo `lost`, erros, ações destrutivas |
| Surface | `#FFFFFF` | Backgrounds, cards, containers |
| Text | `#111827` | Body text, headings, labels |

**Gradientes (eixo blue→violet do TypeUI Colorful):**
- Hero/CTA: `bg-gradient-to-r from-blue-500 to-violet-500`
- Banner alerta (lost): `bg-gradient-to-r from-red-500 to-orange-500`
- Cards premium: `bg-gradient-to-br from-violet-50 to-blue-50`
- Usar gradientes em: hero sections, CTAs, progress bars, badges de plano
- Usar cor sólida em: form inputs, labels, body text

**Tipografia (TypeUI Colorful prescreve Inter como counterbalance neutro):**

| Uso | Fonte | Peso | Notas |
|---|---|---|---|
| Display / Títulos | **Outfit** | 600-700 | Sobrescreve Inter do TypeUI — Outfit é mais lúdico/pet-friendly |
| Corpo / UI | **Inter** | 400-500 | Conforme TypeUI Colorful — neutro como counterbalance |
| Código / IDs | **JetBrains Mono** | 400 | Conforme TypeUI Colorful — para tagCodes, petIds |

> **Decisão:** Mantemos Outfit para títulos em vez de Inter puro (como TypeUI prescreve) porque
> o contexto pet pede personalidade nos headings. Inter no corpo garante o counterbalance neutro
> que o TypeUI Colorful exige. JetBrains Mono conforme especificado.

**Spacing:** Grid de 8px (conforme TypeUI Colorful — mais strict que 4px).

**Border Radius:** `rounded-3xl` (24px) para cards, `rounded-2xl` (16px) para inputs — estilo orgânico "pet-friendly" que complementa a vibrance do Colorful.

**Filosofia TypeUI Colorful aplicada:**
1. Cor como informação — Primary blue = interatividade, secondary violet = ênfase, success/warning/danger = estado
2. Gradiente como ferramenta, não truque — usar em hero, CTAs, progress; cor sólida em forms e texto
3. Tipografia neutra como contrapeso — Inter no corpo dá descanso visual em UI colorida
4. Grid 8pt como âncora — estrutura rígida compensa a complexidade visual
5. Alto contraste por padrão — WCAG AA garantido, cores nunca são o único indicador

### 1.4 Constraints do Supabase Free Tier

> **NÃO-NEGOCIÁVEL:** O MVP roda no Supabase Free até validação.

**Limites e Mitigações:**

| Recurso | Limite Free | Estratégia de Mitigação |
|---|---|---|
| DB Storage | 500 MB | Não armazenar blobs no DB. Fotos no Storage. Queries seletivas. Monitorar com alerta em 400MB |
| File Storage | 1 GB | Comprimir imagens client-side (max 500KB/foto). Limitar uploads por plano |
| DB Egress | 5 GB/mês | Cache agressivo no client (SWR pattern). Paginação 20 items/page. `.select()` seletivo |
| MAUs Auth | 50,000 | Suficiente para MVP (target 500 users) |
| Edge Fn Invocations | 500,000/mês | Consolidar lógica (scan + notificação = 1 invocação). Debounce no client |
| Pausa 7 dias | Projeto pausa | **Vercel Cron Job**: ping a cada 5 dias via `/api/keepalive` que faz um SELECT simples |
| Backups | Nenhum | pg_dump semanal via script local + armazenar no Vercel Blob ou S3 free |
| Realtime | Limitado | Usar apenas para notificação de scan no dashboard (1 canal por tutor) |
| Max file size | 50 MB | Suficiente (fotos max 2MB, PDFs max 5MB) |

**Vercel Cron para anti-pausa:**
```typescript
// api/keepalive.ts (Vercel API Route)
// Configurar em vercel.json: { "crons": [{ "path": "/api/keepalive", "schedule": "0 8 */5 * *" }] }
export default async function handler() {
  const { data } = await supabase.from('tags').select('id').limit(1);
  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
```

---

## 2. Modelo de Dados — Alterações v2

> Detalhes completos em [data-model.md](./data-model.md)

**Alterações da v2:**

### 2.1 Tabela `pets` — Novos campos

```sql
-- Novos campos para recompensa e slug público
ALTER TABLE public.pets ADD COLUMN public_slug TEXT UNIQUE;        -- slug para URL /p/{slug}
ALTER TABLE public.pets ADD COLUMN reward_amount_cents INTEGER DEFAULT 0;  -- recompensa em centavos
ALTER TABLE public.pets ADD COLUMN lost_description TEXT;          -- descrição do desaparecimento (max 500 chars)
ALTER TABLE public.pets ADD COLUMN max_photos INTEGER DEFAULT 1;  -- limite de fotos (derivado do plano)
```

### 2.2 Tabela `scan_events` — Geolocalização por IP

```sql
-- Novos campos para localização aproximada via IP
ALTER TABLE public.scan_events ADD COLUMN ip_city TEXT;        -- cidade derivada do IP
ALTER TABLE public.scan_events ADD COLUMN ip_region TEXT;      -- estado/região derivada do IP
ALTER TABLE public.scan_events ADD COLUMN ip_country TEXT;     -- país derivado do IP
ALTER TABLE public.scan_events ADD COLUMN ip_lat DOUBLE PRECISION;  -- lat aproximada do IP
ALTER TABLE public.scan_events ADD COLUMN ip_lon DOUBLE PRECISION;  -- lon aproximada do IP
ALTER TABLE public.scan_events ADD COLUMN location_type TEXT DEFAULT 'none';  -- 'precise' | 'approximate' | 'none'
```

### 2.3 Enum `plan_tier` — 4 planos

```sql
-- Substituir enum antigo
ALTER TYPE plan_tier RENAME VALUE 'free' TO 'digital';
-- Ou recriá-lo:
CREATE TYPE plan_tier AS ENUM ('digital', 'essential', 'elite', 'guardian');
```

### 2.4 Nova tabela: `pet_co_tutors` (Multi-tutor, Elite+)

```sql
CREATE TABLE public.pet_co_tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pet_id, profile_id)
);
```

### 2.5 Constantes de Plano (referência para RLS e client)

```typescript
// src/app/shared/utils/plan-limits.ts
export const PLAN_LIMITS = {
  digital:   { pets: 1, photosPerPet: 1,  healthRecordsMonthly: 2,    scanHistoryDays: 7,     hasTag: false, hasReward: false, hasMultiTutor: false, hasRealtime: false },
  essential: { pets: 1, photosPerPet: 2,  healthRecordsMonthly: null, scanHistoryDays: 90,    hasTag: true,  hasReward: true,  hasMultiTutor: false, hasRealtime: true },
  elite:     { pets: 3, photosPerPet: 10, healthRecordsMonthly: null, scanHistoryDays: 365,   hasTag: true,  hasReward: true,  hasMultiTutor: true,  hasRealtime: true },
  guardian:  { pets: 5, photosPerPet: 10, healthRecordsMonthly: null, scanHistoryDays: null,  hasTag: true,  hasReward: true,  hasMultiTutor: true,  hasRealtime: true },
} as const;
```

---

## 3. Geolocalização por IP — Arquitetura

### 3.1 Fluxo

```
Encontrador escaneia QR
        │
        ▼
  Browser abre /t/{tagCode}
        │
        ▼
  Página pública (SSR) renderiza
        │
  ┌─────┴─────────────────────┐
  │ Pet está LOST?            │
  │                           │
  │  SIM → Solicitar geoloc   │
  │         do browser        │
  │                           │
  │  ┌───── Aceito ──────┐   │
  │  │ lat/lng precisos   │   │
  │  │ location_type =    │   │
  │  │ 'precise'          │   │
  │  └───────────────────-┘   │
  │                           │
  │  ┌───── Negado ──────┐   │
  │  │ Edge Fn extrai IP  │   │
  │  │ via X-Forwarded-For│   │
  │  │ Consulta ip-api.com│   │
  │  │ Obtém cidade/região│   │
  │  │ location_type =    │   │
  │  │ 'approximate'      │   │
  │  └───────────────────-┘   │
  │                           │
  │  NÃO (safe) → Nenhuma    │
  │  geoloc solicitada        │
  └───────────────────────────┘
        │
        ▼
  POST /functions/v1/scan
  {tagCode, lat?, lng?, message?,
   ipLocationFallback: true/false}
        │
        ▼
  Edge Function processa:
  1. Se lat/lng presentes → location_type = 'precise'
  2. Se não → extrair IP do header X-Forwarded-For
     → GET http://ip-api.com/json/{ip}?fields=city,regionName,country,lat,lon
     → Salvar ip_city, ip_region, ip_country, ip_lat, ip_lon
     → location_type = 'approximate'
  3. Disparar notificação com o tipo de localização
```

### 3.2 ip-api.com — Detalhes

- **Free tier:** 45 req/min, sem API key, apenas HTTP (não HTTPS no free)
- **Alternativa se volume crescer:** ipapi.co (1,000 req/dia grátis, HTTPS)
- **Accuracy:** ~5-50km dependendo do ISP (suficiente para cidade/bairro)
- **Privacy:** IP é processado no Edge Function e NUNCA armazenado raw — apenas o hash + dados derivados (cidade/região)
- **Fallback:** Se ip-api.com falhar, salvar `location_type = 'none'` e notificar mesmo assim

### 3.3 Template do Email de Notificação

```
Caso 1 — Localização precisa:
  "📍 Alguém encontrou o {petName}!"
  "Localização: [Mapa estático com pin]"
  "Coordenadas: -23.5505, -46.6333"

Caso 2 — Localização aproximada (IP):
  "📌 Alguém encontrou o {petName}!"
  "Localização aproximada: São Paulo, SP"
  "⚠️ Esta localização é baseada no IP e pode variar em alguns quilômetros."

Caso 3 — Sem localização:
  "🔔 Alguém viu a página do {petName}!"
  "Localização: não disponível"
  "O encontrador pode ter deixado uma mensagem: {message}"
```

---

## 4. Feature: Recompensa por Devolução

### 4.1 Regras de Negócio

1. **Disponibilidade:** Apenas planos Essential, Elite, Guardian (plano Digital NÃO pode definir recompensa)
2. **Valor:** Inteiro em centavos (R$0 = sem recompensa). Sem limite superior.
3. **Visibilidade:** Exibido na página pública APENAS quando pet está `lost` E valor > 0
4. **Edição:** Tutor pode alterar valor a qualquer momento enquanto pet está `lost`
5. **Persistência:** Valor é preservado quando tutor desativa modo `lost` (não exibido, mas não apagado)
6. **Pagamento:** Pet Volta NÃO intermedia pagamento de recompensa. É um acordo entre tutor e encontrador.
7. **Disclaimer:** Página pública exibe aviso: "A recompensa é oferecida diretamente pelo tutor. Pet Volta não intermedia pagamentos."

### 4.2 UI — Página Pública (Modo Alerta com Recompensa)

```
┌──────────────────────────────────────┐
│ ⚠️ PERDIDO DESDE 02/04/2026         │ ← Banner gradient red→orange
│                                      │
│     [foto do pet]                    │
│     LUNA                             │
│     Labrador • Porte Grande          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🎁 RECOMPENSA                    │ │ ← Card destaque gradient blue→violet
│ │                                  │ │
│ │    R$ 500,00                     │ │ ← Valor grande, font-display bold
│ │                                  │ │
│ │ Oferecida pelo tutor.            │ │
│ │ Pet Volta não intermedia.        │ │ ← Disclaimer em texto pequeno
│ └──────────────────────────────────┘ │
│                                      │
│ "Última vez vista no Parque          │
│  Ibirapuera, próximo ao lago"        │ ← lost_description
│                                      │
│ [📍 Compartilhar Localização]        │ ← Botão primário (gradiente)
│ [📞 Ligar para o Tutor]             │ ← Botão secundário
│ [💬 WhatsApp]                        │ ← Botão terciário
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Onde você encontrou o Luna?      │ │ ← Campo de texto
│ │ [____________________________]   │ │
│ │ [Enviar e Notificar Tutor]       │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 5. Arquitetura de Pastas — Alterações v2

Novos arquivos em relação à v1:

```diff
  src/app/
    features/
      public-profile/
        pet-profile/
+         reward-badge.component.ts        # Badge de recompensa
+         location-request.component.ts    # Componente de geoloc request
+         lost-description.component.ts    # Descrição do desaparecimento
      pet-management/
        pet-detail/
+         reward-form.component.ts         # Form de recompensa no toggle lost
+         co-tutor-invite.component.ts     # Convite multi-tutor (Elite+)
+   shared/
+     pipes/
+       currency-brl.pipe.ts              # Formata centavos → R$ X,XX
+     utils/
+       plan-limits.ts                    # Constantes de limite por plano (atualizado)
+       ip-geolocation.ts                # Tipos para geoloc via IP
  supabase/
    functions/
      scan/
+       ip-geolocation.ts                # Módulo para consultar ip-api.com
```

---

## 6. Landing Page — Arquitetura e Design

### 6.1 Estrutura de Componentes

A landing page é composta de componentes standalone independentes, todos SSR prerender:

```
src/app/features/landing/
├── landing.routes.ts
├── landing-page.component.ts          # Componente pai que orquestra as seções
├── header/
│   └── header.component.ts            # Sticky header com nav + auth buttons
├── hero/
│   └── hero.component.ts              # Gradient hero com CTAs
├── how-it-works/
│   └── how-it-works.component.ts      # 3 passos com ícones
├── pricing-section/
│   └── pricing-section.component.ts   # 4 cards de planos (estático, sem Stripe)
├── testimonials/
│   └── testimonials.component.ts      # 3 cards de depoimentos fictícios
├── faq/
│   └── faq.component.ts              # Accordion com perguntas
├── cta-banner/
│   └── cta-banner.component.ts        # Barra final de CTA
└── footer/
    └── footer.component.ts            # Footer com links e copyright
```

### 6.2 Design Decisions (TypeUI Colorful aplicado)

| Seção | Background | Elementos Visuais |
|---|---|---|
| Header | `bg-white/80 backdrop-blur-md` (ao scroll) | Logo + nav. Botão "Criar Conta" com `bg-gradient-to-r from-blue-500 to-violet-500` |
| Hero | `bg-gradient-to-br from-blue-600 via-blue-500 to-violet-500` | Texto branco, CTAs brancos, ilustração/mockup |
| Como Funciona | `bg-white` | Cards com ícones, borda sutil, shadow-sm |
| Planos | `bg-gray-50` | Card Elite com borda `border-gradient` e badge "Recomendado" |
| Depoimentos | `bg-white` | Cards com avatar (initials), estrelas em `text-yellow-400` |
| FAQ | `bg-gray-50` | Accordion com hover state e chevron animado |
| CTA Final | `bg-gradient-to-r from-blue-500 to-violet-500` | Texto branco, botão outline branco |
| Footer | `bg-gray-900 text-gray-400` | Links hover `text-white`, logo em branco |

### 6.3 Responsividade

| Breakpoint | Header | Hero | Planos | Depoimentos |
|---|---|---|---|---|
| Mobile (<768px) | Hamburger menu | Stack vertical, CTA full-width | 1 card por row (scroll vertical) | 1 card por row |
| Tablet (768-1024px) | Nav visível | Side-by-side (text + mockup) | 2 cards por row | 2 cards por row |
| Desktop (>1024px) | Nav completo | Side-by-side com espaço | 4 cards em row | 3 cards em row |

---

## 7. Estratégia de Mock de Plano (Stripe é Último)

### 7.1 Premissa

A integração com Stripe é a **última fase** do desenvolvimento (Fase 6 no tasks.md). Até lá, o sistema de planos funciona com mock:

### 7.2 Como Funciona Sem Stripe

1. **Novo usuário** → `plan_tier = 'digital'` (via trigger SQL no signup)
2. **Para testar outros planos** → alterar manualmente no Supabase Studio:
   ```sql
   UPDATE profiles SET plan_tier = 'essential' WHERE id = 'uuid-do-usuario';
   ```
3. **RLS funciona normalmente** — as policies verificam `plan_tier` no banco, independente de como foi setado
4. **Botões de plano na landing page** → redirecionam para `/auth/register` com query param `?plan=essential`
5. **Tela de pricing no dashboard** → exibe planos e features, botões de "Assinar" mostram toast "Pagamento será habilitado em breve" ou desabilitados
6. **Botão de debug em settings** (removido antes de produção) → permite trocar plano manualmente para testes

### 7.3 Quando Integrar Stripe

Quando TODOS estes critérios forem atendidos:
- [ ] Todas as Fases 0-5 concluídas e deployadas
- [ ] Fluxos end-to-end validados com planos mockados
- [ ] Landing page publicada e acessível
- [ ] Scans e notificações funcionando em produção
- [ ] Performance targets atingidos (LCP, Lighthouse)
- [ ] Pelo menos 1 semana de uso sem bugs críticos

---

## 8. Gargalos e Riscos — Atualização v3

### 🔴 Risco Alto

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | **Supabase Free pausa após 7 dias** | App offline para todos os usuários | Vercel Cron Job ping a cada 5 dias. Monitorar via UptimeRobot |
| R2 | **500MB DB storage** | Projeto para de aceitar writes ao atingir limite | Monitorar com alerta em 400MB. Imagens vão para Storage (não DB). Cleanup de scan_events > 90 dias |
| R3 | **5GB egress/mês** | API começa a falhar | Cache SWR client-side. Paginação agressiva. `.select()` seletivo |
| R4 | **Stripe webhook falhando** | Plano dessincronizado | Retry automático do Stripe + reconciliação diária |
| R5 | **ip-api.com free não tem HTTPS** | Dados de IP trafegam sem criptografia no Edge Fn | Aceitável para MVP (Edge Fn → ip-api é server-to-server). Migrar para ipapi.co (HTTPS) pós-MVP |

### 🟡 Risco Médio

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R6 | **ip-api.com rate limit (45/min)** | Geoloc IP falha em pico de scans | Improvável no MVP (target < 300 scans/dia). Cache IP→cidade por 24h no DB |
| R7 | **Sem backup automático** | Perda de dados em caso de corrupção | pg_dump semanal via GitHub Action + armazenar em Vercel Blob |
| R8 | **Recompensa pode atrair fraude** | Pessoas fazem scan apenas pela recompensa | Debounce 5min por IP. Disclaimer claro. Tutores são orientados a verificar antes de pagar |
| R9 | **1GB file storage** | Limite atingido com muitas fotos | Compressão client-side (max 500KB/foto). Limitar fotos por plano. Monitorar |

---

## 9. Inconsistências Corrigidas

| # | Item Original | Correção |
|---|---|---|
| 1 | 3 planos (Free/Pro/Family) | Atualizado para 4 planos (Digital/Essential/Elite/Guardian) |
| 2 | Free inclui tag | Corrigido: Digital (free) NÃO inclui tag. Adicionada rota `/p/{slug}` para perfil sem tag |
| 3 | Supabase Pro assumido | Corrigido: Supabase Free tier com todas as constraints e mitigações documentadas |
| 4 | Sem feature de recompensa | Adicionada: reward_amount_cents no pet, exibição condicional por plano e status |
| 5 | Sem geoloc por IP como fallback | Adicionada: ip-api.com no Edge Function, campos ip_* no scan_events, 3 templates de email |
| 6 | TypeUI referência genérica | Corrigida: tokens oficiais do TypeUI Colorful (https://www.typeui.sh/design-skills/colorful) com adaptações documentadas (Outfit para headings) |
| 7 | Hosting indefinido | Confirmado: Vercel com ISR, Cron Jobs, on-demand revalidation |
| 8 | Sem multi-tutor | Adicionado: co-tutores com leitura (Elite+) via tabela pet_co_tutors |
| 9 | Sem slug público para Digital | Adicionado: public_slug no pet para rota /p/{slug} sem tag |
| 10 | Sem anti-pausa Supabase | Adicionado: Vercel Cron Job ping a cada 5 dias |
| 11 | Sem monitoramento de limites | Adicionado: alertas para DB size > 400MB, egress, invocations |
