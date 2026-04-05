import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="relative {{ class() }}">
      <summary
        class="list-none rounded-pet-sm border border-gray-200 bg-white px-3 py-2 text-sm text-text"
      >
        <ng-content select="[trigger]" />
      </summary>
      <div
        class="absolute right-0 z-10 mt-2 min-w-48 rounded-pet border border-gray-200 bg-white p-2 shadow-sm"
      >
        <ng-content />
      </div>
    </details>
  `,
})
export class UiDropdownComponent {
  class = input('');
}

