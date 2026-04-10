# 🐾 Pet Volta — Constitution

> Princípios inegociáveis que governam todas as decisões de design, implementação e evolução do projeto.

**Projeto:** Pet Volta — SaaS de Segurança Pet  
**Data:** 2026-04-04  
**Versão:** 1.0.0  
**Autor:** William

---

## I. Princípios Fundamentais

### 1. Especificação como Fonte da Verdade
O código serve a especificação, não o contrário. Toda implementação deve ser rastreável a um requisito documentado. Se não está na spec, não é implementado. Se está na spec e não no código, é um bug.

### 2. Performance Não é Negociável
- **LCP (Largest Contentful Paint) < 1.5s** em rotas públicas SSR
- **TTI (Time to Interactive) < 3s** no dashboard mobile
- **Bundle size** do initial load < 150KB gzipped
- Toda rota pública deve atingir score Lighthouse ≥ 90 em Performance

### 3. Acessibilidade é Requisito, Não Feature
- WCAG 2.2 nível AA é o piso mínimo
- Toda interação deve ser navegável por teclado
- Todo elemento visual deve ter alternativa textual
- Contraste mínimo: 4.5:1 para texto, 3:1 para elementos de UI

### 4. Segurança em Profundidade
- Row Level Security (RLS) no Supabase é a primeira barreira, não a única
- Validação de dados acontece em TRÊS camadas: UI → Edge Function → RLS
- Dados de geolocalização são tratados como PII (Personally Identifiable Information)
- Nenhuma informação de plano ou pagamento é exposta no client-side

### 5. Mobile-First, Não Mobile-Also
- O layout é projetado para telas de 375px primeiro
- Componentes interativos respeitam touch targets de 44×44px mínimo
- Dashboard usa padrão Bento Grid otimizado para scroll vertical em mobile

---

## II. Convenções de Código

### Linguagem
- **Código técnico** (variáveis, funções, classes, interfaces): inglês, `camelCase`
- **Termos de negócio** (enums de status, constantes de domínio): inglês
- **Comentários e documentação**: português brasileiro
- **Mensagens de UI** (labels, erros, notificações): português brasileiro

### Angular
- **Standalone components** exclusivamente — NgModules são proibidos
- **Signals** (`signal()`, `computed()`, `effect()`, `linkedSignal()`) para todo estado reativo
- **RxJS** permitido apenas para: Supabase Realtime subscriptions, HTTP interceptors, e Router events
- **Control flow** moderno: `@if`, `@for`, `@switch` — nunca `*ngIf`, `*ngFor`
- **Input/Output signal-based**: `input()`, `output()` — nunca decorators `@Input()`, `@Output()`
- **Lazy loading** via `loadComponent` em todas as rotas de feature

### UI Components
- **Zard UI primeiro**: sempre usar componentes do `src/app/ui/` (`ui-button`, `ui-card`, `ui-badge`, `ui-input`, `ui-label`, `ui-separator`, `ui-tabs`, `ui-dialog`, `ui-avatar`, `ui-badge`, `ui-switch`, `ui-skeleton`, `ui-dropdown`, `ui-select`) antes de criar elementos HTML equivalentes
- **Fallback para HTML nativo**: apenas quando o componente Zard não existir ou não for tecnicamente compatível (ex: `<input formControlName>` com `UiInputComponent` que usa `model()`)
- **Emojis proibidos** em todo o código e templates — usar `IconComponent` (`app-icon`) ou SVG inline quando necessário
- **IconComponent** (`src/app/shared/icons/icon.component.ts`): usar para todos os ícones no template

### Estilização
- **Tailwind CSS** exclusivamente — CSS customizado apenas em `@layer` quando Tailwind não cobre
- **Tokens de design** via `tailwind.config.js` — nunca valores arbitrários (`text-[#hex]`)
- **Classe utilitária** direta no template — nunca `@apply` em component CSS (exceto para composição em `@layer components`)

### Git & Commits
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`
- **Branch por feature**: `NNN-feature-name` (ex: `001-setup-foundation`)
- **PR obrigatório** com checklist antes de merge

---

## III. Governança

- A Constitution precede todas as outras decisões técnicas
- Alterações na Constitution requerem documentação, justificativa e atualização da spec
- Todo PR deve verificar conformidade com estes princípios
- Divergências são resolvidas consultando este documento primeiro
