import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { IconComponent, IconName } from '@shared/icons/icon.component';

type NavItem = { label: string; icon: IconName; to: string; exact?: boolean };

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <div class="flex min-h-dvh">

        <!-- Sidebar (desktop) -->
        <aside class="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
          <div class="px-5 py-5">
            <a routerLink="/dashboard" class="flex items-center gap-2">
              <app-icon name="shield" [size]="22" class="text-primary" />
              <span class="font-display text-base font-semibold text-text">Pet Volta</span>
            </a>
          </div>

          <nav class="flex flex-1 flex-col gap-0.5 px-3 py-2">
            @for (item of navItems; track item.to) {
              <a
                [routerLink]="item.to"
                routerLinkActive="bg-primary/10 text-primary"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                class="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-text"
              >
                <app-icon [name]="item.icon" [size]="18" />
                <span class="font-medium">{{ item.label }}</span>
              </a>
            }
          </nav>

          <div class="border-t border-gray-200 px-5 py-4">
            <p class="truncate text-xs text-gray-500">{{ userEmail() ?? '' }}</p>
            <button
              type="button"
              class="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-danger"
              (click)="logout()"
            >
              <app-icon name="logout" [size]="16" />
              Sair
            </button>
          </div>
        </aside>

        <!-- Conteúdo -->
        <div class="flex min-w-0 flex-1 flex-col">

          <!-- Topbar mobile -->
          <header class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
            <button
              type="button"
              class="rounded-full border border-gray-200 bg-white p-2"
              (click)="mobileOpen.set(true)"
              aria-label="Abrir menu"
            >
              <app-icon name="menu" [size]="18" />
            </button>
            <a routerLink="/dashboard" class="flex items-center gap-1.5">
              <app-icon name="shield" [size]="18" class="text-primary" />
              <span class="font-display text-sm font-semibold text-text">Pet Volta</span>
            </a>
            <a routerLink="/dashboard/settings" aria-label="Configurações" class="rounded-full border border-gray-200 bg-white p-2 text-gray-600">
              <app-icon name="settings" [size]="18" />
            </a>
          </header>

          <div class="flex-1">
            <router-outlet />
          </div>
        </div>
      </div>

      <!-- Drawer mobile -->
      @if (mobileOpen()) {
        <div class="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            class="absolute inset-0 bg-black/30"
            (click)="mobileOpen.set(false)"
            aria-label="Fechar menu"
          ></button>
          <div class="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">

            <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <a routerLink="/dashboard" class="flex items-center gap-2" (click)="mobileOpen.set(false)">
                <app-icon name="shield" [size]="20" class="text-primary" />
                <span class="font-display text-sm font-semibold text-text">Pet Volta</span>
              </a>
              <button
                type="button"
                class="rounded-full border border-gray-200 p-1.5 text-gray-500"
                (click)="mobileOpen.set(false)"
              >
                <app-icon name="x" [size]="16" />
              </button>
            </div>

            <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
              @for (item of navItems; track item.to) {
                <a
                  [routerLink]="item.to"
                  routerLinkActive="bg-primary/10 text-primary"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  class="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-text"
                  (click)="mobileOpen.set(false)"
                >
                  <app-icon [name]="item.icon" [size]="18" />
                  <span class="font-medium">{{ item.label }}</span>
                </a>
              }
            </nav>

            <div class="border-t border-gray-200 px-5 py-4">
              <p class="truncate text-xs text-gray-500">{{ userEmail() ?? '' }}</p>
              <button
                type="button"
                class="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-danger"
                (click)="logout()"
              >
                <app-icon name="logout" [size]="16" />
                Sair
              </button>
            </div>
          </div>
        </div>
      }
    </main>
  `,
})
export class DashboardLayout {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);
  readonly userEmail = computed(() => this.supabase.currentUser()?.email ?? null);

  readonly navItems: NavItem[] = [
    { label: 'Início',        icon: 'home',         to: '/dashboard',           exact: true },
    { label: 'Meus Pets',     icon: 'paw',          to: '/dashboard/pets' },
    { label: 'Lembretes',     icon: 'bell',         to: '/dashboard/reminders' },
    { label: 'Nutrição',      icon: 'food',         to: '/dashboard/nutrition' },
    { label: 'Veterinários',  icon: 'stethoscope',  to: '/dashboard/vets' },
    { label: 'Planos',        icon: 'credit-card',  to: '/dashboard/pricing' },
    { label: 'Configurações', icon: 'settings',     to: '/dashboard/settings' },
  ];

  logout() {
    void this.auth.signOut().then(() => this.router.navigateByUrl('/auth/login'));
  }
}
