import { Injectable, signal } from '@angular/core';

export type UiToast = {
  id: string;
  message: string;
  kind?: 'info' | 'success' | 'warning' | 'danger';
};

@Injectable({ providedIn: 'root' })
export class UiToastService {
  readonly toasts = signal<UiToast[]>([]);

  show(toast: Omit<UiToast, 'id'>) {
    const id = crypto.randomUUID();
    this.toasts.update((current) => [...current, { id, ...toast }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}

