import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiCardComponent],
  template: `
    <main class="min-h-dvh bg-gradient-green">
      <section class="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <ui-card [className]="'w-full p-6'">
          <h1 class="font-display text-2xl font-semibold text-text">Nova senha</h1>
          <p class="mt-1 text-sm text-gray-600">Defina uma nova senha para sua conta.</p>

          @if (checkingLink()) {
            <div class="mt-6 text-sm text-gray-600">Validando link…</div>
          } @else if (!hasRecoverySession()) {
            <div class="mt-6 rounded-pet border border-gray-200 bg-white p-4 text-sm text-gray-700">
              Este link de recuperação é inválido ou expirou. Solicite um novo link.
            </div>
            <div class="mt-6">
              <a routerLink="/auth/forgot">
                <ui-button [className]="'w-full'" type="button">Solicitar novo link</ui-button>
              </a>
            </div>
          } @else {
            <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
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

              <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Salvando…' : 'Salvar senha' }}
              </ui-button>
            </form>
          }

          <p class="mt-6 text-center text-sm text-gray-600">
            <a class="text-primary hover:underline" routerLink="/auth/login">Voltar</a>
          </p>
        </ui-card>
      </section>
    </main>
  `,
})
export class ResetPasswordPage {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToastService);

  loading = signal(false);
  checkingLink = signal(true);
  hasRecoverySession = signal(false);

  private readonly code = computed(() => this.route.snapshot.queryParamMap.get('code'));

  form = this.fb.group({
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  constructor() {
    void this.bootstrapRecoverySession();
  }

  private async bootstrapRecoverySession() {
    this.checkingLink.set(true);
    try {
      await this.supabase.supabase().auth.getSession();

      const code = this.code();
      if (code) {
        await this.supabase.supabase().auth.exchangeCodeForSession(code);
      }

      const hash = globalThis.location?.hash?.replace(/^#/, '') ?? '';
      if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await this.supabase.supabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }

      const { data } = await this.supabase.supabase().auth.getSession();
      this.hasRecoverySession.set(Boolean(data.session));
    } catch {
      this.hasRecoverySession.set(false);
    } finally {
      this.checkingLink.set(false);
    }
  }

  async submit() {
    if (this.form.invalid || this.loading()) return;
    if (!this.hasRecoverySession()) return;

    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.toast.show({ message: 'As senhas não conferem.', kind: 'warning' });
      return;
    }

    this.loading.set(true);
    try {
      const { error } = await this.auth.updatePassword(raw.password);
      if (error) {
        this.toast.show({ message: 'Não foi possível atualizar sua senha.', kind: 'danger' });
        return;
      }
      this.toast.show({ message: 'Senha atualizada com sucesso.', kind: 'success' });
      await this.router.navigateByUrl('/auth/login');
    } finally {
      this.loading.set(false);
    }
  }
}
