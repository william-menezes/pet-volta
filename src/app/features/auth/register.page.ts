import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiToastService } from '@ui/toast/ui-toast.service';
import { IconComponent } from '@shared/icons/icon.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, IconComponent],
  template: `
    <main class="flex min-h-dvh bg-surface">

      <!-- ===== COLUNA ESQUERDA: FORMULÁRIO ===== -->
      <div class="flex w-full flex-col justify-center px-6 py-12 sm:px-10 md:w-[460px] md:shrink-0">

        <div class="mx-auto w-full max-w-sm">

          <!-- Logo -->
          <a routerLink="/" class="mb-8 flex items-center gap-2">
            <app-icon name="paw" [size]="22" class="text-primary" />
            <span class="font-display text-lg font-semibold text-text">Pet Volta</span>
          </a>

          <h1 class="font-display text-2xl font-semibold text-text">Criar conta grátis</h1>
          <p class="mt-1.5 text-sm text-gray-500">
            Seu plano começa no <strong class="text-text">Digital</strong> — sem custo, sem cartão.
          </p>

          <!-- Google -->
          <button
            type="button"
            class="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-sm font-medium text-text transition-shadow hover:shadow-pet disabled:pointer-events-none disabled:opacity-50"
            (click)="google()"
            [disabled]="loading"
          >
            <!-- Google "G" icon -->
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <!-- Divisor -->
          <div class="my-5 flex items-center gap-3">
            <div class="h-px flex-1 bg-gray-200"></div>
            <span class="text-xs text-gray-400">ou com e-mail</span>
            <div class="h-px flex-1 bg-gray-200"></div>
          </div>

          <!-- Formulário -->
          <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">

            <div>
              <label class="mb-1.5 block text-sm font-medium text-text" for="fullName">Nome completo</label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                autocomplete="name"
                placeholder="Seu nome"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-text" for="email">E-mail</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="voce@exemplo.com"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-text" for="password">Senha</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Mínimo 6 caracteres"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-text" for="confirmPassword">Confirmar senha</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                placeholder="Repita a senha"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Criando conta…' : 'Criar conta grátis' }}
            </ui-button>

          </form>

          <!-- Termos -->
          <p class="mt-4 text-center text-xs text-gray-400">
            Ao criar sua conta você concorda com os
            <a routerLink="/legal/terms" class="text-primary hover:underline">Termos de Uso</a>
            e a
            <a routerLink="/legal/privacy" class="text-primary hover:underline">Política de Privacidade</a>.
          </p>

          <!-- Link para login -->
          <p class="mt-6 text-center text-sm text-gray-500">
            Já tem conta?
            <a class="font-medium text-primary hover:underline" routerLink="/auth/login">Entrar</a>
          </p>

        </div>
      </div>

      <!-- ===== COLUNA DIREITA: GRADIENTE ===== -->
      <div class="hidden flex-1 flex-col justify-center bg-gradient-green px-12 md:flex">
        <div class="max-w-md">

          <div class="flex items-center gap-2">
            <app-icon name="shield" [size]="32" class="text-white/80" />
          </div>

          <h2 class="mt-6 font-display text-3xl font-semibold leading-tight text-white lg:text-4xl">
            Proteja seu pet com um perfil digital completo.
          </h2>
          <p class="mt-4 text-base leading-relaxed text-white/75">
            Em menos de 5 minutos, seu pet tem um perfil com foto, contatos de emergência e tag QR pronta para uso.
          </p>

          <!-- Checklist de benefícios -->
          <ul class="mt-8 space-y-4">
            @for (item of benefits; track item) {
              <li class="flex items-start gap-3">
                <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <app-icon name="check" [size]="12" class="text-white" />
                </div>
                <span class="text-sm text-white/85">{{ item }}</span>
              </li>
            }
          </ul>

          <!-- Mini card de plano Digital -->
          <div class="mt-10 rounded-pet bg-white/10 p-5">
            <div class="flex items-center gap-2">
              <app-icon name="paw" [size]="16" class="text-white/70" />
              <p class="text-sm font-semibold text-white">Plano Digital — Grátis</p>
            </div>
            <ul class="mt-3 space-y-2">
              @for (f of freeFeatures; track f) {
                <li class="flex items-center gap-2 text-xs text-white/70">
                  <app-icon name="check" [size]="12" class="text-white/50" />
                  {{ f }}
                </li>
              }
            </ul>
            <p class="mt-3 text-xs text-white/50">Evolua para planos pagos quando precisar de tag QR.</p>
          </div>

        </div>
      </div>

    </main>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToastService);

  loading = false;

  readonly benefits = [
    'Perfil digital do pet acessível por QR em qualquer celular',
    'Notificação imediata quando a tag for escaneada',
    'Histórico de saúde, lembretes de vacinas e consultas',
    'Modo perdido com alerta e recompensa no perfil público',
  ];

  readonly freeFeatures = [
    '1 pet cadastrado',
    '1 foto por pet',
    'Perfil público do pet',
    'Link compartilhável',
  ];

  form = this.fb.group({
    fullName: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  async submit() {
    if (this.form.invalid || this.loading) return;
    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.toast.show({ message: 'As senhas não conferem.', kind: 'warning' });
      return;
    }

    this.loading = true;
    try {
      const { data, error } = await this.auth.signUp({
        fullName: raw.fullName,
        email: raw.email,
        password: raw.password,
      });

      if (error) {
        this.toast.show({ message: 'Não foi possível criar sua conta.', kind: 'danger' });
        return;
      }

      if (data.session) {
        await this.router.navigateByUrl('/dashboard');
        return;
      }

      this.toast.show({
        message: 'Conta criada. Verifique seu e-mail para confirmar e então faça login.',
        kind: 'success',
      });
      await this.router.navigateByUrl('/auth/login');
    } finally {
      this.loading = false;
    }
  }

  async google() {
    if (this.loading) return;
    this.loading = true;
    try {
      const { error } = await this.auth.signInWithGoogle();
      if (error) {
        this.toast.show({ message: 'Não foi possível continuar com o Google.', kind: 'danger' });
      }
    } catch {
      this.toast.show({ message: 'Não foi possível continuar com o Google.', kind: 'danger' });
    } finally {
      this.loading = false;
    }
  }
}
