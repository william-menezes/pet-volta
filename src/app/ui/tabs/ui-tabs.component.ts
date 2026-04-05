import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type UiTab = { id: string; label: string };

@Component({
  selector: 'ui-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      <div class="flex gap-2 rounded-pet-sm border border-gray-200 bg-white p-1">
        @for (tab of tabs(); track tab.id) {
          <button
            type="button"
            class="h-9 flex-1 rounded-pet-sm px-3 text-sm font-medium transition-colors"
            [class.bg-gray-100]="tab.id === activeId()"
            [class.text-text]="tab.id === activeId()"
            [class.text-gray-500]="tab.id !== activeId()"
            (click)="setActive(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      <div class="mt-4">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiTabsComponent {
  tabs = input<UiTab[]>([]);
  activeId = input<string>('');
  activeIdChange = output<string>();

  setActive(id: string) {
    this.activeIdChange.emit(id);
  }
}

