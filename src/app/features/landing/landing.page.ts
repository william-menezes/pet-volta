import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <main class="min-h-dvh bg-white">
      <section class="mx-auto max-w-md px-4 pb-10 pt-8">
        <div class="rounded-pet bg-gradient-to-r from-blue-500 to-violet-500 p-0.5">
          <div class="rounded-pet bg-white p-6">
            <p class="font-mono text-xs text-gray-500">Pet Volta • MVP</p>
            <h1 class="mt-3 font-display text-3xl font-semibold tracking-tight text-text">
              Segurança pet com tag QR e perfil digital.
            </h1>
            <p class="mt-3 text-base text-gray-700">
              Mobile-first, acessível e rápido — preparado para SSR e Supabase.
            </p>
            <div class="mt-6 flex gap-3">
              <a
                class="inline-flex items-center justify-center rounded-pet-sm bg-primary px-4 py-3 text-sm font-medium text-white"
                href="/auth/login"
              >
                Entrar
              </a>
              <a
                class="inline-flex items-center justify-center rounded-pet-sm border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-text"
                href="/pricing"
              >
                Ver planos
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class LandingPage {}
