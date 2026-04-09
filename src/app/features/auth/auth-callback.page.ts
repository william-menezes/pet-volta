import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';

@Component({
  selector: 'app-auth-callback-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <section class="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <div class="w-full rounded-pet border border-gray-200 bg-white p-6">
          <p class="font-mono text-xs text-gray-500">🐾 Pet Volta</p>
          <h1 class="mt-2 font-display text-xl font-semibold text-text">
            Concluindo login…
          </h1>
          <p class="mt-2 text-sm text-gray-600">Aguarde um instante.</p>
        </div>
      </section>
    </main>
  `,
})
export class AuthCallbackPage {
  private readonly supabase = inject(SupabaseClientService);
  private readonly router = inject(Router);

  constructor() {
    void this.finish();
  }

  private async finish() {
    await this.supabase.supabase().auth.getSession();
    const redirectTo =
      sessionStorage.getItem('pv_post_auth_redirect') || '/dashboard';
    sessionStorage.removeItem('pv_post_auth_redirect');
    await this.router.navigateByUrl(redirectTo);
  }
}
