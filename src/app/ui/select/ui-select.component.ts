import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select
      class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      [disabled]="disabled()"
      [value]="value()"
      (change)="onChange($any($event.target).value)"
    >
      <ng-content />
    </select>
  `,
})
export class UiSelectComponent {
  disabled = input(false);
  value = model('');

  onChange(nextValue: string) {
    this.value.set(nextValue);
  }
}
