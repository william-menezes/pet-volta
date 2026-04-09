import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiCardComponent],
  template: `
    <main class="min-h-dvh bg-gradient-green">
      <section class="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <ui-card [className]="'w-full p-6'">
          <p class="font-mono text-xs text-gray-500">🐾 Pet Volta</p>
          <h1 class="mt-2 font-display text-2xl font-semibold text-text">Entrar</h1>
          <p class="mt-1 text-sm text-gray-600">
            Acesse seu dashboard para gerenciar seus pets.
          </p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Entrando…' : 'Entrar' }}
            </ui-button>
          </form>

          <div class="mt-4">
            <ui-button
              [className]="'w-full'"
              variant="ghost"
              type="button"
              (click)="google()"
              [disabled]="loading"
            >
              Entrar com Google
            </ui-button>
          </div>

          <div class="mt-6 flex items-center justify-between text-sm">
            <a class="text-primary hover:underline" routerLink="/auth/forgot">
              Esqueci minha senha
            </a>
            <a class="text-text hover:underline" routerLink="/auth/register">
              Criar conta
            </a>
          </div>
        </ui-card>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToastService);

  loading = false;

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

      const returnUrl =
        this.router.routerState.snapshot.root.queryParams['returnUrl'] ?? '/dashboard';
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
