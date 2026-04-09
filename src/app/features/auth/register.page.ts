import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiCardComponent],
  template: `
    <main class="min-h-dvh bg-gradient-green">
      <section class="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <ui-card [className]="'w-full p-6'">
          <p class="font-mono text-xs text-gray-500">🐾 Pet Volta</p>
          <h1 class="mt-2 font-display text-2xl font-semibold text-text">Criar conta</h1>
          <p class="mt-1 text-sm text-gray-600">
            Seu plano começa no <strong>Digital</strong> (grátis).
          </p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="fullName">
                Nome
              </label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                autocomplete="name"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

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
                autocomplete="new-password"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="confirmPassword">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Criando…' : 'Criar conta' }}
            </ui-button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-600">
            Já tem conta?
            <a class="text-primary hover:underline" routerLink="/auth/login">Entrar</a>
          </p>
        </ui-card>
      </section>
    </main>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToastService);

  loading = false;

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
}
