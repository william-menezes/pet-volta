import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'ui-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="rounded-pet border border-gray-200 bg-white p-0 shadow-sm"
      (close)="closed.emit()"
    >
      <div class="border-b border-gray-200 px-5 py-4">
        <h2 class="font-display text-lg font-semibold text-text">
          {{ title() }}
        </h2>
      </div>
      <div class="px-5 py-4">
        <ng-content />
      </div>
      <div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
        <button
          type="button"
          class="h-10 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-text hover:bg-primary/5"
          (click)="close()"
        >
          Fechar
        </button>
      </div>
    </dialog>
  `,
})
export class UiDialogComponent {
  open = input(false);
  title = input('Dialog');
  closed = output<void>();

  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef().nativeElement;
      if (this.open()) {
        if (!dialog.open) dialog.showModal();
      } else {
        if (dialog.open) dialog.close();
      }
    });
  }

  close() {
    this.dialogRef().nativeElement.close();
  }
}
