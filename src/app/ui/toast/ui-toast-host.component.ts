import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiToastService } from './ui-toast.service';

@Component({
  selector: 'ui-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-x-0 top-4 z-50 mx-auto w-full max-w-md px-4">
      <div class="flex flex-col gap-2">
        @for (toast of toasts(); track toast.id) {
          <div
            class="rounded-pet border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="{{ kindClass(toast.kind) }}">{{ toast.message }}</p>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-700"
                (click)="dismiss(toast.id)"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class UiToastHostComponent {
  private readonly toastService = inject(UiToastService);
  toasts = computed(() => this.toastService.toasts());

  dismiss(id: string) {
    this.toastService.dismiss(id);
  }

  kindClass(kind: string | undefined) {
    switch (kind) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-danger';
      default:
        return 'text-text';
    }
  }
}

