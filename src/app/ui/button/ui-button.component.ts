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
  className = input('');

  classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50';

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    };

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-white hover:brightness-110',
      secondary: 'bg-secondary text-white hover:brightness-110',
      danger: 'bg-danger text-white hover:brightness-110',
      ghost: 'border border-gray-200 bg-white/0 text-text hover:bg-primary/5',
    };

    return [base, sizes[this.size()], variants[this.variant()], this.className()]
      .filter(Boolean)
      .join(' ');
  });
}
