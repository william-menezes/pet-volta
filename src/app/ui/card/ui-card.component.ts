import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-pet border border-gray-200 bg-white {{ className() }}">
      <ng-content />
    </div>
  `,
})
export class UiCardComponent {
  className = input('');
}
