import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="animate-pulse rounded-pet-sm bg-gray-100"
      [style.height]="height()"
      [style.width]="width()"
    ></div>
  `,
})
export class UiSkeletonComponent {
  height = input('16px');
  width = input('100%');
}

