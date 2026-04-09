import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      [attr.id]="id()"
      [attr.name]="name()"
      [attr.type]="type()"
      [attr.placeholder]="placeholder()"
      [disabled]="disabled()"
      [value]="value()"
      (input)="onInput($any($event.target).value)"
    />
  `,
})
export class UiInputComponent {
  id = input<string | null>(null);
  name = input<string | null>(null);
  type = input('text');
  placeholder = input<string | null>(null);
  disabled = input(false);
  value = model('');

  onInput(nextValue: string) {
    this.value.set(nextValue);
  }
}
