import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent],
  template: `
    <main class="min-h-dvh bg-white">
      <header class="border-b border-gray-100">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a routerLink="/" class="font-display text-lg font-semibold text-text">
            🐾 Pet Volta
          </a>
          <ui-button variant="ghost" type="button" (click)="logout()">
            Sair
          </ui-button>
        </div>
      </header>

      <section class="mx-auto max-w-5xl px-4 py-10">
        <ui-card [className]="'p-6'">
          <h1 class="font-display text-2xl font-semibold text-text">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-600">
            MVP: área vazia por enquanto (Fase 2+).
          </p>

          <div class="mt-6 grid gap-3 text-sm text-gray-700">
            <div>
              <span class="font-medium text-text">Usuário:</span>
              <span class="ml-2">{{ userEmail() || '—' }}</span>
            </div>
          </div>
        </ui-card>
      </section>
    </main>
  `,
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);

  userEmail = computed(() => this.supabase.currentUser()?.email ?? null);

  async logout() {
    await this.auth.signOut();
  }
}
