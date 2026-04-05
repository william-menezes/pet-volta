import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="min-h-dvh bg-white">
      <section class="mx-auto max-w-3xl px-4 py-10">
        <a routerLink="/" class="text-sm text-primary hover:underline">← Voltar</a>
        <h1 class="mt-4 font-display text-3xl font-semibold text-text">
          Política de Privacidade
        </h1>
        <p class="mt-4 text-gray-700">
          Placeholder. Conteúdo completo será adicionado antes do lançamento.
        </p>
      </section>
    </main>
  `,
})
export class PrivacyPage {}

