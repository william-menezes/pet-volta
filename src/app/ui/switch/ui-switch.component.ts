import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary {{ checked() ? 'bg-primary' : 'bg-gray-200' }}"
      [attr.aria-checked]="checked()"
      role="switch"
      (click)="toggle()"
    >
      <span
        class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
        [class.translate-x-5]="checked()"
        [class.translate-x-1]="!checked()"
      ></span>
    </button>
  `,
})
export class UiSwitchComponent {
  checked = input(false);
  checkedChange = output<boolean>();

  toggle() {
    this.checkedChange.emit(!this.checked());
  }
}

