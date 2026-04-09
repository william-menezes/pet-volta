import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HealthRecordService } from '@core/health/health-record.service';
import { PlanService } from '@core/plan/plan.service';
import { HealthRecord, healthRecordTypeLabel, HealthRecordType } from '@models/health-record.model';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-health-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, UiCardComponent],
  template: `
    <div>
      <!-- Cabeçalho -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-display text-base font-semibold text-text">Registros de Saúde</h3>
        @if (canCreate()) {
          <ui-button type="button" [className]="'rounded-full text-sm'" (click)="showForm.set(true)">
            + Adicionar
          </ui-button>
        } @else {
          <span class="rounded-full bg-warning/10 px-3 py-1 text-xs text-warning">
            Limite mensal atingido ({{ monthlyCount() }}/{{ planLimits().healthRecordsMonthly }})
          </span>
        }
      </div>

      <!-- Banner upgrade Digital -->
      @if (planLimits().healthRecordsMonthly !== null) {
        <div class="mb-4 rounded-pet-sm bg-primary/5 px-4 py-3 text-sm text-gray-600">
          Plano Digital: {{ monthlyCount() }} / {{ planLimits().healthRecordsMonthly }} registros este mês.
          <a routerLink="/settings" class="ml-1 text-primary underline">Fazer upgrade</a>
        </div>
      }

      <!-- Filtro por tipo -->
      <div class="mb-4 flex gap-2 overflow-x-auto">
        <button
          type="button"
          class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
          [class]="activeFilter() === null ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600'"
          (click)="activeFilter.set(null)"
        >
          Todos
        </button>
        @for (opt of typeOptions; track opt.value) {
          <button
            type="button"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            [class]="activeFilter() === opt.value ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600'"
            (click)="activeFilter.set(opt.value)"
          >
            {{ opt.label }}
          </button>
        }
      </div>

      <!-- Lista de registros -->
      @if (loading()) {
        <div class="flex flex-col gap-2">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 animate-pulse rounded-pet-sm bg-gray-200"></div>
          }
        </div>
      } @else if (!filteredRecords().length) {
        <ui-card [className]="'p-8 text-center'">
          <p class="text-3xl">🩺</p>
          <p class="mt-3 text-sm text-gray-600">Nenhum registro encontrado.</p>
        </ui-card>
      } @else {
        <div class="flex flex-col gap-2">
          @for (record of filteredRecords(); track record.id) {
            <div class="flex items-start gap-3 rounded-pet-sm border border-gray-200 bg-white p-4 shadow-sm">
              <span class="mt-0.5 text-lg" aria-hidden="true">{{ typeEmoji(record.type) }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text">{{ record.title }}</p>
                <p class="text-xs text-gray-500">
                  {{ formatDate(record.date) }}
                  @if (record.veterinarian) { • {{ record.veterinarian }} }
                </p>
                @if (record.notes) {
                  <p class="mt-1 truncate text-xs text-gray-600">{{ record.notes }}</p>
                }
                @if (record.next_date) {
                  <p class="mt-1 text-xs text-primary">Próximo: {{ formatDate(record.next_date) }}</p>
                }
                @if (record.attachment_url) {
                  <a [href]="record.attachment_url" target="_blank" class="mt-1 block text-xs text-primary hover:underline">
                    📎 Ver anexo
                  </a>
                }
              </div>
              <button
                type="button"
                class="shrink-0 rounded-full p-1 text-gray-400 hover:bg-danger/10 hover:text-danger"
                (click)="deleteRecord(record.id)"
                aria-label="Excluir registro"
              >✕</button>
            </div>
          }
        </div>
      }

      <!-- Formulário inline de criação -->
      @if (showForm()) {
        <div class="mt-4 rounded-pet border border-gray-200 bg-white p-5 shadow-pet">
          <h4 class="font-semibold text-text">Novo Registro</h4>

          <form class="mt-4 flex flex-col gap-3" (submit)="$event.preventDefault(); save()">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Tipo *</label>
                <select
                  class="w-full rounded-full border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formType()"
                  (change)="formType.set($any($event.target).value)"
                >
                  @for (opt of typeOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Data *</label>
                <input
                  type="date"
                  required
                  class="w-full rounded-full border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formDate()"
                  (input)="formDate.set($any($event.target).value)"
                />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Título *</label>
              <input
                type="text"
                required
                placeholder="Ex: Antirrábica V10, Consulta de rotina…"
                class="w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                [value]="formTitle()"
                (input)="formTitle.set($any($event.target).value)"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Veterinário</label>
              <input
                type="text"
                placeholder="Nome do veterinário"
                class="w-full rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                [value]="formVet()"
                (input)="formVet.set($any($event.target).value)"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700">Observações</label>
              <textarea
                rows="2"
                class="w-full rounded-pet-sm border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                [value]="formNotes()"
                (input)="formNotes.set($any($event.target).value)"
              ></textarea>
            </div>

            @if (formType() === 'vaccination' || formType() === 'medication') {
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700">Próxima dose / Fim do tratamento</label>
                <input
                  type="date"
                  class="w-full rounded-full border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  [value]="formNextDate()"
                  (input)="formNextDate.set($any($event.target).value)"
                />
              </div>
            }

            <div class="flex justify-end gap-2">
              <ui-button variant="ghost" type="button" [className]="'rounded-full'" (click)="showForm.set(false)">
                Cancelar
              </ui-button>
              <ui-button type="submit" [className]="'rounded-full'" [disabled]="saving()">
                {{ saving() ? 'Salvando…' : 'Salvar Registro' }}
              </ui-button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class HealthListComponent implements OnInit {
  petId = input.required<string>();

  private readonly healthService = inject(HealthRecordService);
  private readonly planService = inject(PlanService);
  private readonly toast = inject(UiToastService);

  loading = signal(true);
  saving = signal(false);
  records = signal<HealthRecord[]>([]);
  canCreate = signal(true);
  monthlyCount = signal(0);
  activeFilter = signal<HealthRecordType | null>(null);
  showForm = signal(false);

  formType = signal<HealthRecordType>('vaccination');
  formTitle = signal('');
  formDate = signal(new Date().toISOString().split('T')[0]);
  formVet = signal('');
  formNotes = signal('');
  formNextDate = signal('');

  planLimits = this.planService.limits;

  typeOptions = this.healthService.typeOptions();

  filteredRecords = () => {
    const filter = this.activeFilter();
    return filter ? this.records().filter((r) => r.type === filter) : this.records();
  };

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const [records, canResult] = await Promise.all([
        this.healthService.listByPet(this.petId()),
        this.healthService.canCreateForPet(this.petId()),
      ]);
      this.records.set(records);
      this.canCreate.set(canResult.allowed);
      this.monthlyCount.set(canResult.monthlyCount);
    } catch {
      this.toast.show({ message: 'Erro ao carregar registros de saúde.', kind: 'danger' });
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    if (this.saving() || !this.formTitle() || !this.formDate()) return;
    this.saving.set(true);
    try {
      await this.healthService.create({
        pet_id: this.petId(),
        type: this.formType(),
        title: this.formTitle(),
        date: this.formDate(),
        next_date: this.formNextDate() || null,
        veterinarian: this.formVet() || null,
        notes: this.formNotes() || null,
        attachment_url: null,
        metadata: {},
      });

      this.toast.show({ message: 'Registro salvo!', kind: 'success' });
      this.showForm.set(false);
      this.resetForm();
      await this.load();
    } catch {
      this.toast.show({ message: 'Erro ao salvar registro.', kind: 'danger' });
    } finally {
      this.saving.set(false);
    }
  }

  async deleteRecord(id: string) {
    try {
      await this.healthService.delete(id);
      this.records.update((rs) => rs.filter((r) => r.id !== id));
      this.toast.show({ message: 'Registro removido.', kind: 'success' });
    } catch {
      this.toast.show({ message: 'Erro ao remover registro.', kind: 'danger' });
    }
  }

  private resetForm() {
    this.formTitle.set('');
    this.formVet.set('');
    this.formNotes.set('');
    this.formNextDate.set('');
    this.formDate.set(new Date().toISOString().split('T')[0]);
    this.formType.set('vaccination');
  }

  typeEmoji(type: HealthRecordType): string {
    switch (type) {
      case 'vaccination':  return '💉';
      case 'consultation': return '🩺';
      case 'medication':   return '💊';
      case 'exam':         return '🔬';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
