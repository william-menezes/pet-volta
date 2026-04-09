import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanService, type PlanTier } from '@core/plan/plan.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

type PlanCard = {
  tier: PlanTier;
  title: string;
  priceLabel: string;
  description: string;
  bullets: string[];
  highlight?: boolean;
};

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe, UiButtonComponent, UiCardComponent],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 class="font-display text-2xl font-semibold text-text">Planos</h1>
          <p class="mt-1 text-sm text-gray-600">
            Plano atual: <span class="font-semibold text-text">{{ planService.currentPlan() | titlecase }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <ui-button variant="ghost" type="button" (click)="openPortal()" [disabled]="busy()">
            Gerenciar assinatura
          </ui-button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        @for (plan of plans; track plan.tier) {
          <ui-card [className]="cardClass(plan)">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-text">{{ plan.title }}</p>
                <p class="mt-1 text-xs text-gray-600">{{ plan.description }}</p>
              </div>
              @if (plan.tier === planService.currentPlan()) {
                <span class="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-2xs font-semibold text-primary">Atual</span>
              }
            </div>

            <p class="mt-4 font-display text-2xl font-semibold text-text">{{ plan.priceLabel }}</p>

            <ul class="mt-4 space-y-2 text-sm text-gray-700">
              @for (b of plan.bullets; track b) {
                <li class="flex gap-2">
                  <span class="mt-0.5 text-primary">âœ“</span>
                  <span>{{ b }}</span>
                </li>
              }
            </ul>

            <div class="mt-6">
              @if (plan.tier === 'digital') {
                <ui-button type="button" [disabled]="true" [className]="'w-full rounded-full'">
                  Gratuito
                </ui-button>
              } @else if (plan.tier === planService.currentPlan()) {
                <ui-button type="button" [disabled]="true" [className]="'w-full rounded-full'">
                  Plano atual
                </ui-button>
              } @else {
                <ui-button type="button" [className]="'w-full rounded-full'" (click)="startCheckout(plan.tier)" [disabled]="busy()">
                  {{ actionLabel(plan.tier) }}
                </ui-button>
              }
            </div>
          </ui-card>
        }
      </div>

      <p class="mt-8 text-xs text-gray-500">
        Ao assinar, vocÃª pode gerenciar sua assinatura pelo Portal do cliente.
      </p>
    </section>
  `,
})
export class PricingPage {
  private readonly supabase = inject(SupabaseClientService);
  private readonly toast = inject(UiToastService);
  readonly planService = inject(PlanService);

  readonly busy = signal(false);

  readonly plans: PlanCard[] = [
    {
      tier: 'digital',
      title: 'Digital',
      priceLabel: 'R$ 0',
      description: 'Comece de graÃ§a com o essencial.',
      bullets: ['1 pet', '1 foto por pet', 'HistÃ³rico de scan: 7 dias', 'Sem tag fÃ­sica'],
    },
    {
      tier: 'essential',
      title: 'Essential',
      priceLabel: 'R$ 19/mÃªs',
      description: 'Tag QR + alertas em tempo real.',
      bullets: ['1 pet', '2 fotos por pet', 'Tag QR fÃ­sica', 'Realtime e recompensas'],
      highlight: true,
    },
    {
      tier: 'elite',
      title: 'Elite',
      priceLabel: 'R$ 39/mÃªs',
      description: 'Mais pets e co-tutores.',
      bullets: ['3 pets', '10 fotos por pet', 'Co-tutores', 'HistÃ³rico: 365 dias'],
    },
    {
      tier: 'guardian',
      title: 'Guardian',
      priceLabel: 'R$ 59/mÃªs',
      description: 'Tudo liberado para famÃ­lias.',
      bullets: ['5 pets', '10 fotos por pet', 'Co-tutores', 'HistÃ³rico ilimitado'],
    },
  ];

  cardClass(plan: PlanCard) {
    return [
      'p-6',
      'shadow-pet',
      plan.highlight ? 'border border-primary/30 bg-primary/5' : 'border border-gray-200 bg-white',
    ].join(' ');
  }

  actionLabel(target: PlanTier) {
    const current = this.planService.currentPlan();
    const order: PlanTier[] = ['digital', 'essential', 'elite', 'guardian'];
    return order.indexOf(target) > order.indexOf(current) ? 'Fazer upgrade' : 'Fazer downgrade';
  }

  async startCheckout(target: PlanTier) {
    if (this.busy()) return;
    if (target === 'digital') return;

    this.busy.set(true);
    try {
      const { functions } = this.supabase.supabase();
      const { data, error } = await functions.invoke('create-checkout', {
        body: { plan: target },
      });

      if (error || !data?.url) {
        this.toast.show({ message: 'Pagamentos em breve.', kind: 'warning' });
        return;
      }

      window.location.href = data.url as string;
    } catch {
      this.toast.show({ message: 'NÃ£o foi possÃ­vel iniciar o checkout.', kind: 'danger' });
    } finally {
      this.busy.set(false);
    }
  }

  async openPortal() {
    if (this.busy()) return;
    this.busy.set(true);

    try {
      const { functions } = this.supabase.supabase();
      const { data, error } = await functions.invoke('create-portal');

      if (error || !data?.url) {
        this.toast.show({ message: 'Portal indisponÃ­vel no momento.', kind: 'warning' });
        return;
      }

      window.location.href = data.url as string;
    } catch {
      this.toast.show({ message: 'NÃ£o foi possÃ­vel abrir o portal.', kind: 'danger' });
    } finally {
      this.busy.set(false);
    }
  }
}

