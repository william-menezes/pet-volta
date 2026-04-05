import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastHostComponent } from '@ui/toast/ui-toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastHostComponent],
  template: `
    <ui-toast-host />
    <router-outlet />
  `,
})
export class AppComponent {
}
