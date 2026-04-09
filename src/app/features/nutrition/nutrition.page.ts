import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NutritionService } from '@core/pets/nutrition.service';
import { PetService } from '@core/pets/pet.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';
import { IconComponent } from '@shared/icons/icon.component';

type PetOption = { id: string; name: string };

@Component({
  selector: 'app-nutrition-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiCardComponent, IconComponent],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="font-display text-2xl font-semibold text-text">Nutrição</h1>
        <p class="mt-1 text-sm text-gray-600">Acompanhe a alimentação diária dos seus pets</p>
      </div>

      <!-- Seletor de pet + data -->
      <div class="mb-6 flex flex-wrap gap-3">
        <select
          class="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
          (change)="onPetChange($any($event.target).value)"
        >
          @for (pet of pets(); track pet.id) {
            <option [value]="pet.id">{{ pet.name }}</option>
          }
        </select>
        <input
          type="date"
          class="rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
          [value]="selectedDate()"
          (change)="onDateChange($any($event.target).value)"
        />
      </div>

      <!-- Resumo do dia -->
      @if (!loading() && logs().length) {
        <ui-card [className]="'mb-6 p-5'">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Calorias hoje</p>
              <p class="mt-1 text-3xl font-bold text-primary">{{ dailyCalories() }}</p>
              <p class="text-xs text-gray-500">kcal · {{ logs().length }} refeições</p>
            </div>
            <app-icon name="food" [size]="40" class="text-primary/30" />
          </div>
        </ui-card>
      }

      <!-- Formulário -->
      @if (showForm()) {
        <ui-card [className]="'mb-6 p-5'">
          <h2 class="mb-4 font-display text-base font-semibold text-text">Registrar refeição</h2>
          <div class="grid gap-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Alimento</label>
              <input
                type="text"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ex: Ração Premium, Frango cozido..."
                [value]="formFood()"
                (input)="formFood.set($any($event.target).value)"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Porção (g)</label>
                <input
                  type="number"
                  min="0"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Ex: 150"
                  [value]="formGrams()"
                  (input)="formGrams.set(+$any($event.target).value)"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Calorias (kcal)</label>
                <input
                  type="number"
                  min="0"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Ex: 340"
                  [value]="formCalories()"
                  (input)="formCalories.set(+$any($event.target).value)"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Horário</label>
              <input
                type="datetime-local"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                [value]="formMealTime()"
                (input)="formMealTime.set($any($event.target).value)"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Observações (opcional)</label>
              <input
                type="text"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ex: Comeu tudo, recusou parte..."
                [value]="formNotes()"
                (input)="formNotes.set($any($event.target).value)"
              />
            </div>
            <div class="flex gap-2">
              <ui-button type="button" [className]="'rounded-full'" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Salvando...' : 'Registrar' }}
              </ui-button>
              <ui-button variant="ghost" type="button" [className]="'rounded-full'" (click)="showForm.set(false)">
                Cancelar
              </ui-button>
            </div>
          </div>
        </ui-card>
      }

      <!-- Botão adicionar -->
      @if (!showForm()) {
        <div class="mb-4">
          <ui-button type="button" [className]="'rounded-full'" (click)="showForm.set(true)">
            <app-icon name="plus" [size]="16" />
            Registrar refeição
          </ui-button>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 animate-pulse rounded-pet bg-gray-200"></div>
          }
        </div>
      } @else if (!logs().length) {
        <ui-card [className]="'p-10 text-center'">
          <app-icon name="food" [size]="40" class="mx-auto text-gray-300" />
          <p class="mt-3 text-sm text-gray-500">Nenhuma refeição registrada neste dia.</p>
        </ui-card>
      } @else {
        <div class="flex flex-col gap-2">
          @for (log of logs(); track log.id) {
            <div class="flex items-center justify-between rounded-pet-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p class="text-sm font-medium text-text">{{ log.food_name }}</p>
                <p class="text-xs text-gray-500">
                  {{ formatTime(log.meal_time) }}
                  @if (log.portion_grams) { · {{ log.portion_grams }}g }
                  @if (log.calories) { · <span class="text-primary font-medium">{{ log.calories }} kcal</span> }
                </p>
                @if (log.notes) {
                  <p class="mt-0.5 text-xs italic text-gray-500">{{ log.notes }}</p>
                }
              </div>
              <button
                type="button"
                class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
                (click)="remove(log.id)"
              >
                <app-icon name="trash" [size]="16" />
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class NutritionPage implements OnInit {
  private readonly nutritionService = inject(NutritionService);
  private readonly petService = inject(PetService);
  private readonly toast = inject(UiToastService);

  readonly loading = this.nutritionService.loading;
  readonly logs = this.nutritionService.logs;

  pets = signal<PetOption[]>([]);
  selectedPetId = signal('');
  selectedDate = signal(new Date().toISOString().slice(0, 10));
  showForm = signal(false);
  saving = signal(false);

  formFood = signal('');
  formGrams = signal(0);
  formCalories = signal(0);
  formMealTime = signal(new Date().toISOString().slice(0, 16));
  formNotes = signal('');

  readonly dailyCalories = computed(() => this.nutritionService.dailyCalories(this.logs()));

  async ngOnInit() {
    const list = await this.petService.listMyPets();
    this.pets.set(list.map((p) => ({ id: p.id, name: p.name })));
    if (list.length) {
      this.selectedPetId.set(list[0].id);
      await this.load();
    }
  }

  private async load() {
    if (!this.selectedPetId()) return;
    await this.nutritionService.listByPet(this.selectedPetId(), new Date(this.selectedDate()));
  }

  async onPetChange(petId: string) {
    this.selectedPetId.set(petId);
    await this.load();
  }

  async onDateChange(date: string) {
    this.selectedDate.set(date);
    await this.load();
  }

  async save() {
    if (!this.formFood()) {
      this.toast.show({ message: 'Informe o alimento.', kind: 'danger' });
      return;
    }
    this.saving.set(true);
    try {
      await this.nutritionService.create({
        pet_id: this.selectedPetId(),
        food_name: this.formFood(),
        portion_grams: this.formGrams() || null,
        calories: this.formCalories() || null,
        meal_time: new Date(this.formMealTime()).toISOString(),
        notes: this.formNotes() || null,
      });
      this.toast.show({ message: 'Refeição registrada!', kind: 'success' });
      this.showForm.set(false);
      this.formFood.set('');
      this.formGrams.set(0);
      this.formCalories.set(0);
      this.formNotes.set('');
    } catch {
      this.toast.show({ message: 'Erro ao registrar refeição.', kind: 'danger' });
    } finally {
      this.saving.set(false);
    }
  }

  async remove(id: string) {
    try {
      await this.nutritionService.delete(id);
      this.toast.show({ message: 'Registro excluído.', kind: 'success' });
    } catch {
      this.toast.show({ message: 'Erro ao excluir.', kind: 'danger' });
    }
  }

  formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
