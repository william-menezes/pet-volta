import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PetService } from '@core/pets/pet.service';
import { PlanService } from '@core/plan/plan.service';
import { ReminderService } from '@core/pets/reminder.service';
import { VetService } from '@core/pets/vet.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { CurrencyBrlPipe } from '@shared/pipes/currency-brl.pipe';
import { IconComponent } from '@shared/icons/icon.component';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';
import type { Pet } from '@models/pet.model';
import type { Reminder } from '@models/reminder.model';

type PetSummary = Pick<Pet, 'id' | 'name' | 'public_slug' | 'species' | 'status' | 'photos' | 'reward_amount_cents'>;

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent, CurrencyBrlPipe, IconComponent],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">

      <!-- Saudação -->
      <div class="mb-6">
        <h1 class="font-display text-2xl font-semibold text-text">
          Olá{{ firstName() ? ', ' + firstName() : '' }}! 👋
        </h1>
        <p class="mt-1 text-sm text-gray-600">Aqui está o resumo dos seus pets.</p>
      </div>

      <!-- Banner upgrade Digital -->
      @if (planService.currentPlan() === 'digital') {
        <div class="mb-6 flex flex-col items-start justify-between gap-4 rounded-pet bg-primary/5 px-5 py-4 sm:flex-row sm:items-center">
          <div class="flex items-center gap-3">
            <app-icon name="qr-code" [size]="24" class="shrink-0 text-primary" />
            <div>
              <p class="text-sm font-semibold text-primary">Desbloqueie as tags QR físicas</p>
              <p class="mt-0.5 text-xs text-gray-600">
                Com o plano Essential, seu pet recebe uma tag QR e você é notificado quando encontrado.
              </p>
            </div>
          </div>
          <a routerLink="/dashboard/pricing">
            <ui-button type="button" [className]="'shrink-0 rounded-full text-sm'">Ver Planos</ui-button>
          </a>
        </div>
      }

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <!-- Card: Meus Pets -->
        <ui-card [className]="'col-span-full p-5 shadow-pet lg:col-span-2'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <app-icon name="paw" [size]="20" class="text-primary" />
              <h2 class="font-display text-base font-semibold text-text">Meus Pets</h2>
            </div>
            <a routerLink="/dashboard/pets/new">
              <ui-button type="button" [className]="'rounded-full text-xs'">
                <app-icon name="plus" [size]="14" />
                Novo Pet
              </ui-button>
            </a>
          </div>

          @if (petsLoading()) {
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              @for (i of [1,2]; track i) {
                <div class="h-20 animate-pulse rounded-pet bg-gray-200"></div>
              }
            </div>
          } @else if (!pets().length) {
            <div class="mt-6 flex flex-col items-center py-8 text-center">
              <app-icon name="paw" [size]="48" class="text-gray-200" />
              <p class="mt-3 text-sm text-gray-600">Nenhum pet cadastrado ainda.</p>
              <a routerLink="/dashboard/pets/new" class="mt-3">
                <ui-button type="button" [className]="'rounded-full'">Cadastrar meu primeiro pet</ui-button>
              </a>
            </div>
          } @else {
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              @for (pet of pets(); track pet.id) {
                <a [routerLink]="['/dashboard/pets', pet.id]" class="group block">
                  <div class="flex items-center gap-3 rounded-pet-sm border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-pet group-hover:border-primary/30">
                    <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      @if (pet.photos.length) {
                        <img [src]="pet.photos[0].url" [alt]="pet.name" class="h-full w-full object-cover" />
                      } @else {
                        <div class="grid h-full w-full place-items-center">
                          <app-icon name="paw" [size]="24" class="text-gray-300" />
                        </div>
                      }
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-text">{{ pet.name }}</p>
                      <p class="text-xs text-gray-500">{{ mapSpecies(pet.species) }}</p>
                      <span
                        class="mt-1 inline-block rounded-full px-2 py-0.5 text-2xs font-medium"
                        [class]="pet.status === 'lost' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'"
                      >
                        {{ pet.status === 'lost' ? '⚠️ Perdido' : '✅ Seguro' }}
                      </span>
                    </div>
                    <app-icon name="chevron-right" [size]="16" class="ml-auto shrink-0 text-gray-300 group-hover:text-primary" />
                  </div>
                </a>
              }
            </div>
          }
        </ui-card>

        <!-- Card: Plano -->
        <ui-card [className]="'p-5 shadow-pet'">
          <div class="flex items-center gap-2">
            <app-icon name="credit-card" [size]="20" class="text-primary" />
            <h2 class="font-display text-base font-semibold text-text">Plano</h2>
          </div>
          <p class="mt-2 text-sm text-gray-600 capitalize">
            Atual: <span class="font-semibold text-text">{{ planService.currentPlan() }}</span>
          </p>
          <div class="mt-4 space-y-2 text-xs text-gray-700">
            <div class="flex items-center justify-between">
              <span>Pets</span>
              <span class="font-medium">{{ pets().length }}/{{ planService.limits().maxPets }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Fotos por pet</span>
              <span class="font-medium">{{ planService.limits().maxPhotosPerPet }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Tag QR</span>
              <span>{{ planService.limits().hasTagAccess ? '✅' : '❌' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Realtime</span>
              <span>{{ planService.limits().hasRealtime ? '✅' : '❌' }}</span>
            </div>
          </div>
          <a routerLink="/dashboard/pricing" class="mt-4 block">
            <ui-button variant="ghost" type="button" [className]="'w-full rounded-full text-sm'">
              Gerenciar plano →
            </ui-button>
          </a>
        </ui-card>

        <!-- Card: Health Summary -->
        <ui-card [className]="'p-5 shadow-pet'">
          <div class="flex items-center gap-2">
            <app-icon name="heart" [size]="20" class="text-danger" />
            <h2 class="font-display text-base font-semibold text-text">Saúde</h2>
          </div>
          @if (healthLoading()) {
            <div class="mt-3 space-y-2">
              @for (i of [1,2,3]; track i) {
                <div class="h-8 animate-pulse rounded-full bg-gray-200"></div>
              }
            </div>
          } @else {
            <div class="mt-3 space-y-3">
              <!-- Próximo lembrete -->
              <div class="flex items-start gap-2">
                <app-icon name="bell" [size]="16" class="mt-0.5 shrink-0 text-warning" />
                <div>
                  <p class="text-2xs font-medium uppercase tracking-wide text-gray-500">Próximo lembrete</p>
                  @if (nextReminder()) {
                    <p class="text-sm font-medium text-text">{{ nextReminder()!.title }}</p>
                    <p class="text-xs text-gray-500">{{ formatShortDate(nextReminder()!.due_date) }}</p>
                  } @else {
                    <p class="text-xs text-gray-400">Sem lembretes pendentes</p>
                  }
                </div>
              </div>
              <!-- Última consulta -->
              <div class="flex items-start gap-2">
                <app-icon name="stethoscope" [size]="16" class="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p class="text-2xs font-medium uppercase tracking-wide text-gray-500">Última consulta</p>
                  @if (lastVetVisit()) {
                    <p class="text-sm font-medium text-text">{{ lastVetVisit()!.vet_name }}</p>
                    <p class="text-xs text-gray-500">{{ formatShortDate(lastVetVisit()!.visit_date) }}</p>
                  } @else {
                    <p class="text-xs text-gray-400">Nenhuma consulta registrada</p>
                  }
                </div>
              </div>
            </div>
            <a routerLink="/dashboard/reminders" class="mt-4 block">
              <ui-button variant="ghost" type="button" [className]="'w-full rounded-full text-sm'">
                Ver lembretes →
              </ui-button>
            </a>
          }
        </ui-card>

        <!-- Card: Lembretes de Hoje -->
        <ui-card [className]="'p-5 shadow-pet'">
          <div class="flex items-center gap-2">
            <app-icon name="calendar" [size]="20" class="text-primary" />
            <h2 class="font-display text-base font-semibold text-text">Hoje</h2>
          </div>
          @if (healthLoading()) {
            <div class="mt-3 space-y-2">
              @for (i of [1,2]; track i) {
                <div class="h-10 animate-pulse rounded-full bg-gray-200"></div>
              }
            </div>
          } @else if (!todayReminders().length) {
            <div class="mt-4 flex flex-col items-center py-4 text-center">
              <app-icon name="check" [size]="32" class="text-success/40" />
              <p class="mt-2 text-xs text-gray-500">Nada pendente para hoje!</p>
            </div>
          } @else {
            <div class="mt-3 flex flex-col gap-2">
              @for (r of todayReminders(); track r.id) {
                <div class="flex items-center gap-2 rounded-pet-sm bg-warning/5 px-3 py-2">
                  <app-icon name="clock" [size]="14" class="shrink-0 text-warning" />
                  <div class="min-w-0">
                    <p class="truncate text-xs font-medium text-text">{{ r.title }}</p>
                    <p class="text-2xs text-gray-500">{{ formatTime(r.due_date) }}</p>
                  </div>
                </div>
              }
            </div>
            <a routerLink="/dashboard/reminders" class="mt-3 block">
              <ui-button variant="ghost" type="button" [className]="'w-full rounded-full text-sm'">
                Ver todos →
              </ui-button>
            </a>
          }
        </ui-card>

        <!-- Card: Alertas (pets perdidos) -->
        @if (lostPets().length) {
          <ui-card [className]="'col-span-full p-5 shadow-pet-md border-danger/20'">
            <div class="flex items-center gap-2">
              <app-icon name="alert-triangle" [size]="20" class="text-danger" />
              <h2 class="font-display text-base font-semibold text-danger">Alertas Ativos</h2>
            </div>
            <div class="mt-3 grid gap-2">
              @for (pet of lostPets(); track pet.id) {
                <a [routerLink]="['/dashboard/pets', pet.id]" class="flex items-center justify-between rounded-pet-sm bg-danger/5 px-4 py-3">
                  <div>
                    <p class="text-sm font-medium text-danger">{{ pet.name }} está perdido</p>
                    @if (pet.reward_amount_cents > 0) {
                      <p class="text-xs text-gray-600">
                        Recompensa: <span class="font-medium text-secondary">{{ pet.reward_amount_cents | currencyBrl }}</span>
                      </p>
                    }
                  </div>
                  <app-icon name="chevron-right" [size]="16" class="text-gray-400" />
                </a>
              }
            </div>
          </ui-card>
        }

        <!-- Card: Ações Rápidas -->
        <ui-card [className]="'p-5 shadow-pet'">
          <div class="flex items-center gap-2">
            <app-icon name="menu" [size]="20" class="text-primary" />
            <h2 class="font-display text-base font-semibold text-text">Ações Rápidas</h2>
          </div>
          <div class="mt-4 grid gap-2">
            <a routerLink="/dashboard/pets/new">
              <ui-button variant="ghost" type="button" [className]="'w-full justify-start gap-2 rounded-full text-sm'">
                <app-icon name="plus" [size]="16" />
                Cadastrar pet
              </ui-button>
            </a>
            <a routerLink="/dashboard/reminders">
              <ui-button variant="ghost" type="button" [className]="'w-full justify-start gap-2 rounded-full text-sm'">
                <app-icon name="bell" [size]="16" />
                Novo lembrete
              </ui-button>
            </a>
            <a routerLink="/dashboard/vets">
              <ui-button variant="ghost" type="button" [className]="'w-full justify-start gap-2 rounded-full text-sm'">
                <app-icon name="stethoscope" [size]="16" />
                Registrar consulta
              </ui-button>
            </a>
            <a routerLink="/dashboard/settings">
              <ui-button variant="ghost" type="button" [className]="'w-full justify-start gap-2 rounded-full text-sm'">
                <app-icon name="settings" [size]="16" />
                Configurações
              </ui-button>
            </a>
          </div>
        </ui-card>

      </div>
    </section>
  `,
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseClientService);
  private readonly petService = inject(PetService);
  private readonly reminderService = inject(ReminderService);
  private readonly vetService = inject(VetService);
  private readonly toast = inject(UiToastService);
  readonly planService = inject(PlanService);

  petsLoading = signal(true);
  healthLoading = signal(true);
  pets = signal<PetSummary[]>([]);
  todayReminders = signal<Reminder[]>([]);
  nextReminder = signal<Reminder | null>(null);
  lastVetVisit = signal<{ vet_name: string; visit_date: string } | null>(null);

  readonly firstName = computed(() => {
    const name = this.supabase.currentUser()?.user_metadata?.['full_name'] as string | undefined;
    return name?.split(' ')[0] ?? null;
  });
  readonly lostPets = computed(() => this.pets().filter((p) => p.status === 'lost'));

  private realtimeChannel: ReturnType<typeof this.supabase.supabase.prototype.channel> | null = null;

  async ngOnInit() {
    await Promise.all([this.loadPets(), this.loadHealth()]);
  }

  async loadPets() {
    this.petsLoading.set(true);
    try {
      const list = await this.petService.listMyPets();
      this.pets.set(list);
      this.subscribeRealtime();
    } catch {
      this.toast.show({ message: 'Erro ao carregar pets.', kind: 'danger' });
    } finally {
      this.petsLoading.set(false);
    }
  }

  async loadHealth() {
    this.healthLoading.set(true);
    try {
      const [today, allReminders] = await Promise.all([
        this.reminderService.listDueToday(),
        this.reminderService.listAllForOwner(),
      ]);
      this.todayReminders.set(today);
      this.nextReminder.set(allReminders.find((r) => !r.done) ?? null);

      // última visita ao vet do primeiro pet
      const firstPetId = this.pets()[0]?.id;
      if (firstPetId) {
        const last = await this.vetService.lastVisit(firstPetId);
        this.lastVetVisit.set(last);
      }
    } finally {
      this.healthLoading.set(false);
    }
  }

  private subscribeRealtime() {
    if (!this.planService.limits().hasRealtime) return;
    const petIds = this.pets().map((p) => p.id);
    if (!petIds.length) return;

    if (this.realtimeChannel) {
      void this.supabase.supabase().removeChannel(this.realtimeChannel);
    }
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    this.realtimeChannel = this.supabase
      .supabase()
      .channel(`scan-alerts-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'scan_events',
        filter: `pet_id=in.(${petIds.join(',')})`,
      }, (payload) => {
        const pet = this.pets().find((p) => p.id === payload.new['pet_id']);
        const locType = payload.new['location_type'];
        const iconMap: Record<string, string> = { precise: '📍', approximate: '📌' };
        const icon = iconMap[locType] ?? '📎';
        this.toast.show({ message: `${icon} ${pet?.name ?? 'Pet'} foi escaneado!`, kind: 'success' });
      })
      .subscribe();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      void this.supabase.supabase().removeChannel(this.realtimeChannel);
    }
  }

  mapSpecies(species: string) {
    return species === 'dog' ? 'Cachorro' : species === 'cat' ? 'Gato' : 'Outro';
  }

  formatShortDate(dateStr: string) {
    return new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
