import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiCardComponent],
  template: `
    <main class="min-h-dvh bg-gradient-to-br from-primary to-secondary">
      <section class="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <ui-card [className]="'w-full p-6'">
          <h1 class="font-display text-2xl font-semibold text-text">Recuperar senha</h1>
          <p class="mt-1 text-sm text-gray-600">
            Enviaremos um link para você criar uma nova senha.
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
                class="h-11 w-full rounded-pet-sm border border-gray-200 bg-white px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Enviando…' : 'Enviar link' }}
            </ui-button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-600">
            <a class="text-primary hover:underline" routerLink="/auth/login">Voltar</a>
          </p>
        </ui-card>
      </section>
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(UiToastService);

  loading = false;

  form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
  });

  async submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    try {
      const { error } = await this.auth.resetPassword(this.form.getRawValue().email);
      if (error) {
        this.toast.show({ message: 'Não foi possível enviar o e-mail de recuperação.', kind: 'danger' });
        return;
      }

      this.toast.show({ message: 'Link enviado! Confira seu e-mail.', kind: 'success' });
    } finally {
      this.loading = false;
    }
  }
}
