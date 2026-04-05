import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-medium text-gray-700"
      [attr.aria-label]="alt()"
    >
      @if (src()) {
        <img
          class="h-full w-full object-cover"
          [src]="src()!"
          [alt]="alt()"
          loading="lazy"
        />
      } @else {
        <span>{{ initials() }}</span>
      }
    </div>
  `,
})
export class UiAvatarComponent {
  src = input<string | null>(null);
  alt = input('Avatar');
  name = input<string | null>(null);

  initials = computed(() => {
    const raw = (this.name() ?? '').trim();
    if (!raw) return 'PV';
    const parts = raw.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
  });
}

