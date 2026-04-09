import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { VetService } from '@core/pets/vet.service';
import { PetService } from '@core/pets/pet.service';
import { VetVisit } from '@models/vet.model';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';
import { IconComponent } from '@shared/icons/icon.component';

type PetOption = { id: string; name: string };

@Component({
  selector: 'app-vets-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiCardComponent, IconComponent],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-semibold text-text">Veterinários</h1>
          <p class="mt-1 text-sm text-gray-600">Histórico de consultas e próximas visitas</p>
        </div>
        <ui-button type="button" [className]="'rounded-full'" (click)="showForm.set(true)">
          <app-icon name="plus" [size]="16" />
          Nova consulta
        </ui-button>
      </div>

      <!-- Seletor de pet -->
      <div class="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          class="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors"
          [class]="selectedPetId() === null
            ? 'border-primary bg-primary text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50'"
          (click)="selectPet(null)"
        >
          Todos
        </button>
        @for (pet of pets(); track pet.id) {
          <button
            type="button"
            class="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors"
            [class]="selectedPetId() === pet.id
              ? 'border-primary bg-primary text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50'"
            (click)="selectPet(pet.id)"
          >
            {{ pet.name }}
          </button>
        }
      </div>

      <!-- Formulário nova consulta -->
      @if (showForm()) {
        <ui-card [className]="'mb-6 p-5'">
          <h2 class="mb-4 font-display text-base font-semibold text-text">Registrar consulta</h2>
          <div class="grid gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Pet</label>
                <select
                  class="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  (change)="formPetId.set($any($event.target).value)"
                >
                  <option value="">Selecione</option>
                  @for (pet of pets(); track pet.id) {
                    <option [value]="pet.id">{{ pet.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Data da consulta</label>
                <input
                  type="date"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formDate()"
                  (input)="formDate.set($any($event.target).value)"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Nome do veterinário</label>
                <input
                  type="text"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Dr. João Silva"
                  [value]="formVetName()"
                  (input)="formVetName.set($any($event.target).value)"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Clínica (opcional)</label>
                <input
                  type="text"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Clínica VetCare"
                  [value]="formClinic()"
                  (input)="formClinic.set($any($event.target).value)"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Motivo da consulta</label>
              <input
                type="text"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ex: Check-up anual, vacina, mal-estar..."
                [value]="formReason()"
                (input)="formReason.set($any($event.target).value)"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Diagnóstico (opcional)</label>
                <input
                  type="text"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formDiagnosis()"
                  (input)="formDiagnosis.set($any($event.target).value)"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Próxima consulta (opcional)</label>
                <input
                  type="date"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formNextVisit()"
                  (input)="formNextVisit.set($any($event.target).value)"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Observações (opcional)</label>
              <input
                type="text"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                [value]="formNotes()"
                (input)="formNotes.set($any($event.target).value)"
              />
            </div>
            <div class="flex gap-2">
              <ui-button type="button" [className]="'rounded-full'" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Salvando...' : 'Salvar' }}
              </ui-button>
              <ui-button variant="ghost" type="button" [className]="'rounded-full'" (click)="cancelForm()">
                Cancelar
              </ui-button>
            </div>
          </div>
        </ui-card>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-24 animate-pulse rounded-pet bg-gray-200"></div>
          }
        </div>
      } @else if (!visits().length) {
        <ui-card [className]="'p-10 text-center'">
          <app-icon name="stethoscope" [size]="40" class="mx-auto text-gray-300" />
          <p class="mt-3 text-sm text-gray-500">Nenhuma consulta registrada.</p>
          <ui-button type="button" [className]="'mt-4 rounded-full'" (click)="showForm.set(true)">
            Registrar primeira consulta
          </ui-button>
        </ui-card>
      } @else {
        <div class="flex flex-col gap-3">
          @for (visit of visits(); track visit.id) {
            <ui-card [className]="'p-4'">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <app-icon name="stethoscope" [size]="20" class="text-primary" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-text">{{ visit.vet_name }}</p>
                    @if (visit.clinic_name) {
                      <p class="text-xs text-gray-500">{{ visit.clinic_name }}</p>
                    }
                    <p class="mt-1 text-xs text-gray-600">
                      {{ formatDate(visit.visit_date) }} · {{ visit.reason }}
                    </p>
                    @if (visit.diagnosis) {
                      <p class="mt-1 text-xs text-gray-500">Diagnóstico: {{ visit.diagnosis }}</p>
                    }
                    @if (visit.next_visit) {
                      <span class="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary">
                        Retorno: {{ formatDate(visit.next_visit) }}
                      </span>
                    }
                  </div>
                </div>
                <button
                  type="button"
                  class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
                  (click)="remove(visit.id)"
                >
                  <app-icon name="trash" [size]="16" />
                </button>
              </div>
            </ui-card>
          }
        </div>
      }
    </section>
  `,
})
export class VetsPage implements OnInit {
  private readonly vetService = inject(VetService);
  private readonly petService = inject(PetService);
  private readonly toast = inject(UiToastService);

  readonly loading = this.vetService.loading;
  readonly visits = this.vetService.visits;

  pets = signal<PetOption[]>([]);
  selectedPetId = signal<string | null>(null);
  showForm = signal(false);
  saving = signal(false);

  formPetId    = signal('');
  formVetName  = signal('');
  formClinic   = signal('');
  formDate     = signal(new Date().toISOString().slice(0, 10));
  formReason   = signal('');
  formDiagnosis = signal('');
  formNextVisit = signal('');
  formNotes    = signal('');

  async ngOnInit() {
    const list = await this.petService.listMyPets();
    this.pets.set(list.map((p) => ({ id: p.id, name: p.name })));
    if (list.length) {
      await this.selectPet(list[0].id);
    }
  }

  async selectPet(petId: string | null) {
    this.selectedPetId.set(petId);
    if (petId) {
      await this.vetService.listByPet(petId);
    }
  }

  async save() {
    if (!this.formPetId() || !this.formVetName() || !this.formReason()) {
      this.toast.show({ message: 'Preencha pet, veterinário e motivo.', kind: 'danger' });
      return;
    }
    this.saving.set(true);
    try {
      await this.vetService.create({
        pet_id: this.formPetId(),
        vet_name: this.formVetName(),
        clinic_name: this.formClinic() || null,
        phone: null,
        visit_date: this.formDate(),
        reason: this.formReason(),
        diagnosis: this.formDiagnosis() || null,
        prescription: null,
        next_visit: this.formNextVisit() || null,
        notes: this.formNotes() || null,
      });
      this.toast.show({ message: 'Consulta registrada!', kind: 'success' });
      this.cancelForm();
    } catch {
      this.toast.show({ message: 'Erro ao salvar consulta.', kind: 'danger' });
    } finally {
      this.saving.set(false);
    }
  }

  cancelForm() {
    this.showForm.set(false);
    this.formPetId.set('');
    this.formVetName.set('');
    this.formClinic.set('');
    this.formReason.set('');
    this.formDiagnosis.set('');
    this.formNextVisit.set('');
    this.formNotes.set('');
  }

  async remove(id: string) {
    try {
      await this.vetService.delete(id);
      this.toast.show({ message: 'Consulta excluída.', kind: 'success' });
    } catch {
      this.toast.show({ message: 'Erro ao excluir.', kind: 'danger' });
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
