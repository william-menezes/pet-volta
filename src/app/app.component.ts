import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const hash = globalThis.location?.hash ?? '';
    const path = globalThis.location?.pathname ?? '/';

    // Supabase recovery sometimes lands on "/" with tokens in the URL hash.
    // Redirect to the reset page so it can consume the hash and set the session.
    if (path === '/' && hash.includes('type=recovery')) {
      void this.router.navigateByUrl(`/auth/reset${hash}`);
    }
  }
}
