import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PetService } from '@core/pets/pet.service';
import { PlanService } from '@core/plan/plan.service';
import { ScanService } from '@core/pets/scan.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { Pet } from '@models/pet.model';
import { CurrencyBrlPipe } from '@shared/pipes/currency-brl.pipe';
import { HealthListComponent } from '@features/health/health-list.component';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiTabsComponent } from '@ui/tabs/ui-tabs.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-pet-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent, UiTabsComponent, CurrencyBrlPipe, HealthListComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <header class="hidden border-b border-gray-200 bg-white md:block">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a routerLink="/pets" class="text-sm text-gray-600 hover:text-text">← Meus pets</a>
          <div class="flex items-center gap-2">
            <a [routerLink]="['/pets', petId(), 'edit']">
              <ui-button variant="ghost" type="button">Editar</ui-button>
            </a>
            <ui-button variant="danger" type="button" (click)="confirmDelete()" [disabled]="deleting()">
              {{ deleting() ? 'Excluindo…' : 'Excluir' }}
            </ui-button>
          </div>
        </div>
      </header>

      <!-- Dialog de confirmação de exclusão -->
      @if (showDeleteConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div class="w-full max-w-sm rounded-pet bg-white p-6 shadow-pet-md">
            <h2 class="font-display text-lg font-semibold text-text">Excluir pet?</h2>
            <p class="mt-2 text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
            <div class="mt-5 flex justify-end gap-3">
              <ui-button variant="ghost" type="button" (click)="showDeleteConfirm.set(false)">Cancelar</ui-button>
              <ui-button variant="danger" type="button" (click)="remove()">Excluir</ui-button>
            </div>
          </div>
        </div>
      }

      <!-- Dialog de confirmação modo perdido -->
      @if (showLostConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div class="w-full max-w-sm rounded-pet bg-white p-6 shadow-pet-md">
            <h2 class="font-display text-lg font-semibold text-text">
              {{ pet()!.status === 'safe' ? 'Marcar como perdido?' : 'Marcar como encontrado?' }}
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              @if (pet()!.status === 'safe') {
                A página pública de {{ pet()!.name }} será atualizada para modo alerta.
              } @else {
                A página pública voltará ao modo normal.
              }
            </p>

            @if (pet()!.status === 'safe') {
              <div class="mt-4 grid gap-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700">Recompensa (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                    [value]="rewardInput()"
                    (input)="rewardInput.set(+$any($event.target).value)"
                  />
                  <p class="mt-1 text-xs text-gray-500">Valor em R$ (0 = sem recompensa)</p>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700">Descrição (opcional)</label>
                  <textarea
                    rows="2"
                    maxlength="500"
                    placeholder="Onde foi visto pela última vez…"
                    class="w-full rounded-pet-sm border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    [value]="lostDescInput()"
                    (input)="lostDescInput.set($any($event.target).value)"
                  ></textarea>
                </div>
              </div>
            }

            <div class="mt-5 flex justify-end gap-3">
              <ui-button variant="ghost" type="button" (click)="showLostConfirm.set(false)">Cancelar</ui-button>
              <ui-button
                [variant]="pet()!.status === 'safe' ? 'danger' : 'primary'"
                type="button"
                (click)="toggleLost()"
                [disabled]="togglingLost()"
              >
                {{ togglingLost() ? 'Salvando…' : (pet()!.status === 'safe' ? 'Marcar Perdido' : 'Marcar Encontrado') }}
              </ui-button>
            </div>
          </div>
        </div>
      }

      <section class="mx-auto max-w-5xl px-4 py-8">
        @if (loading()) {
          <div class="flex flex-col gap-4">
            <div class="h-8 w-48 animate-pulse rounded-full bg-gray-200"></div>
            <div class="h-64 animate-pulse rounded-pet bg-gray-200"></div>
          </div>
        } @else if (!pet()) {
          <ui-card [className]="'p-6'">
            <p class="text-sm text-gray-700">Pet não encontrado.</p>
          </ui-card>
        } @else {
          <!-- Banner modo perdido -->
          @if (pet()!.status === 'lost') {
            <div class="mb-6 flex items-center justify-between rounded-pet bg-danger px-5 py-4 text-white shadow-pet">
              <div>
                <p class="font-semibold">⚠️ {{ pet()!.name }} está marcado como perdido</p>
                @if (pet()!.reward_amount_cents > 0) {
                  <p class="mt-1 text-sm text-white/80">
                    Recompensa: {{ pet()!.reward_amount_cents | currencyBrl }}
                  </p>
                }
              </div>
              <ui-button
                variant="ghost"
                type="button"
                [className]="'border-white/40 text-white hover:bg-white/10 rounded-full'"
                (click)="showLostConfirm.set(true)"
              >
                Marcar encontrado
              </ui-button>
            </div>
          }

          <div class="grid gap-6 lg:grid-cols-[300px_1fr]">
            <!-- Foto + toggle perdido -->
            <div class="flex flex-col gap-3">
              <div class="overflow-hidden rounded-pet bg-gray-100 shadow-pet">
                @if (pet()!.photos.length) {
                  <img
                    class="h-64 w-full object-cover"
                    [src]="pet()!.photos[0].url"
                    [alt]="'Foto de ' + pet()!.name"
                  />
                } @else {
                  <div class="grid h-64 place-items-center text-5xl text-gray-300">🐾</div>
                }
              </div>

              <!-- Toggle modo perdido -->
              @if (planService.limits().hasTagAccess || true) {
                <button
                  type="button"
                  class="w-full rounded-full py-2 text-sm font-medium transition-colors"
                  [class]="pet()!.status === 'lost'
                    ? 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20'
                    : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'"
                  (click)="showLostConfirm.set(true)"
                >
                  {{ pet()!.status === 'lost' ? '✅ Pet encontrado' : '⚠️ Marcar como perdido' }}
                </button>
              }

              <a [href]="'/p/' + pet()!.public_slug" target="_blank">
                <button
                  type="button"
                  class="w-full rounded-full border border-gray-200 bg-white py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  🔗 Ver perfil público
                </button>
              </a>
            </div>

            <!-- Detalhes e tabs -->
            <div>
              <h1 class="font-display text-2xl font-semibold text-text">{{ pet()!.name }}</h1>
              <p class="mt-1 text-sm text-gray-500">
                {{ mapSpecies(pet()!.species) }}
                @if (pet()!.breed) { • {{ pet()!.breed }} }
              </p>

              <div class="mt-6">
                <ui-tabs [tabs]="tabs" [activeId]="activeTab()" (activeIdChange)="activeTab.set($event)">

                  @if (activeTab() === 'profile') {
                    <ui-card [className]="'p-5'">
                      <div class="grid gap-3 text-sm text-gray-700">
                        <div><span class="font-medium text-text">Espécie:</span> {{ mapSpecies(pet()!.species) }}</div>
                        <div><span class="font-medium text-text">Raça:</span> {{ pet()!.breed || '—' }}</div>
                        <div><span class="font-medium text-text">Porte:</span> {{ mapSize(pet()!.size) }}</div>
                        <div><span class="font-medium text-text">Cor:</span> {{ pet()!.color || '—' }}</div>
                        <div><span class="font-medium text-text">Microchip:</span> {{ pet()!.microchip_id || '—' }}</div>
                        <div><span class="font-medium text-text">Temperamento:</span> {{ pet()!.temperament || '—' }}</div>
                        @if (pet()!.medical_notes) {
                          <div><span class="font-medium text-text">Obs. médicas:</span> {{ pet()!.medical_notes }}</div>
                        }
                      </div>
                    </ui-card>
                  }

                  @if (activeTab() === 'photos') {
                    <ui-card [className]="'p-5'">
                      @if (!pet()!.photos.length) {
                        <p class="text-sm text-gray-600">Sem fotos ainda.</p>
                      } @else {
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          @for (p of pet()!.photos; track p.url) {
                            <img
                              class="aspect-square w-full rounded-pet-sm object-cover"
                              [src]="p.url"
                              alt="Foto do pet"
                              loading="lazy"
                            />
                          }
                        </div>
                      }
                    </ui-card>
                  }

                  @if (activeTab() === 'health') {
                    <app-health-list [petId]="petId()" />
                  }

                  @if (activeTab() === 'lost') {
                    <ui-card [className]="'p-5'">
                      @if (pet()!.status !== 'lost') {
                        <p class="text-sm text-gray-600">Pet não está em modo perdido.</p>
                      } @else {
                        <div class="grid gap-4 text-sm">
                          <div>
                            <p class="font-medium text-text">Status</p>
                            <span class="mt-1 inline-block rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
                              ⚠️ Perdido
                            </span>
                          </div>
                          @if (pet()!.reward_amount_cents > 0) {
                            <div>
                              <p class="font-medium text-text">Recompensa</p>
                              <p class="mt-1 text-lg font-bold text-secondary">{{ pet()!.reward_amount_cents | currencyBrl }}</p>
                            </div>
                          }
                          @if (pet()!.lost_description) {
                            <div>
                              <p class="font-medium text-text">Descrição</p>
                              <p class="mt-1 text-gray-700">{{ pet()!.lost_description }}</p>
                            </div>
                          }
                        </div>
                      }
                    </ui-card>
                  }

                  @if (activeTab() === 'scans') {
                    <div>
                      @if (scansLoading()) {
                        <div class="flex flex-col gap-2">
                          @for (i of [1,2,3]; track i) {
                            <div class="h-16 animate-pulse rounded-pet-sm bg-gray-200"></div>
                          }
                        </div>
                      } @else if (!scans().length) {
                        <ui-card [className]="'p-8 text-center'">
                          <p class="text-3xl">📡</p>
                          <p class="mt-3 text-sm text-gray-600">Nenhum scan registrado ainda.</p>
                        </ui-card>
                      } @else {
                        @if (planService.limits().scanHistoryDays !== null) {
                          <p class="mb-3 text-xs text-gray-500">
                            Histórico limitado a {{ planService.limits().scanHistoryDays }} dias no plano atual.
                            <a routerLink="/settings" class="text-primary underline">Fazer upgrade</a>
                          </p>
                        }
                        <div class="flex flex-col gap-2">
                          @for (scan of scans(); track scan.id) {
                            <div class="flex items-start gap-3 rounded-pet-sm border border-gray-200 bg-white p-4 shadow-sm">
                              <span class="mt-0.5 text-lg" aria-hidden="true">
                                {{ scan.location_type === 'precise' ? '📍' : scan.location_type === 'approximate' ? '📌' : '📎' }}
                              </span>
                              <div class="min-w-0 flex-1">
                                <p class="text-sm font-medium text-text">
                                  {{ scan.location_type === 'precise' ? 'Localização precisa' : scan.location_type === 'approximate' ? 'Localização aproximada' : 'Sem localização' }}
                                </p>
                                <p class="text-xs text-gray-500">{{ formatScanDate(scan.scanned_at) }}</p>
                                 @if (scan.ip_city || scan.ip_region) {
                                   <p class="mt-0.5 text-xs text-gray-600">
                                     {{ formatLocation([scan.ip_city, scan.ip_region, scan.ip_country]) }}
                                   </p>
                                 }
                                @if (scan.message) {
                                  <p class="mt-1 truncate text-xs italic text-gray-600">"{{ scan.message }}"</p>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }

                </ui-tabs>
              </div>
            </div>
          </div>
        }
      </section>
    </main>
  `,
})
export class PetDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pets = inject(PetService);
  private readonly toast = inject(UiToastService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly scanService = inject(ScanService);
  readonly planService = inject(PlanService);

  petId = computed(() => this.route.snapshot.paramMap.get('id')!);
  loading = signal(true);
  deleting = signal(false);
  togglingLost = signal(false);
  pet = signal<Pet | null>(null);
  scans = this.scanService.scans;
  scansLoading = this.scanService.loading;

  formatLocation(parts: Array<string | null | undefined>): string {
    return parts
      .map((p) => (p ?? '').trim())
      .filter((p) => p.length > 0)
      .join(', ');
  }

  showDeleteConfirm = signal(false);
  showLostConfirm = signal(false);
  rewardInput = signal(0);
  lostDescInput = signal('');

  tabs = [
    { id: 'profile', label: 'Perfil' },
    { id: 'photos', label: 'Fotos' },
    { id: 'health', label: 'Saúde' },
    { id: 'lost', label: 'Modo Perdido' },
    { id: 'scans', label: 'Histórico de Scans' },
  ];
  activeTab = signal('profile');

  constructor() {
    void this.load();
    effect(() => {
      if (this.activeTab() === 'scans') {
        void this.scanService.fetchScanHistory(this.petId());
      }
    });
  }

  async load() {
    this.loading.set(true);
    try {
      const loaded = await this.pets.getMyPetById(this.petId());
      this.pet.set(loaded);
      // Pré-preenche reward com valor existente
      if (loaded?.reward_amount_cents) {
        this.rewardInput.set(Math.round(loaded.reward_amount_cents / 100));
      }
      if (loaded?.lost_description) {
        this.lostDescInput.set(loaded.lost_description);
      }
    } catch {
      this.toast.show({ message: 'Não foi possível carregar o pet.', kind: 'danger' });
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete() {
    this.showDeleteConfirm.set(true);
  }

  async remove() {
    if (this.deleting()) return;
    this.showDeleteConfirm.set(false);
    this.deleting.set(true);
    try {
      await this.pets.deletePet(this.petId());
      this.toast.show({ message: 'Pet excluído.', kind: 'success' });
      await this.router.navigateByUrl('/pets');
    } catch {
      this.toast.show({ message: 'Não foi possível excluir o pet.', kind: 'danger' });
    } finally {
      this.deleting.set(false);
    }
  }

  async toggleLost() {
    if (this.togglingLost()) return;
    this.togglingLost.set(true);
    this.showLostConfirm.set(false);

    try {
      const currentPet = this.pet()!;
      const goingLost = currentPet.status === 'safe';

      const { functions } = this.supabase.supabase();
      const { error } = await functions.invoke('toggle-lost', {
        body: {
          petId: currentPet.id,
          lost: goingLost,
          rewardAmountCents: goingLost ? this.rewardInput() * 100 : undefined,
          lostDescription: goingLost ? this.lostDescInput() || undefined : undefined,
        },
      });

      if (error) {
        this.toast.show({ message: 'Erro ao atualizar status.', kind: 'danger' });
        return;
      }

      this.toast.show({
        message: goingLost
          ? `${currentPet.name} marcado como perdido.`
          : `${currentPet.name} marcado como encontrado.`,
        kind: goingLost ? 'warning' : 'success',
      });

      // Recarrega os dados
      await this.load();
    } catch {
      this.toast.show({ message: 'Erro ao atualizar status.', kind: 'danger' });
    } finally {
      this.togglingLost.set(false);
    }
  }

  mapSpecies(species: string): string {
    switch (species) {
      case 'dog': return 'Cachorro';
      case 'cat': return 'Gato';
      default:    return 'Outro';
    }
  }

  mapSize(size: string | null): string {
    switch (size) {
      case 'small':  return 'Pequeno';
      case 'medium': return 'Médio';
      case 'large':  return 'Grande';
      default:       return '—';
    }
  }

  formatScanDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
