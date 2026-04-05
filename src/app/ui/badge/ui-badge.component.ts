import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="{{ classes() }}">
      <ng-content />
    </span>
  `,
})
export class UiBadgeComponent {
  variant = input<BadgeVariant>('neutral');
  class = input('');

  classes = computed(() => {
    const base =
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium';

    const variants: Record<BadgeVariant, string> = {
      primary: 'bg-primary/10 text-primary',
      secondary: 'bg-secondary/10 text-secondary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      danger: 'bg-danger/10 text-danger',
      neutral: 'bg-gray-100 text-gray-700',
    };

    return [base, variants[this.variant()], this.class()].filter(Boolean).join(' ');
  });
}

