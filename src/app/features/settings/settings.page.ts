import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { PlanService } from '@core/plan/plan.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

type ProfileForm = {
  full_name: string;
  phone_primary: string;
  phone_emergency: string;
  city: string;
  state: string;
  show_phone: boolean;
};

@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TitleCasePipe, UiButtonComponent, UiCardComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <header class="hidden border-b border-gray-200 bg-white md:block">
        <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a routerLink="/dashboard" class="text-sm text-gray-600 hover:text-text">← Dashboard</a>
          <p class="font-display text-base font-semibold text-text">Configurações</p>
          <div></div>
        </div>
      </header>

      <section class="mx-auto max-w-3xl px-4 py-8">

        <!-- Abas de configurações -->
        <div class="mb-6 flex gap-2 overflow-x-auto">
          @for (tab of settingsTabs; track tab.id) {
            <button
              type="button"
              class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              [class]="activeTab() === tab.id
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'"
              (click)="activeTab.set(tab.id)"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- ===== ABA: PERFIL ===== -->
        @if (activeTab() === 'profile') {
          <ui-card [className]="'p-6'">
            <h2 class="font-display text-lg font-semibold text-text">Perfil do Tutor</h2>
            <p class="mt-1 text-sm text-gray-600">
              Estas informações são exibidas na página pública do seu pet quando houver contato.
            </p>

            @if (profileLoading()) {
              <div class="mt-6 flex flex-col gap-3">
                @for (i of [1,2,3,4]; track i) {
                  <div class="h-10 animate-pulse rounded-full bg-gray-200"></div>
                }
              </div>
            } @else {
              <form class="mt-6 flex flex-col gap-4" (submit)="$event.preventDefault(); saveProfile()">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700">Nome completo *</label>
                  <input
                    type="text"
                    required
                    class="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    [value]="form().full_name"
                    (input)="setField('full_name', $any($event.target).value)"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700">Telefone principal</label>
                  <input
                    type="tel"
                    class="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    [value]="form().phone_primary"
                    (input)="setField('phone_primary', $any($event.target).value)"
                    placeholder="+55 11 99999-9999"
                  />
                </div>

                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700">Telefone de emergência</label>
                  <input
                    type="tel"
                    class="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    [value]="form().phone_emergency"
                    (input)="setField('phone_emergency', $any($event.target).value)"
                    placeholder="+55 11 99999-9999"
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-700">Cidade</label>
                    <input
                      type="text"
                      class="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                      [value]="form().city"
                      (input)="setField('city', $any($event.target).value)"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-gray-700">Estado (UF)</label>
                    <input
                      type="text"
                      maxlength="2"
                      class="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm uppercase focus:border-primary focus:outline-none"
                      [value]="form().state"
                      (input)="setField('state', $any($event.target).value.toUpperCase())"
                      placeholder="SP"
                    />
                  </div>
                </div>

                <label class="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded accent-primary"
                    [checked]="form().show_phone"
                    (change)="setField('show_phone', $any($event.target).checked)"
                  />
                  <span class="text-sm text-gray-700">Exibir telefone na página pública do pet</span>
                </label>

                <ui-button type="submit" [className]="'rounded-full'" [disabled]="saving()">
                  {{ saving() ? 'Salvando…' : 'Salvar Perfil' }}
                </ui-button>
              </form>
            }
          </ui-card>
        }

        <!-- ===== ABA: NOTIFICAÇÕES ===== -->
        @if (activeTab() === 'notifications') {
          <ui-card [className]="'p-6'">
            <h2 class="font-display text-lg font-semibold text-text">Notificações</h2>
            <p class="mt-1 text-sm text-gray-600">Controle como e quando você é notificado sobre scans.</p>

            <div class="mt-6 flex flex-col gap-4">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-pet-sm border border-gray-200 bg-white p-4">
                <div>
                  <p class="text-sm font-medium text-text">E-mail de notificação</p>
                  <p class="text-xs text-gray-600">Receba um e-mail sempre que a tag do seu pet for escaneada.</p>
                </div>
                <input
                  type="checkbox"
                  class="h-5 w-5 rounded accent-primary"
                  [checked]="emailEnabled()"
                  (change)="toggleEmail($any($event.target).checked)"
                />
              </label>

              <div class="rounded-pet-sm border border-gray-200 bg-white p-4">
                <p class="text-sm font-medium text-text">Silenciar notificações</p>
                <p class="mt-1 text-xs text-gray-600">Pause temporariamente os alertas.</p>
                <div class="mt-3 flex gap-2">
                  @for (option of snoozeOptions; track option.label) {
                    <button
                      type="button"
                      class="rounded-full border border-gray-200 px-3 py-1 text-xs hover:border-primary hover:text-primary"
                      (click)="setSnooze(option.minutes)"
                    >
                      {{ option.label }}
                    </button>
                  }
                </div>
                @if (snoozeUntil()) {
                  <p class="mt-2 text-xs text-warning">
                    Silenciado até {{ formatDate(snoozeUntil()!) }}
                    <button type="button" class="ml-2 text-primary underline" (click)="clearSnooze()">Reativar</button>
                  </p>
                }
              </div>
            </div>
          </ui-card>
        }

        <!-- ===== ABA: CONTA ===== -->
        @if (activeTab() === 'account') {
          <ui-card [className]="'p-6'">
            <h2 class="font-display text-lg font-semibold text-text">Conta</h2>

            <div class="mt-4 rounded-pet-sm border border-gray-200 bg-white p-4">
              <p class="text-sm text-gray-700">
                <span class="font-medium text-text">E-mail:</span>
                {{ userEmail() ?? '—' }}
              </p>
              <p class="mt-1 text-sm text-gray-700">
                <span class="font-medium text-text">Plano:</span>
                {{ planService.currentPlan() | titlecase }}
              </p>
            </div>

            <div class="mt-6 rounded-pet-sm border border-danger/30 bg-danger/5 p-4">
              <h3 class="text-sm font-semibold text-danger">Excluir conta (LGPD)</h3>
              <p class="mt-1 text-xs text-gray-600">
                Todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
              </p>

              @if (!showDeleteAccountConfirm()) {
                <button
                  type="button"
                  class="mt-3 rounded-full border border-danger px-4 py-2 text-xs font-medium text-danger hover:bg-danger hover:text-white"
                  (click)="showDeleteAccountConfirm.set(true)"
                >
                  Solicitar exclusão de conta
                </button>
              } @else {
                <div class="mt-3">
                  <p class="text-xs font-medium text-danger">Tem certeza? Digite "EXCLUIR" para confirmar:</p>
                  <input
                    type="text"
                    class="mt-2 w-full rounded-full border border-danger px-4 py-2 text-sm focus:outline-none"
                    [value]="deleteConfirmText()"
                    (input)="deleteConfirmText.set($any($event.target).value)"
                    placeholder="EXCLUIR"
                  />
                  <div class="mt-3 flex gap-2">
                    <button
                      type="button"
                      class="rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-600"
                      (click)="showDeleteAccountConfirm.set(false); deleteConfirmText.set('')"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="rounded-full bg-danger px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
                      [disabled]="deleteConfirmText() !== 'EXCLUIR' || deletingAccount()"
                      (click)="deleteAccount()"
                    >
                      {{ deletingAccount() ? 'Excluindo…' : 'Excluir definitivamente' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </ui-card>
        }

      </section>
    </main>
  `,
})
export class SettingsPage {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(UiToastService);
  readonly planService = inject(PlanService);

  activeTab = signal<'profile' | 'notifications' | 'account'>('profile');
  saving = signal(false);
  profileLoading = signal(true);
  emailEnabled = signal(true);
  snoozeUntil = signal<string | null>(null);
  showDeleteAccountConfirm = signal(false);
  deleteConfirmText = signal('');
  deletingAccount = signal(false);

  settingsTabs = [
    { id: 'profile' as const, label: 'Perfil' },
    { id: 'notifications' as const, label: 'Notificações' },
    { id: 'account' as const, label: 'Conta' },
  ];

  snoozeOptions = [
    { label: '1 hora', minutes: 60 },
    { label: '8 horas', minutes: 480 },
    { label: '24 horas', minutes: 1440 },
  ];

  form = signal<ProfileForm>({
    full_name: '',
    phone_primary: '',
    phone_emergency: '',
    city: '',
    state: '',
    show_phone: true,
  });

  userEmail = computed(() => this.supabase.currentUser()?.email ?? null);

  constructor() {
    void this.loadProfile();
    void this.loadNotificationPrefs();
  }

  setField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  async loadProfile() {
    this.profileLoading.set(true);
    try {
      const userId = this.supabase.currentUser()?.id;
      if (!userId) return;

      const { data } = await this.supabase
        .supabase()
        .from('profiles')
        .select('full_name, phone_primary, phone_emergency, city, state, show_phone')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        this.form.set({
          full_name: data.full_name ?? '',
          phone_primary: data.phone_primary ?? '',
          phone_emergency: data.phone_emergency ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          show_phone: data.show_phone ?? true,
        });
      }
    } finally {
      this.profileLoading.set(false);
    }
  }

  async loadNotificationPrefs() {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    const { data } = await this.supabase
      .supabase()
      .from('notification_prefs')
      .select('email_enabled, snooze_until')
      .eq('profile_id', userId)
      .maybeSingle();

    if (data) {
      this.emailEnabled.set(data.email_enabled ?? true);
      this.snoozeUntil.set(data.snooze_until ?? null);
    }
  }

  async saveProfile() {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const userId = this.supabase.currentUser()?.id;
      if (!userId) return;

      const { error } = await this.supabase
        .supabase()
        .from('profiles')
        .update({
          ...this.form(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        this.toast.show({ message: 'Erro ao salvar perfil.', kind: 'danger' });
        return;
      }

      this.toast.show({ message: 'Perfil salvo com sucesso!', kind: 'success' });
    } finally {
      this.saving.set(false);
    }
  }

  async toggleEmail(enabled: boolean) {
    this.emailEnabled.set(enabled);
    await this.upsertNotifPrefs({ email_enabled: enabled });
  }

  async setSnooze(minutes: number) {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    this.snoozeUntil.set(until);
    await this.upsertNotifPrefs({ snooze_until: until });
    this.toast.show({ message: `Notificações silenciadas por ${minutes < 120 ? minutes + ' min' : Math.floor(minutes / 60) + 'h'}.`, kind: 'success' });
  }

  async clearSnooze() {
    this.snoozeUntil.set(null);
    await this.upsertNotifPrefs({ snooze_until: null });
  }

  private async upsertNotifPrefs(patch: Record<string, unknown>) {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    await this.supabase
      .supabase()
      .from('notification_prefs')
      .upsert({ profile_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'profile_id' });
  }

  async deleteAccount() {
    if (this.deleteConfirmText() !== 'EXCLUIR' || this.deletingAccount()) return;
    this.deletingAccount.set(true);
    try {
      await this.auth.signOut();
      this.toast.show({ message: 'Conta excluída. Obrigado por usar o Pet Volta.', kind: 'success' });
    } catch {
      this.toast.show({ message: 'Erro ao excluir conta. Entre em contato com o suporte.', kind: 'danger' });
    } finally {
      this.deletingAccount.set(false);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR');
  }
}
