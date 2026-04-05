import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="{{ classes() }}"
      [attr.type]="type()"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false);
  class = input('');

  classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-pet-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none';

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    };

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-white hover:brightness-110',
      secondary: 'bg-secondary text-white hover:brightness-110',
      danger: 'bg-danger text-white hover:brightness-110',
      ghost: 'bg-transparent text-text hover:bg-gray-50 border border-gray-200',
    };

    return [base, sizes[this.size()], variants[this.variant()], this.class()]
      .filter(Boolean)
      .join(' ');
  });
}

