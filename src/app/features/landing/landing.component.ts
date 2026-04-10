import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiBadgeComponent } from '@ui/badge/ui-badge.component';
import { IconComponent } from '@shared/icons/icon.component';

type FaqItem = { q: string; a: string };

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent, UiBadgeComponent, IconComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">

      <!-- ===== HEADER ===== -->
      <header class="sticky top-0 z-40 border-b border-gray-200 bg-surface/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">

          <a href="#inicio" class="flex items-center gap-2 font-display text-base font-semibold tracking-tight" aria-label="Pet Volta - Início">
            <app-icon name="paw" [size]="20" class="text-primary" />
            <span>Pet Volta</span>
          </a>

          <nav class="hidden flex-1 items-center justify-center gap-6 md:flex" aria-label="Menu principal">
            <a class="text-sm text-gray-600 transition-colors hover:text-primary" href="#como-funciona">Como funciona</a>
            <a class="text-sm text-gray-600 transition-colors hover:text-primary" href="#planos">Planos</a>
            <a class="text-sm text-gray-600 transition-colors hover:text-primary" href="#faq">FAQ</a>
          </nav>

          <div class="ml-auto hidden items-center gap-2 md:flex">
            <a routerLink="/auth/login">
              <ui-button variant="ghost" type="button" size="sm">Entrar</ui-button>
            </a>
            <a routerLink="/auth/register">
              <ui-button type="button" size="sm">Criar conta grátis</ui-button>
            </a>
          </div>

          <button
            type="button"
            class="ml-auto grid h-10 w-10 place-items-center rounded-pet-sm border border-gray-200 bg-white md:hidden"
            (click)="toggleMenu()"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="mobile-menu"
            aria-label="Abrir menu"
          >
            <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="18" />
          </button>
        </div>

        @if (menuOpen()) {
          <div id="mobile-menu" class="border-t border-gray-200 bg-surface">
            <div class="mx-auto grid max-w-6xl gap-3 px-4 py-4">
              <a class="text-sm text-gray-600 hover:text-primary" href="#como-funciona" (click)="closeMenu()">Como funciona</a>
              <a class="text-sm text-gray-600 hover:text-primary" href="#planos" (click)="closeMenu()">Planos</a>
              <a class="text-sm text-gray-600 hover:text-primary" href="#faq" (click)="closeMenu()">FAQ</a>
              <div class="grid gap-2 border-t border-gray-200 pt-3">
                <a routerLink="/auth/login" (click)="closeMenu()">
                  <ui-button variant="ghost" type="button" [className]="'w-full'">Entrar</ui-button>
                </a>
                <a routerLink="/auth/register" (click)="closeMenu()">
                  <ui-button type="button" [className]="'w-full'">Criar conta grátis</ui-button>
                </a>
              </div>
            </div>
          </div>
        }
      </header>

      <!-- ===== HERO ===== -->
      <section id="inicio" class="overflow-hidden bg-surface">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:py-24">

          <div>
            <ui-badge variant="primary">Plataforma de segurança pet</ui-badge>
            <h1 class="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-text md:text-5xl lg:text-6xl">
              Seu pet volta para casa <span class="text-primary">mais rápido</span>.
            </h1>
            <p class="mt-5 text-base leading-relaxed text-gray-600 md:text-lg">
              Perfil digital + tag QR: quem encontra o seu pet escaneia, e você recebe a notificação em segundos.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="/auth/register">
                <ui-button type="button" size="lg">Começar Grátis</ui-button>
              </a>
              <a href="#planos">
                <ui-button variant="ghost" type="button" size="lg">Conhecer planos</ui-button>
              </a>
            </div>

            <div class="mt-8 flex items-center gap-3">
              <div class="flex items-center gap-1">
                @for (s of [1,2,3,4,5]; track s) {
                  <app-icon name="heart" [size]="14" class="text-secondary" />
                }
              </div>
              <p class="text-sm text-gray-500">Usado por tutores em todo o Brasil</p>
            </div>
          </div>

          <div class="flex justify-center">
            <div class="relative w-full max-w-md">
              <div class="absolute -inset-4 rounded-pet bg-gradient-green opacity-10"></div>
              <img
                src="/hero.png"
                alt="Pet feliz e seguro com a tag QR Pet Volta"
                class="relative w-full rounded-pet object-cover shadow-pet-md"
              />
            </div>
          </div>

        </div>
      </section>

      <!-- ===== COMO FUNCIONA ===== -->
      <section id="como-funciona" class="bg-white">
        <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div class="text-center">
            <p class="font-mono text-xs font-medium uppercase tracking-widest text-primary">Simples assim</p>
            <h2 class="mt-3 font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              O jeito mais fácil de proteger seu pet
            </h2>
            <p class="mx-auto mt-3 max-w-xl text-gray-600">
              Em três passos, seu pet tem um perfil digital seguro e você fica tranquilo em qualquer passeio.
            </p>
          </div>

          <div class="mt-12 grid gap-6 md:grid-cols-3">
            @for (step of howItWorks(); track step.title) {
              <ui-card [className]="'p-6 shadow-pet'">
                <div class="flex h-12 w-12 items-center justify-center rounded-pet-sm bg-primary/10">
                  <app-icon [name]="step.icon" [size]="22" class="text-primary" />
                </div>
                <p class="mt-4 font-mono text-xs font-semibold tracking-widest text-primary">{{ step.step }}</p>
                <h3 class="mt-1 font-display text-lg font-semibold text-text">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ step.desc }}</p>
              </ui-card>
            }
          </div>
        </div>
      </section>

      <!-- ===== FEATURE: QR CODE ===== -->
      <section class="bg-surface">
        <div class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">

          <div class="order-2 flex justify-center md:order-1">
            <div class="flex h-72 w-72 flex-col items-center justify-center gap-6 rounded-pet bg-gradient-green p-8 shadow-pet-md">
              <app-icon name="qr-code" [size]="80" class="text-white" />
              <div class="text-center">
                <p class="font-display text-sm font-semibold text-white">Tag QR Pet Volta</p>
                <p class="mt-1 text-xs text-white/70">Escaneie para ver o perfil</p>
              </div>
            </div>
          </div>

          <div class="order-1 md:order-2">
            <ui-badge variant="primary">Tag QR inteligente</ui-badge>
            <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Conecte qualquer pessoa ao seu pet, em segundos.
            </h2>
            <p class="mt-4 text-gray-600">
              Qualquer pessoa com um celular pode escanear a tag e ver as informações do seu pet — sem precisar de app ou cadastro.
            </p>

            <ul class="mt-6 space-y-3">
              @for (f of qrFeatures(); track f) {
                <li class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <app-icon name="check" [size]="12" class="text-primary" />
                  </div>
                  <span class="text-sm text-gray-700">{{ f }}</span>
                </li>
              }
            </ul>

            <div class="mt-8">
              <a routerLink="/auth/register">
                <ui-button type="button">Ativar minha tag QR</ui-button>
              </a>
            </div>
          </div>

        </div>
      </section>

      <!-- ===== FEATURES GRID ===== -->
      <section class="bg-white">
        <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div class="max-w-2xl">
            <p class="font-mono text-xs font-medium uppercase tracking-widest text-primary">Plataforma completa</p>
            <h2 class="mt-3 font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Tudo que você precisa para cuidar do seu pet
            </h2>
            <p class="mt-3 text-gray-600">
              Do perfil digital ao histórico de saúde, o Pet Volta centraliza o cuidado com o seu melhor amigo.
            </p>
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (feat of features(); track feat.title) {
              <div class="flex items-start gap-4 rounded-pet-sm border border-gray-200 bg-white p-5 transition-shadow hover:shadow-pet">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-pet-sm bg-primary/10">
                  <app-icon [name]="feat.icon" [size]="20" class="text-primary" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-text">{{ feat.title }}</h3>
                  <p class="mt-1 text-xs leading-relaxed text-gray-600">{{ feat.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ===== PLANOS ===== -->
      <section id="planos" class="bg-surface">
        <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div class="text-center">
            <p class="font-mono text-xs font-medium uppercase tracking-widest text-primary">Preços</p>
            <h2 class="mt-3 font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Planos que cabem no seu cuidado
            </h2>
            <p class="mx-auto mt-3 max-w-xl text-gray-600">
              Comece grátis e evolua quando precisar de mais tags, pets e recursos.
            </p>
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (plan of plans(); track plan.name) {
              <div
                class="relative flex flex-col rounded-pet border border-gray-200 bg-white p-5 transition-shadow hover:shadow-pet"
                [class.border-primary]="plan.highlight"
                [class.shadow-pet]="plan.highlight"
              >
                @if (plan.badge) {
                  <div class="mb-3">
                    <ui-badge variant="secondary">{{ plan.badge }}</ui-badge>
                  </div>
                }
                <div>
                  <p class="font-display text-base font-semibold text-text">{{ plan.name }}</p>
                  <p class="mt-0.5 text-xs text-gray-500">{{ plan.subtitle }}</p>
                </div>
                <div class="mt-4">
                  <p class="font-display text-3xl font-semibold text-text">{{ plan.price }}</p>
                  <p class="text-xs text-gray-500">{{ plan.period }}</p>
                </div>

                <ul class="mt-5 flex-1 space-y-2.5">
                  @for (f of plan.features; track f.text) {
                    <li class="flex items-start gap-2">
                      <app-icon [name]="f.ok ? 'check' : 'x'" [size]="14" class="mt-0.5 shrink-0" [class.text-primary]="f.ok" [class.text-gray-300]="!f.ok" />
                      <span class="text-xs text-gray-700" [class.text-gray-400]="!f.ok">{{ f.text }}</span>
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

      <!-- ===== DEPOIMENTOS ===== -->
      <section class="bg-white">
        <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div class="text-center">
            <p class="font-mono text-xs font-medium uppercase tracking-widest text-primary">Depoimentos</p>
            <h2 class="mt-3 font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Tutores que confiam no Pet Volta
            </h2>
          </div>

          <div class="mt-10 grid gap-4 md:grid-cols-3">
            @for (t of testimonials(); track t.name) {
              <ui-card [className]="'p-6 shadow-pet'">
                <div class="flex items-center gap-1">
                  @for (s of [1,2,3,4,5]; track s) {
                    <app-icon name="heart" [size]="12" class="text-secondary" />
                  }
                </div>
                <blockquote class="mt-3 text-sm leading-relaxed text-gray-700">"{{ t.quote }}"</blockquote>
                <figcaption class="mt-4 flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <app-icon name="user" [size]="16" class="text-primary" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-text">{{ t.name }}</p>
                    <p class="text-xs text-gray-500">{{ t.city }}</p>
                  </div>
                </figcaption>
              </ui-card>
            }
          </div>
        </div>
      </section>

      <!-- ===== EXPERTISE / TRUST ===== -->
      <section class="bg-gradient-green">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p class="font-mono text-xs font-medium uppercase tracking-widest text-white/70">Missão</p>
            <h2 class="mt-3 font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
              Feito com cuidado para trazer pets de volta pra casa.
            </h2>
            <p class="mt-4 text-white/80">
              O Pet Volta nasceu da dor de perder um pet. Nossa missão é usar tecnologia simples para reconectar famílias ao seu melhor amigo o mais rápido possível.
            </p>
            <div class="mt-8">
              <a routerLink="/auth/register">
                <ui-button type="button" [className]="'border border-white/40 bg-white/10 text-white hover:bg-white/20'">
                  Começar agora, é grátis
                </ui-button>
              </a>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            @for (stat of stats(); track stat.label) {
              <div class="rounded-pet bg-white/10 p-5">
                <p class="font-display text-3xl font-semibold text-white">{{ stat.value }}</p>
                <p class="mt-1 text-sm text-white/70">{{ stat.label }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ===== FAQ ===== -->
      <section id="faq" class="bg-surface">
        <div class="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <div class="text-center">
            <p class="font-mono text-xs font-medium uppercase tracking-widest text-primary">Dúvidas</p>
            <h2 class="mt-3 font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Perguntas frequentes
            </h2>
          </div>

          <div class="mt-10 divide-y divide-gray-200 rounded-pet border border-gray-200 bg-white">
            @for (item of faq(); track item.q) {
              <details class="group px-6 py-5">
                <summary class="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-text outline-none">
                  <span>{{ item.q }}</span>
                  <app-icon name="chevron-right" [size]="16" class="ml-4 shrink-0 rotate-90 text-gray-400 transition-transform group-open:rotate-[270deg]" />
                </summary>
                <p class="mt-3 text-sm leading-relaxed text-gray-600">{{ item.a }}</p>
              </details>
            }
          </div>
        </div>
      </section>

      <!-- ===== CTA FINAL ===== -->
      <section class="bg-white">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center md:py-20">
          <ui-badge variant="primary">Grátis para começar</ui-badge>
          <h2 class="font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
            Seu pet merece essa segurança.
          </h2>
          <p class="max-w-md text-gray-600">
            Cadastre seu pet agora e tenha um perfil público protegido em menos de 5 minutos.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <a routerLink="/auth/register">
              <ui-button size="lg" type="button">Criar conta grátis</ui-button>
            </a>
            <a href="#planos">
              <ui-button size="lg" variant="ghost" type="button">Ver planos</ui-button>
            </a>
          </div>
        </div>
      </section>

      <!-- ===== FOOTER ===== -->
      <footer class="bg-gray-900">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">

          <div class="md:col-span-1">
            <div class="flex items-center gap-2">
              <app-icon name="paw" [size]="18" class="text-accent" />
              <p class="font-display text-lg font-semibold text-white">Pet Volta</p>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-gray-400">
              Um jeito simples e rápido de reconectar você ao seu melhor amigo.
            </p>
          </div>

          <div class="grid content-start gap-2 text-sm text-gray-400">
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Produto</p>
            <a class="transition-colors hover:text-white" href="#como-funciona">Como funciona</a>
            <a class="transition-colors hover:text-white" href="#planos">Planos</a>
            <a class="transition-colors hover:text-white" routerLink="/auth/register">Começar</a>
          </div>

          <div class="grid content-start gap-2 text-sm text-gray-400">
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Suporte</p>
            <a class="transition-colors hover:text-white" href="#faq">FAQ</a>
            <a class="transition-colors hover:text-white" routerLink="/auth/login">Entrar</a>
          </div>

          <div class="grid content-start gap-2 text-sm text-gray-400">
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Legal</p>
            <a class="transition-colors hover:text-white" routerLink="/legal/terms">Termos de uso</a>
            <a class="transition-colors hover:text-white" routerLink="/legal/privacy">Privacidade</a>
            <a class="transition-colors hover:text-white" routerLink="/legal/lgpd">LGPD</a>
          </div>

        </div>

        <div class="border-t border-gray-800">
          <div class="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
            &copy; {{ year() }} Pet Volta — feito com carinho para trazer pets de volta pra casa.
          </div>
        </div>
      </footer>

    </main>
  `,
})
export class LandingComponent {
  private readonly titleSvc = inject(Title);
  private readonly meta = inject(Meta);

  menuOpen = signal(false);
  year = computed(() => new Date().getFullYear());

  constructor() {
    this.titleSvc.setTitle('Pet Volta — Tag QR e perfil digital para segurança do seu pet');
    this.meta.updateTag({ name: 'description', content: 'Segurança pet com tag QR: quem encontra escaneia, você recebe notificação. Comece grátis.' });
    this.meta.updateTag({ property: 'og:title', content: 'Pet Volta' });
    this.meta.updateTag({ property: 'og:description', content: 'Tag QR + perfil digital para ajudar seu pet a voltar pra casa.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: '/hero.png' });
  }

  toggleMenu() { this.menuOpen.update((v) => !v); }
  closeMenu() { this.menuOpen.set(false); }

  howItWorks = computed(() => [
    { step: '01', icon: 'paw' as const, title: 'Cadastre seu pet', desc: 'Crie o perfil do seu pet em minutos com foto, espécie e informações de contato.' },
    { step: '02', icon: 'qr-code' as const, title: 'Ative a tag QR', desc: 'Vincule uma tag QR física ao perfil digital do seu pet nos planos pagos.' },
    { step: '03', icon: 'bell' as const, title: 'Receba alertas', desc: 'Notificação imediata quando alguém encontrar e escanear a tag do seu pet.' },
  ]);

  qrFeatures = computed(() => [
    'Funciona com qualquer celular — sem precisar de app',
    'Perfil público com nome, foto e contatos de emergência',
    'Notificação instantânea para o tutor ao escanear',
    'Página de encontrado com mapa de localização aproximada',
    'Modo perdido com recompensa visível no perfil',
  ]);

  features = computed(() => [
    { icon: 'user' as const, title: 'Perfil digital do pet', desc: 'Foto, nome, espécie, raça e informações de contato acessíveis por QR.' },
    { icon: 'qr-code' as const, title: 'Tag QR física', desc: 'Tag durável para coleira, vinculada ao perfil digital (planos pagos).' },
    { icon: 'bell' as const, title: 'Notificação de scan', desc: 'Alerta em tempo real quando alguém escanear a tag do seu pet.' },
    { icon: 'heart' as const, title: 'Histórico de saúde', desc: 'Registre vacinas, consultas e anotações médicas em um só lugar.' },
    { icon: 'calendar' as const, title: 'Lembretes', desc: 'Nunca mais esqueça vacinas, vermífugos ou consultas de rotina.' },
    { icon: 'shield' as const, title: 'Modo perdido', desc: 'Ative o alerta de pet perdido e exiba recompensa no perfil público.' },
  ]);

  plans = computed(() => [
    {
      name: 'Digital',
      subtitle: 'Grátis para sempre',
      badge: null as string | null,
      price: 'R$ 0',
      period: 'sem custo',
      highlight: false,
      cta: 'Começar Grátis',
      ctaVariant: 'primary' as const,
      features: [
        { ok: true, text: '1 pet cadastrado' },
        { ok: true, text: '1 foto por pet' },
        { ok: true, text: 'Perfil público do pet' },
        { ok: false, text: 'Tag QR física' },
        { ok: false, text: 'Notificação de scan' },
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
        { ok: true, text: '1 pet cadastrado' },
        { ok: true, text: '2 fotos por pet' },
        { ok: true, text: 'Tag QR inclusa' },
        { ok: true, text: 'Notificação de scan' },
        { ok: false, text: 'Histórico de saúde' },
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
        { ok: true, text: 'Notificação de scan' },
        { ok: true, text: 'Histórico de saúde' },
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
        { ok: true, text: 'Notificação de scan' },
        { ok: true, text: 'Recursos prioritários' },
      ],
    },
  ]);

  testimonials = computed(() => [
    { quote: 'A ideia da tag QR é genial. Me sinto muito mais segura nos passeios com a Luna.', name: 'Camila S.', city: 'Campinas, SP' },
    { quote: 'Interface rápida e simples. Em menos de 5 minutos o perfil do meu gato estava pronto.', name: 'Rafael M.', city: 'Rio de Janeiro, RJ' },
    { quote: 'Gostei muito do foco em privacidade. Só o essencial para ajudar de verdade.', name: 'Juliana P.', city: 'Curitiba, PR' },
  ]);

  stats = computed(() => [
    { value: '1 min', label: 'para criar o perfil do pet' },
    { value: '100%', label: 'gratuito para começar' },
    { value: 'QR', label: 'funciona em qualquer celular' },
    { value: '24/7', label: 'perfil disponível sempre' },
  ]);

  faq = computed<FaqItem[]>(() => [
    { q: 'Como funciona a tag QR?', a: 'A tag possui um QR Code com um link para o perfil do seu pet. Quem encontra o pet escaneia com qualquer celular e acessa uma página com informações e contato — sem precisar de app.' },
    { q: 'Meus dados estão seguros?', a: 'Sim. O acesso aos seus dados é protegido por autenticação e regras de segurança no banco (RLS). Você controla o que aparece no perfil público do pet.' },
    { q: 'Posso cancelar quando quiser?', a: 'Sim. No MVP, os planos pagos ainda estão em preparação. O cancelamento será sempre simples e sem burocracia.' },
    { q: 'O que é o modo perdido?', a: 'Quando ativado, o perfil público do pet exibe informações extras e pode mostrar uma recompensa para quem encontrar.' },
    { q: 'Existe limite de pets?', a: 'Varia por plano: Digital 1, Essential 1, Elite 3, Guardian 5.' },
    { q: 'A tag funciona sem internet?', a: 'O QR em si não precisa de internet para ser escaneado, mas a página do perfil requer conexão para carregar as informações e enviar a notificação.' },
    { q: 'Como funciona a recompensa?', a: 'O valor é exibido no perfil público quando o pet está no modo perdido. O pagamento não é processado pela plataforma no MVP.' },
    { q: "A tag é resistente à água?", a: 'A tag física será desenvolvida para uso diário em coleiras. Detalhes do material serão informados no lançamento físico.' },
  ]);
}
