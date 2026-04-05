import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hr class="my-4 border-gray-200" />`,
})
export class UiSeparatorComponent {}

