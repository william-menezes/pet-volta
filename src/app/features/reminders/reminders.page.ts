import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PetService } from '@core/pets/pet.service';
import { ReminderService } from '@core/pets/reminder.service';
import { Reminder, ReminderType, reminderTypeIcon, reminderTypeLabel } from '@models/reminder.model';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';
import { IconComponent } from '@shared/icons/icon.component';

type PetOption = { id: string; name: string };

@Component({
  selector: 'app-reminders-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiCardComponent, IconComponent],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-semibold text-text">Lembretes</h1>
          <p class="mt-1 text-sm text-gray-600">Vacinas, medicações e consultas agendadas</p>
        </div>
        <ui-button type="button" [className]="'rounded-full'" (click)="showForm.set(true)">
          <app-icon name="plus" [size]="16" />
          Novo
        </ui-button>
      </div>

      <!-- Filtro por pet -->
      <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          class="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors"
          [class]="selectedPetId() === null
            ? 'border-primary bg-primary text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50'"
          (click)="selectedPetId.set(null)"
        >
          Todos os pets
        </button>
        @for (pet of pets(); track pet.id) {
          <button
            type="button"
            class="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors"
            [class]="selectedPetId() === pet.id
              ? 'border-primary bg-primary text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50'"
            (click)="selectedPetId.set(pet.id)"
          >
            {{ pet.name }}
          </button>
        }
      </div>

      <!-- Filtro pendentes/todos -->
      <div class="mb-6 flex gap-2">
        @for (f of filters; track f.value) {
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition-colors"
            [class]="showDone() === f.value
              ? 'border-primary bg-primary/10 text-primary font-medium'
              : 'border-gray-200 text-gray-600 hover:border-primary/30'"
            (click)="showDone.set(f.value)"
          >
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Formulário novo lembrete -->
      @if (showForm()) {
        <ui-card [className]="'mb-6 p-5'">
          <h2 class="mb-4 font-display text-base font-semibold text-text">Novo lembrete</h2>
          <div class="grid gap-3">
            <!-- Pet -->
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Pet</label>
              <select
                class="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
                (change)="formPetId.set($any($event.target).value)"
              >
                <option value="">Selecione o pet</option>
                @for (pet of pets(); track pet.id) {
                  <option [value]="pet.id">{{ pet.name }}</option>
                }
              </select>
            </div>
            <!-- Título -->
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Título</label>
              <input
                type="text"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ex: Vacina antirrábica"
                [value]="formTitle()"
                (input)="formTitle.set($any($event.target).value)"
              />
            </div>
            <!-- Tipo + Data -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
                <select
                  class="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  (change)="formType.set($any($event.target).value)"
                >
                  @for (t of typeOptions; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Data e hora</label>
                <input
                  type="datetime-local"
                  class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formDueDate()"
                  (input)="formDueDate.set($any($event.target).value)"
                />
              </div>
            </div>
            <!-- Notas -->
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Notas (opcional)</label>
              <input
                type="text"
                class="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Informações adicionais"
                [value]="formNotes()"
                (input)="formNotes.set($any($event.target).value)"
              />
            </div>
            <!-- Ações -->
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
            <div class="h-20 animate-pulse rounded-pet bg-gray-200"></div>
          }
        </div>
      } @else if (!filtered().length) {
        <ui-card [className]="'p-10 text-center'">
          <app-icon name="bell" [size]="40" class="mx-auto text-gray-300" />
          <p class="mt-3 text-sm text-gray-500">Nenhum lembrete encontrado.</p>
          <ui-button type="button" [className]="'mt-4 rounded-full'" (click)="showForm.set(true)">
            Criar primeiro lembrete
          </ui-button>
        </ui-card>
      } @else {
        <div class="flex flex-col gap-3">
          @for (reminder of filtered(); track reminder.id) {
            <div
              class="flex items-start gap-3 rounded-pet border bg-white p-4 shadow-pet transition-opacity"
              [class.opacity-50]="reminder.done"
            >
              <!-- Ícone do tipo -->
              <span class="mt-0.5 text-xl">{{ typeIcon(reminder.type) }}</span>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-medium text-text" [class.line-through]="reminder.done">
                      {{ reminder.title }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500">
                      {{ typeLabel(reminder.type) }} · {{ formatDate(reminder.due_date) }}
                    </p>
                    @if (reminder.notes) {
                      <p class="mt-1 text-xs text-gray-600">{{ reminder.notes }}</p>
                    }
                    @if (isOverdue(reminder)) {
                      <span class="mt-1 inline-block rounded-full bg-danger/10 px-2 py-0.5 text-2xs font-medium text-danger">
                        Atrasado
                      </span>
                    } @else if (isDueToday(reminder)) {
                      <span class="mt-1 inline-block rounded-full bg-warning/10 px-2 py-0.5 text-2xs font-medium text-warning">
                        Hoje
                      </span>
                    }
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <button
                      type="button"
                      class="rounded-full p-1.5 transition-colors"
                      [class]="reminder.done
                        ? 'text-success hover:bg-success/10'
                        : 'text-gray-400 hover:bg-gray-100'"
                      (click)="toggleDone(reminder)"
                      [title]="reminder.done ? 'Marcar como pendente' : 'Marcar como feito'"
                    >
                      <app-icon name="check" [size]="16" />
                    </button>
                    <button
                      type="button"
                      class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
                      (click)="remove(reminder.id)"
                      title="Excluir"
                    >
                      <app-icon name="trash" [size]="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class RemindersPage implements OnInit {
  private readonly reminderService = inject(ReminderService);
  private readonly petService = inject(PetService);
  private readonly toast = inject(UiToastService);

  readonly loading = this.reminderService.loading;
  readonly reminders = this.reminderService.reminders;

  pets = signal<PetOption[]>([]);
  selectedPetId = signal<string | null>(null);
  showDone = signal<boolean>(false);
  showForm = signal(false);
  saving = signal(false);

  // Campos do form
  formPetId = signal('');
  formTitle = signal('');
  formType = signal<ReminderType>('vaccination');
  formDueDate = signal('');
  formNotes = signal('');

  readonly filters = [
    { label: 'Pendentes', value: false },
    { label: 'Todos', value: true },
  ];

  readonly typeOptions = [
    { value: 'vaccination' as ReminderType,  label: '💉 Vacinação' },
    { value: 'medication' as ReminderType,   label: '💊 Medicação' },
    { value: 'consultation' as ReminderType, label: '🏥 Consulta' },
    { value: 'other' as ReminderType,        label: '📋 Outro' },
  ];

  readonly filtered = computed(() => {
    let list = this.reminders();
    if (this.selectedPetId()) list = list.filter((r) => r.pet_id === this.selectedPetId());
    if (!this.showDone()) list = list.filter((r) => !r.done);
    return list;
  });

  async ngOnInit() {
    const [list] = await Promise.all([
      this.reminderService.listAllForOwner(),
      this.loadPets(),
    ]);
    return list;
  }

  private async loadPets() {
    const list = await this.petService.listMyPets();
    this.pets.set(list.map((p) => ({ id: p.id, name: p.name })));
  }

  async save() {
    if (!this.formPetId() || !this.formTitle() || !this.formDueDate()) {
      this.toast.show({ message: 'Preencha pet, título e data.', kind: 'danger' });
      return;
    }
    this.saving.set(true);
    try {
      await this.reminderService.create({
        pet_id: this.formPetId(),
        title: this.formTitle(),
        type: this.formType(),
        due_date: new Date(this.formDueDate()).toISOString(),
        repeat_interval: null,
        notes: this.formNotes() || null,
      });
      this.toast.show({ message: 'Lembrete criado!', kind: 'success' });
      this.cancelForm();
    } catch {
      this.toast.show({ message: 'Erro ao criar lembrete.', kind: 'danger' });
    } finally {
      this.saving.set(false);
    }
  }

  cancelForm() {
    this.showForm.set(false);
    this.formTitle.set('');
    this.formPetId.set('');
    this.formDueDate.set('');
    this.formNotes.set('');
  }

  async toggleDone(reminder: Reminder) {
    try {
      await this.reminderService.markDone(reminder.id, !reminder.done);
    } catch {
      this.toast.show({ message: 'Erro ao atualizar lembrete.', kind: 'danger' });
    }
  }

  async remove(id: string) {
    try {
      await this.reminderService.delete(id);
      this.toast.show({ message: 'Lembrete excluído.', kind: 'success' });
    } catch {
      this.toast.show({ message: 'Erro ao excluir.', kind: 'danger' });
    }
  }

  typeLabel(type: ReminderType) { return reminderTypeLabel(type); }
  typeIcon(type: ReminderType) { return reminderTypeIcon(type); }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  isOverdue(r: Reminder) {
    return !r.done && new Date(r.due_date) < new Date();
  }

  isDueToday(r: Reminder) {
    const d = new Date(r.due_date);
    const today = new Date();
    return !r.done
      && d.getFullYear() === today.getFullYear()
      && d.getMonth() === today.getMonth()
      && d.getDate() === today.getDate();
  }
}
