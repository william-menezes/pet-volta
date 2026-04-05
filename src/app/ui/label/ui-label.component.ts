import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="mb-1 block text-sm font-medium text-text"
      [attr.for]="for()"
    >
      <ng-content />
    </label>
  `,
})
export class UiLabelComponent {
  for = input<string | null>(null);
}

