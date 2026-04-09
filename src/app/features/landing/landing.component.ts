import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '@ui/button/ui-button.component';

type FaqItem = { q: string; a: string };

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, NgClass],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <header
        class="sticky top-0 z-40 border-b border-gray-200 bg-surface/80 backdrop-blur"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <a
            class="flex items-center gap-2 font-display text-base font-semibold tracking-tight"
            href="#inicio"
            aria-label="Pet Volta - Início"
          >
            <span class="text-lg">🐾</span>
            <span>Pet Volta</span>
          </a>

          <nav
            class="hidden flex-1 items-center justify-center gap-6 md:flex"
            aria-label="Menu"
          >
            <a class="text-sm text-gray-700 hover:text-text" href="#inicio"
              >Início</a
            >
            <a class="text-sm text-gray-700 hover:text-text" href="#planos"
              >Planos</a
            >
            <a class="text-sm text-gray-700 hover:text-text" href="#faq"
              >FAQ</a
            >
          </nav>

          <div class="ml-auto hidden items-center gap-2 md:flex">
            <a routerLink="/auth/login">
              <ui-button variant="ghost" type="button">Login</ui-button>
            </a>
            <a routerLink="/auth/register">
              <ui-button type="button">Criar conta</ui-button>
            </a>
          </div>

          <button
            type="button"
            class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-pet-sm border border-gray-200 bg-white text-sm text-text md:hidden"
            (click)="toggleMenu()"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="mobile-menu"
            aria-label="Abrir menu"
          >
            ☰
          </button>
        </div>

        @if (menuOpen()) {
          <div
            id="mobile-menu"
            class="border-t border-gray-200 bg-surface md:hidden"
          >
            <div class="mx-auto grid max-w-6xl gap-3 px-4 py-4">
              <a
                class="text-sm text-gray-700 hover:text-text"
                href="#inicio"
                (click)="closeMenu()"
              >
                Início
              </a>
              <a
                class="text-sm text-gray-700 hover:text-text"
                href="#planos"
                (click)="closeMenu()"
              >
                Planos
              </a>
              <a
                class="text-sm text-gray-700 hover:text-text"
                href="#faq"
                (click)="closeMenu()"
              >
                FAQ
              </a>
              <div class="grid gap-2 pt-2">
                <a routerLink="/auth/login" (click)="closeMenu()">
                  <ui-button [className]="'w-full'" variant="ghost" type="button"
                    >Login</ui-button
                  >
                </a>
                <a routerLink="/auth/register" (click)="closeMenu()">
                  <ui-button [className]="'w-full'" type="button"
                    >Criar conta</ui-button
                  >
                </a>
              </div>
            </div>
          </div>
        }
      </header>

      <section
        id="inicio"
        class="relative overflow-hidden bg-gradient-green"
      >
        <div
          class="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:py-20"
        >
          <div>
            <p class="font-mono text-xs text-white/80">
              Segurança pet • QR Tag • Notificação
            </p>
            <h1
              class="mt-4 font-display text-4xl font-semibold tracking-tight text-white md:text-5xl"
            >
              Seu pet volta pra casa mais rápido.
            </h1>
            <p class="mt-4 text-base text-white/90 md:text-lg">
              Perfil digital + tag QR: quem encontra escaneia, você recebe a
              notificação.
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a routerLink="/auth/register">
                <ui-button type="button" [className]="'w-full sm:w-auto'"
                  >Começar Grátis</ui-button
                >
              </a>
              <a href="#planos">
                <ui-button variant="ghost" type="button" [className]="'w-full sm:w-auto'">
                  Conhecer Planos
                </ui-button>
              </a>
            </div>

            <div class="mt-10 grid gap-3 sm:grid-cols-3">
              @for (step of howItWorks(); track step.title) {
                <div class="rounded-pet bg-white/10 p-4 text-white">
                  <p class="text-2xl" aria-hidden="true">{{ step.icon }}</p>
                  <p class="mt-2 text-sm font-medium">{{ step.title }}</p>
                  <p class="mt-1 text-xs text-white/80">{{ step.desc }}</p>
                </div>
              }
            </div>
          </div>

          <div class="flex items-center justify-center">
            <div class="w-full max-w-md rounded-pet bg-white/10 p-6 text-white">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">Mockup</p>
                <span class="rounded-full bg-white/15 px-3 py-1 text-xs">MVP</span>
              </div>

              <div class="mt-5 grid grid-cols-2 gap-3">
                <div class="rounded-pet bg-white/10 p-4">
                  <p class="text-xs text-white/80">Tag QR</p>
                  <div class="mt-3 grid h-24 place-items-center rounded-pet bg-white/10">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 2h2v2h-2v-2Zm0-2h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2 2h2v2h-2v-2Z"
                        stroke="white"
                        stroke-width="1.5"
                      />
                    </svg>
                  </div>
                </div>

                <div class="rounded-pet bg-white/10 p-4">
                  <p class="text-xs text-white/80">Perfil do Pet</p>
                  <div class="mt-3 rounded-pet bg-white/10 p-4">
                    <p class="text-sm font-medium">Luna 🐶</p>
                    <p class="mt-1 text-xs text-white/80">
                      Contato rápido + informações úteis.
                    </p>
                    <div class="mt-3 rounded-pet bg-white/10 px-3 py-2 text-xs">
                      Status: Seguro
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 rounded-pet bg-white/10 p-4">
                <p class="text-xs text-white/80">Notificação</p>
                <p class="mt-2 text-sm">
                  “📍 Scan detectado próximo ao Centro — São Paulo”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" class="bg-surface">
        <div class="mx-auto max-w-6xl px-4 py-14 md:py-18">
          <div class="max-w-2xl">
            <h2 class="font-display text-3xl font-semibold tracking-tight text-text">
              Planos que cabem no seu cuidado
            </h2>
            <p class="mt-3 text-gray-700">
              Comece grátis e evolua quando precisar de mais tags, pets e recursos.
            </p>
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (plan of plans(); track plan.name) {
              <div
                class="rounded-pet border border-gray-200 bg-white p-5"
                [ngClass]="
                  plan.highlight
                    ? 'bg-gradient-to-br from-primary/10 to-accent/20 border-primary/15 shadow-pet-md'
                    : ''
                "
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-text">{{ plan.name }}</p>
                    <p class="mt-1 text-xs text-gray-600">{{ plan.subtitle }}</p>
                  </div>
                  @if (plan.badge) {
                    <span
                      class="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary"
                    >
                      {{ plan.badge }}
                    </span>
                  }
                </div>

                <div class="mt-5">
                  <p class="font-display text-2xl font-semibold text-text">
                    {{ plan.price }}
                    <span class="text-sm font-normal text-gray-600">{{
                      plan.period
                    }}</span>
                  </p>
                </div>

                <ul class="mt-5 space-y-2 text-sm text-gray-700">
                  @for (f of plan.features; track f.text) {
                    <li class="flex items-start gap-2">
                      <span class="mt-0.5" aria-hidden="true">{{
                        f.ok ? '✅' : '❌'
                      }}</span>
                      <span>{{ f.text }}</span>
                    </li>
                  }
                </ul>

                <div class="mt-6">
                  <a routerLink="/auth/register">
                    <ui-button [className]="'w-full'" [variant]="plan.ctaVariant" type="button">
                      {{ plan.cta }}
                    </ui-button>
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="bg-primary/5">
        <div class="mx-auto max-w-6xl px-4 py-14 md:py-18">
          <div class="max-w-2xl">
            <h2 class="font-display text-3xl font-semibold tracking-tight text-text">
              Quem usa, recomenda
            </h2>
            <p class="mt-3 text-gray-700">
              Depoimentos fictícios (placeholder) para o MVP.
            </p>
          </div>

          <div class="mt-10 hidden grid-cols-3 gap-4 md:grid">
            @for (t of testimonials(); track t.name) {
              <figure class="rounded-pet border border-gray-200 bg-white p-5">
                <blockquote class="text-sm text-gray-700">“{{ t.quote }}”</blockquote>
                <figcaption class="mt-4 text-sm font-medium text-text">
                  {{ t.name }} • {{ t.city }} {{ t.pet }}
                </figcaption>
              </figure>
            }
          </div>

          <div class="mt-10 md:hidden">
            <div class="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
              @for (t of testimonials(); track t.name) {
                <figure
                  class="w-5/6 shrink-0 snap-center rounded-pet border border-gray-200 bg-white p-5"
                >
                  <blockquote class="text-sm text-gray-700">“{{ t.quote }}”</blockquote>
                  <figcaption class="mt-4 text-sm font-medium text-text">
                    {{ t.name }} • {{ t.city }} {{ t.pet }}
                  </figcaption>
                </figure>
              }
            </div>
          </div>
        </div>
      </section>

      <section id="faq" class="bg-white">
        <div class="mx-auto max-w-6xl px-4 py-14 md:py-18">
          <div class="max-w-2xl">
            <h2 class="font-display text-3xl font-semibold tracking-tight text-text">
              Perguntas frequentes
            </h2>
            <p class="mt-3 text-gray-700">
              Tudo o que você precisa para decidir com tranquilidade.
            </p>
          </div>

          <div class="mt-10 grid gap-3">
            @for (item of faq(); track item.q) {
              <details class="rounded-pet border border-gray-200 bg-white p-5">
                <summary class="cursor-pointer list-none text-sm font-medium text-text outline-none">
                  <span class="mr-2" aria-hidden="true">➜</span>
                  {{ item.q }}
                </summary>
                <p class="mt-3 text-sm text-gray-700">{{ item.a }}</p>
              </details>
            }
          </div>
        </div>
      </section>

      <!-- CTA Banner final -->
      <section class="bg-gradient-to-r from-primary to-secondary">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 class="font-display text-2xl font-semibold text-white md:text-3xl">
              Comece agora, é grátis.
            </h2>
            <p class="mt-2 text-white/80">
              Cadastre seu pet e tenha um perfil público em minutos.
            </p>
          </div>
          <a routerLink="/auth/register" class="shrink-0">
            <ui-button
              type="button"
              [className]="'border border-white/60 bg-white/10 text-white hover:bg-white/20'"
            >
              Criar conta grátis
            </ui-button>
          </a>
        </div>
      </section>

      <footer class="bg-gray-900">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
          <div class="md:col-span-1">
            <p class="font-display text-lg font-semibold text-white">🐾 Pet Volta</p>
            <p class="mt-2 text-sm text-gray-400">
              Um jeito simples e rápido de reconectar você ao seu melhor amigo.
            </p>
          </div>

          <div class="grid gap-2 text-sm text-gray-400">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Produto</p>
            <a class="hover:text-white hover:underline" href="#planos">Planos</a>
            <a class="hover:text-white hover:underline" routerLink="/auth/register">Começar</a>
          </div>

          <div class="grid gap-2 text-sm text-gray-400">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Suporte</p>
            <a class="hover:text-white hover:underline" href="#faq">FAQ</a>
            <a class="hover:text-white hover:underline" routerLink="/auth/login">Login</a>
          </div>

          <div class="grid gap-2 text-sm text-gray-400">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Legal</p>
            <a class="hover:text-white hover:underline" routerLink="/legal/terms">Termos</a>
            <a class="hover:text-white hover:underline" routerLink="/legal/privacy">Privacidade</a>
            <a class="hover:text-white hover:underline" routerLink="/legal/lgpd">LGPD</a>
          </div>
        </div>

        <div class="border-t border-gray-800">
          <div class="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
            © {{ year() }} Pet Volta — feito com carinho para trazer pets de volta pra casa.
          </div>
        </div>
      </footer>
    </main>
  `,
})
export class LandingComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  menuOpen = signal(false);
  year = computed(() => new Date().getFullYear());

  constructor() {
    this.title.setTitle('Pet Volta — Tag QR e perfil digital para segurança do seu pet');
    this.meta.updateTag({
      name: 'description',
      content:
        'Segurança pet com tag QR: quem encontra escaneia, você recebe notificação. Comece grátis e evolua para planos com tags.',
    });
    this.meta.updateTag({ property: 'og:title', content: 'Pet Volta' });
    this.meta.updateTag({
      property: 'og:description',
      content: 'Tag QR + perfil digital para ajudar seu pet a voltar pra casa.',
    });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: '/favicon.ico' });
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  howItWorks = computed(() => [
    { icon: '🏷️', title: 'Cadastre', desc: 'Crie o perfil do seu pet em minutos.' },
    { icon: '📎', title: 'Ative', desc: 'Vincule sua tag QR (planos pagos).' },
    { icon: '📍', title: 'Receba alerta', desc: 'Notificação quando alguém escanear.' },
  ]);

  plans = computed(() => [
    {
      name: 'Digital',
      subtitle: 'Free',
      badge: null as string | null,
      price: 'R$ 0',
      period: '/mês',
      highlight: false,
      cta: 'Começar Grátis',
      ctaVariant: 'primary' as const,
      features: [
        { ok: true, text: '1 pet' },
        { ok: true, text: '1 foto por pet' },
        { ok: true, text: 'Link público do pet' },
        { ok: false, text: 'Ativação de tag QR' },
      ],
    },
    {
      name: 'Essential',
      subtitle: 'Para 1 pet com tag',
      badge: null as string | null,
      price: 'R$ —',
      period: '/mês',
      highlight: false,
      cta: 'Assinar',
      ctaVariant: 'ghost' as const,
      features: [
        { ok: true, text: '1 pet' },
        { ok: true, text: '2 fotos por pet' },
        { ok: true, text: 'Tag QR inclusa' },
        { ok: true, text: 'Notificação de scan' },
      ],
    },
    {
      name: 'Elite',
      subtitle: 'Mais flexibilidade',
      badge: 'Mais popular',
      price: 'R$ —',
      period: '/mês',
      highlight: true,
      cta: 'Assinar',
      ctaVariant: 'secondary' as const,
      features: [
        { ok: true, text: 'Até 3 pets' },
        { ok: true, text: 'Até 10 fotos por pet' },
        { ok: true, text: 'Tags QR inclusas' },
        { ok: true, text: 'Recursos avançados (em breve)' },
      ],
    },
    {
      name: 'Guardian',
      subtitle: 'Família completa',
      badge: null as string | null,
      price: 'R$ —',
      period: '/mês',
      highlight: false,
      cta: 'Assinar',
      ctaVariant: 'ghost' as const,
      features: [
        { ok: true, text: 'Até 5 pets' },
        { ok: true, text: 'Até 10 fotos por pet' },
        { ok: true, text: 'Tags QR inclusas' },
        { ok: true, text: 'Prioridade (em breve)' },
      ],
    },
  ]);

  testimonials = computed(() => [
    {
      quote: 'A ideia da tag QR é genial. Me sinto mais segura em passeios.',
      name: 'Camila',
      city: 'Campinas',
      pet: '🐶',
    },
    {
      quote: 'Interface rápida e simples. Em minutos eu já tinha o perfil pronto.',
      name: 'Rafael',
      city: 'Rio de Janeiro',
      pet: '🐱',
    },
    {
      quote: 'Gostei do foco em privacidade. Só o essencial para ajudar de verdade.',
      name: 'Juliana',
      city: 'Curitiba',
      pet: '🐾',
    },
  ]);

  faq = computed<FaqItem[]>(() => [
    {
      q: 'Como funciona a tag?',
      a: 'A tag possui um QR Code com um link. Quem encontra o pet escaneia e acessa uma página com instruções e contato.',
    },
    {
      q: 'Meus dados estão seguros?',
      a: 'Sim. O acesso aos seus dados é protegido por autenticação e regras de segurança no banco (RLS).',
    },
    {
      q: 'Posso cancelar quando quiser?',
      a: 'Sim. No MVP, os planos pagos ainda estão em preparação; o cancelamento será sempre simples e transparente.',
    },
    {
      q: 'O que é o modo perdido?',
      a: 'Quando ativado (Fase 3+), o perfil público mostra informações extras e pode exibir recompensa.',
    },
    {
      q: 'Como funciona a recompensa?',
      a: 'O valor é exibido no perfil público quando o pet está perdido (Fase 3+). O pagamento não acontece pela plataforma no MVP.',
    },
    {
      q: 'Existe limite de pets?',
      a: 'Sim, varia por plano: Digital 1, Essential 1, Elite 3, Guardian 5.',
    },
    {
      q: "A tag é à prova d'água?",
      a: 'A tag física será pensada para uso diário. Detalhes finais do material e testes serão informados na versão final.',
    },
    {
      q: 'Precisa de internet para funcionar?',
      a: 'Sim. O QR abre uma página web para exibir informações e enviar a notificação ao tutor.',
    },
  ]);
}
