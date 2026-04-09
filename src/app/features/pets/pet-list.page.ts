import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PetService } from '@core/pets/pet.service';
import { PlanService } from '@core/plan/plan.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiBadgeComponent } from '@ui/badge/ui-badge.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-pet-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent, UiBadgeComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <header class="hidden border-b border-gray-200 bg-white/80 backdrop-blur md:block">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a routerLink="/dashboard" class="text-sm text-gray-600 hover:text-text">
            ← Dashboard
          </a>
          <div class="flex items-center gap-2">
            <a routerLink="/pets/new">
              <ui-button
                type="button"
                [disabled]="!canAddPet()"
              >
                Adicionar pet
              </ui-button>
            </a>
          </div>
        </div>
      </header>

      <section class="mx-auto max-w-5xl px-4 py-10">
        <div class="flex items-end justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl font-semibold text-text">Meus pets</h1>
            <p class="mt-1 text-sm text-gray-600">
              Limite do seu plano: {{ limits().maxPets }} pet(s) • {{ limits().maxPhotosPerPet }}
              foto(s) por pet
            </p>
          </div>
          @if (!canAddPet()) {
            <ui-badge variant="warning">Limite atingido</ui-badge>
          }
        </div>

        @if (loading()) {
          <div class="mt-10 text-sm text-gray-600">Carregando…</div>
        } @else if (pets().length === 0) {
          <ui-card [className]="'mt-10 p-6'">
            <h2 class="font-display text-lg font-semibold text-text">Nenhum pet ainda</h2>
            <p class="mt-2 text-sm text-gray-600">
              Crie o perfil do seu pet e mantenha tudo pronto para qualquer situação.
            </p>
            <div class="mt-6">
              <a routerLink="/pets/new">
                <ui-button type="button" [disabled]="!canAddPet()">Criar primeiro pet</ui-button>
              </a>
            </div>
          </ui-card>
        } @else {
          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (pet of pets(); track pet.id) {
              <a
                class="block rounded-pet border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300"
                [routerLink]="['/pets', pet.id]"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-text">{{ pet.name }}</p>
                    <p class="mt-1 text-xs text-gray-600">
                      /p/{{ pet.public_slug }}
                    </p>
                  </div>
                  <ui-badge [variant]="pet.status === 'lost' ? 'danger' : 'success'">
                    {{ pet.status === 'lost' ? 'Perdido' : 'Seguro' }}
                  </ui-badge>
                </div>

                <div class="mt-4 overflow-hidden rounded-pet bg-gray-50">
                  @if (pet.photos?.length) {
                    <img
                      class="h-36 w-full object-cover"
                      [src]="pet.photos[0].url"
                      [alt]="'Foto de ' + pet.name"
                      loading="lazy"
                    />
                  } @else {
                    <div class="grid h-36 place-items-center text-3xl text-gray-400">
                      🐾
                    </div>
                  }
                </div>

                <div class="mt-4 text-xs text-gray-600">
                  Espécie: {{ mapSpecies(pet.species) }}
                </div>
              </a>
            }
          </div>
        }
      </section>
    </main>
  `,
})
export class PetListPage {
  private readonly petService = inject(PetService);
  private readonly plan = inject(PlanService);
  private readonly toast = inject(UiToastService);

  loading = signal(true);
  pets = signal<any[]>([]);

  limits = computed(() => this.plan.limits());
  canAddPet = computed(() => this.plan.canAddPet(this.pets().length));

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.pets.set(await this.petService.listMyPets());
    } catch {
      this.toast.show({ message: 'Não foi possível carregar seus pets.', kind: 'danger' });
    } finally {
      this.loading.set(false);
    }
  }

  mapSpecies(species: string) {
    switch (species) {
      case 'dog':
        return 'Cachorro';
      case 'cat':
        return 'Gato';
      default:
        return 'Outro';
    }
  }
}
