import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { PetService } from '@core/pets/pet.service';
import { PlanService } from '@core/plan/plan.service';
import { TagService } from '@core/tags/tag.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiSelectComponent } from '@ui/select/ui-select.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-tag-activate-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent, UiSelectComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <header class="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a routerLink="/" class="font-display text-base font-semibold text-text">🐾 Pet Volta</a>
          <a routerLink="/dashboard" class="text-sm text-gray-600 hover:text-text">Dashboard</a>
        </div>
      </header>

      <section class="mx-auto max-w-3xl px-4 py-10">
        <h1 class="font-display text-2xl font-semibold text-text">Ativar tag</h1>
        <p class="mt-1 text-sm text-gray-600">
          Código: <span class="font-mono text-xs">{{ tagCode() }}</span>
        </p>

        @if (!isAuthenticated()) {
          <ui-card [className]="'mt-8 p-6'">
            <h2 class="font-display text-lg font-semibold text-text">Entre para continuar</h2>
            <p class="mt-2 text-sm text-gray-600">
              Para ativar a tag, faça login e selecione um pet.
            </p>
            <div class="mt-6">
              <a [routerLink]="['/auth/login']" [queryParams]="{ returnUrl: '/t/' + tagCode() }">
                <ui-button type="button">Login</ui-button>
              </a>
            </div>
          </ui-card>
        } @else if (!hasTagAccess()) {
          <ui-card [className]="'mt-8 p-6'">
            <h2 class="font-display text-lg font-semibold text-text">Seu plano não inclui tags</h2>
            <p class="mt-2 text-sm text-gray-600">
              A ativação de tag está disponível a partir do plano Essential.
            </p>
            <div class="mt-6">
              <a routerLink="/auth/register">
                <ui-button type="button" variant="secondary">Ver planos</ui-button>
              </a>
            </div>
          </ui-card>
        } @else {
          <ui-card [className]="'mt-8 p-6'">
            <p class="text-sm text-gray-700">
              Selecione um pet para vincular a esta tag.
            </p>

            @if (loadingPets()) {
              <div class="mt-4 text-sm text-gray-600">Carregando pets…</div>
            } @else if (!pets().length) {
              <div class="mt-4 text-sm text-gray-600">
                Você ainda não tem pets. Crie um perfil antes de ativar a tag.
              </div>
              <div class="mt-6">
                <a routerLink="/pets/new">
                  <ui-button type="button">Criar pet</ui-button>
                </a>
              </div>
            } @else {
              <div class="mt-4">
                <label class="mb-1 block text-sm font-medium text-text">Pet</label>
                <ui-select [value]="selectedPetId()" (valueChange)="selectedPetId.set($event)">
                  <option value="" disabled>Selecione…</option>
                  @for (p of pets(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </ui-select>
              </div>

              <div class="mt-6">
                <ui-button
                  [className]="'w-full'"
                  type="button"
                  (click)="activate()"
                  [disabled]="!selectedPetId() || activating()"
                >
                  {{ activating() ? 'Ativando…' : 'Ativar tag' }}
                </ui-button>
              </div>
            }
          </ui-card>
        }
      </section>
    </main>
  `,
})
export class TagActivatePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly plan = inject(PlanService);
  private readonly petsService = inject(PetService);
  private readonly tags = inject(TagService);
  private readonly toast = inject(UiToastService);

  tagCode = computed(() => this.route.snapshot.paramMap.get('tagCode') ?? '');
  isAuthenticated = computed(() => this.auth.isAuthenticated());
  hasTagAccess = computed(() => this.plan.hasTagAccess());

  loadingPets = signal(false);
  pets = signal<Array<{ id: string; name: string }>>([]);
  selectedPetId = signal('');
  activating = signal(false);

  constructor() {
    if (this.isAuthenticated() && this.hasTagAccess()) {
      void this.loadPets();
    }
  }

  async loadPets() {
    this.loadingPets.set(true);
    try {
      const pets = await this.petsService.listMyPets();
      this.pets.set(pets.map((p) => ({ id: p.id, name: p.name })));
      if (pets.length) this.selectedPetId.set(pets[0]!.id);
    } catch {
      this.toast.show({ message: 'Não foi possível carregar seus pets.', kind: 'danger' });
    } finally {
      this.loadingPets.set(false);
    }
  }

  async activate() {
    if (this.activating() || !this.selectedPetId()) return;
    this.activating.set(true);
    try {
      const result = await this.tags.activateTag({
        tagCode: this.tagCode(),
        petId: this.selectedPetId(),
      });
      if (!result.ok) {
        this.toast.show({ message: result.message, kind: 'danger' });
        return;
      }
      this.toast.show({ message: 'Tag ativada com sucesso.', kind: 'success' });
      await this.router.navigateByUrl('/pets/' + this.selectedPetId());
    } finally {
      this.activating.set(false);
    }
  }
}
