import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiToastService } from '@ui/toast/ui-toast.service';
import { IconComponent } from '@shared/icons/icon.component';

@Component({
  selector: 'app-login-page',
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

          <h1 class="font-display text-2xl font-semibold text-text">Bem-vindo de volta</h1>
          <p class="mt-1.5 text-sm text-gray-500">
            Entre na sua conta para gerenciar seus pets.
          </p>

          <!-- Formulário -->
          <form class="mt-7 space-y-4" [formGroup]="form" (ngSubmit)="submit()">

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
              <div class="mb-1.5 flex items-center justify-between">
                <label class="text-sm font-medium text-text" for="password">Senha</label>
                <a routerLink="/auth/forgot" class="text-xs text-primary hover:underline">Esqueci a senha</a>
              </div>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Entrando…' : 'Entrar' }}
            </ui-button>

          </form>

          <!-- Divisor -->
          <div class="my-5 flex items-center gap-3">
            <div class="h-px flex-1 bg-gray-200"></div>
            <span class="text-xs text-gray-400">ou continue com</span>
            <div class="h-px flex-1 bg-gray-200"></div>
          </div>

          <!-- Google -->
          <button
            type="button"
            class="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-sm font-medium text-text transition-shadow hover:shadow-pet disabled:pointer-events-none disabled:opacity-50"
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
            Entrar com Google
          </button>

          <!-- Link para registro -->
          <p class="mt-7 text-center text-sm text-gray-500">
            Ainda não tem conta?
            <a class="font-medium text-primary hover:underline" routerLink="/auth/register">Criar conta grátis</a>
          </p>

        </div>
      </div>

      <!-- ===== COLUNA DIREITA: GRADIENTE ===== -->
      <div class="hidden flex-1 flex-col justify-center bg-gradient-green px-12 md:flex">
        <div class="max-w-md">

          <div class="flex items-center gap-2">
            <app-icon name="paw" [size]="32" class="text-white/80" />
          </div>

          <h2 class="mt-6 font-display text-3xl font-semibold leading-tight text-white lg:text-4xl">
            Seu pet seguro, onde ele estiver.
          </h2>
          <p class="mt-4 text-base leading-relaxed text-white/75">
            Perfil digital + tag QR: quem encontra escaneia, você recebe o alerta em segundos.
          </p>

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

          <div class="mt-10 rounded-pet bg-white/10 p-5">
            <p class="text-sm italic text-white/80">
              "A tag QR salvou a Luna. Em menos de 1 hora ela estava de volta em casa."
            </p>
            <p class="mt-3 text-xs font-medium text-white/60">— Camila S., tutora de cão</p>
          </div>

        </div>
      </div>

    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToastService);

  loading = false;

  readonly benefits = [
    'Perfil digital do pet acessível por QR em qualquer celular',
    'Notificação instantânea quando a tag for escaneada',
    'Histórico de saúde, lembretes e muito mais',
    'Grátis para começar — sem cartão de crédito',
  ];

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  async submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    try {
      const { error } = await this.auth.signIn(this.form.getRawValue());
      if (error) {
        this.toast.show({ message: this.mapAuthError(error.message), kind: 'danger' });
        return;
      }
      const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'] ?? '/dashboard';
      await this.router.navigateByUrl(returnUrl);
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
        this.toast.show({ message: 'Não foi possível iniciar o login com Google.', kind: 'danger' });
      }
    } catch {
      this.toast.show({ message: 'Não foi possível iniciar o login com Google.', kind: 'danger' });
    } finally {
      this.loading = false;
    }
  }

  private mapAuthError(message: string) {
    if (/invalid login credentials/i.test(message)) return 'E-mail ou senha inválidos.';
    if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.';
    return 'Não foi possível entrar. Tente novamente.';
  }
}
